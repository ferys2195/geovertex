import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { latLngToUtmWithZone, getUtmZoneFromLongitude, getLatitudeBand } from "../utm";

export type PaperSize = "a4";
export type Orientation = "portrait" | "landscape";
export type BaseMapType = "global" | "esri" | "osm";

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  author?: string;
  organization?: string;
  paperSize?: PaperSize;
  orientation?: Orientation;
  baseMap?: BaseMapType;
  showGrid?: boolean;
  isProTier?: boolean;
  selectedFeatureId?: string | null;
}

export interface MapFeatureExportData {
  id: string;
  type: "Polygon" | "Polyline" | "Marker" | "Circle" | "Rectangle";
  name: string;
  latLngs: [number, number][]; // Array of [lat, lng]
  properties?: Record<string, any>;
  areaSqm?: number;
  perimeterMeters?: number;
  color?: string;
}

const calculateNiceGridStep = (range: number, targetTicks = 5): number => {
  if (range <= 0) return 100;
  const roughStep = range / targetTicks;
  const exponent = Math.floor(Math.log10(roughStep));
  const fraction = roughStep / Math.pow(10, exponent);

  let niceFraction: number;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;

  const result = niceFraction * Math.pow(10, exponent);
  return Math.max(result, 10);
};

const calculateScaleBarLength = (mapWidthMeters: number): { length: number; unit: string; divisions: number } => {
  const targetScaleWidth = mapWidthMeters * 0.25;
  const length = calculateNiceGridStep(targetScaleWidth, 1);
  if (length >= 1000) {
    return { length, unit: "km", divisions: 4 };
  }
  return { length, unit: "m", divisions: 4 };
};

export const renderCartographicMapCanvas = async (
  features: MapFeatureExportData[],
  options: PDFExportOptions
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  const width = options.orientation === "landscape" ? 2970 : 2100;
  const height = options.orientation === "landscape" ? 2100 : 2970;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Outer Page Border
  const pageMargin = 90;
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 4;
  ctx.strokeRect(pageMargin, pageMargin, width - 2 * pageMargin, height - 2 * pageMargin);

  // Layout Frames
  const mapFrameLeft = 240;
  const mapFrameTop = 240;
  const mapFrameRight = width - 240;
  const mapFrameBottom = height - 560;
  const mapFrameWidth = mapFrameRight - mapFrameLeft;
  const mapFrameHeight = mapFrameBottom - mapFrameTop;

  // Filter features if specific feature is selected for PDF export
  const targetFeatures = options.selectedFeatureId
    ? features.filter((f) => f.id === options.selectedFeatureId)
    : features;
  const renderFeatures = targetFeatures.length > 0 ? targetFeatures : features;

  // Extract all points from target features for bounds calculation
  const allPoints: [number, number][] = [];
  renderFeatures.forEach((f) => {
    f.latLngs.forEach((pt) => allPoints.push(pt));
  });

  if (allPoints.length === 0) {
    // Default fallback view if no features
    allPoints.push([-6.2, 106.816666]);
  }

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  allPoints.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const zoneNumber = getUtmZoneFromLongitude(centerLng);
  const hemisphere = centerLat >= 0 ? "north" : "south";
  const bandLetter = getLatitudeBand(centerLat) || "M";

  // Project to UTM
  const utmPoints = allPoints.map(([lat, lng]) => {
    const { easting, northing } = latLngToUtmWithZone({ lat, lng }, zoneNumber, hemisphere);
    return { lat, lng, easting, northing };
  });

  let minEasting = Infinity, maxEasting = -Infinity, minNorthing = Infinity, maxNorthing = -Infinity;
  utmPoints.forEach((pt) => {
    if (pt.easting < minEasting) minEasting = pt.easting;
    if (pt.easting > maxEasting) maxEasting = pt.easting;
    if (pt.northing < minNorthing) minNorthing = pt.northing;
    if (pt.northing > maxNorthing) maxNorthing = pt.northing;
  });

  let eastingSpan = maxEasting - minEasting;
  let northingSpan = maxNorthing - minNorthing;
  if (eastingSpan <= 0) eastingSpan = 500;
  if (northingSpan <= 0) northingSpan = 500;

  const padEasting = eastingSpan * 0.15;
  const padNorthing = northingSpan * 0.15;
  minEasting -= padEasting;
  maxEasting += padEasting;
  minNorthing -= padNorthing;
  maxNorthing += padNorthing;

  eastingSpan = maxEasting - minEasting;
  northingSpan = maxNorthing - minNorthing;

  const frameAspect = mapFrameWidth / mapFrameHeight;
  const dataAspect = eastingSpan / northingSpan;

  if (dataAspect < frameAspect) {
    const targetEastingSpan = northingSpan * frameAspect;
    const diff = targetEastingSpan - eastingSpan;
    minEasting -= diff / 2;
    maxEasting += diff / 2;
    eastingSpan = targetEastingSpan;
  } else {
    const targetNorthingSpan = eastingSpan / frameAspect;
    const diff = targetNorthingSpan - northingSpan;
    minNorthing -= diff / 2;
    maxNorthing += diff / 2;
    northingSpan = targetNorthingSpan;
  }

  const utmToScreenX = (easting: number) => mapFrameLeft + ((easting - minEasting) / eastingSpan) * mapFrameWidth;
  const utmToScreenY = (northing: number) => mapFrameBottom - ((northing - minNorthing) / northingSpan) * mapFrameHeight;

  // Clip to Map Frame
  ctx.save();
  ctx.beginPath();
  ctx.rect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);
  ctx.clip();

  // Draw Map Background Grid/Fill
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);

  // Render Features
  features.forEach((feat) => {
    if (feat.latLngs.length === 0) return;
    const projectedSeg = feat.latLngs.map(([lat, lng]) => {
      const { easting, northing } = latLngToUtmWithZone({ lat, lng }, zoneNumber, hemisphere);
      return { x: utmToScreenX(easting), y: utmToScreenY(northing) };
    });

    if (feat.type === "Polygon" || feat.type === "Rectangle") {
      ctx.beginPath();
      ctx.moveTo(projectedSeg[0].x, projectedSeg[0].y);
      for (let i = 1; i < projectedSeg.length; i++) {
        ctx.lineTo(projectedSeg[i].x, projectedSeg[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = feat.color ? `${feat.color}33` : "rgba(37, 99, 235, 0.25)";
      ctx.fill();
      ctx.strokeStyle = feat.color || "#2563EB";
      ctx.lineWidth = 6;
      ctx.stroke();

      // Render Vertex points
      projectedSeg.forEach((pt, idx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#1E3A8A";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "#0F172A";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(`P${idx + 1}`, pt.x + 14, pt.y - 14);
      });
    } else if (feat.type === "Polyline") {
      ctx.beginPath();
      ctx.moveTo(projectedSeg[0].x, projectedSeg[0].y);
      for (let i = 1; i < projectedSeg.length; i++) {
        ctx.lineTo(projectedSeg[i].x, projectedSeg[i].y);
      }
      ctx.strokeStyle = feat.color || "#059669";
      ctx.lineWidth = 6;
      ctx.stroke();
    } else if (feat.type === "Marker") {
      const pt = projectedSeg[0];
      ctx.fillStyle = feat.color || "#DC2626";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 16, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  });

  // Render UTM Grid Lines inside Map Frame
  const gridStep = calculateNiceGridStep(eastingSpan, 6);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);

  const startGridEasting = Math.ceil(minEasting / gridStep) * gridStep;
  for (let e = startGridEasting; e <= maxEasting; e += gridStep) {
    const sx = utmToScreenX(e);
    ctx.beginPath();
    ctx.moveTo(sx, mapFrameTop);
    ctx.lineTo(sx, mapFrameBottom);
    ctx.stroke();
  }

  const startGridNorthing = Math.ceil(minNorthing / gridStep) * gridStep;
  for (let n = startGridNorthing; n <= maxNorthing; n += gridStep) {
    const sy = utmToScreenY(n);
    ctx.beginPath();
    ctx.moveTo(mapFrameLeft, sy);
    ctx.lineTo(mapFrameRight, sy);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore(); // Restore clip

  // Map Frame Border Line
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 5;
  ctx.strokeRect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);

  // Render Grid Tick Labels outside map frame
  ctx.fillStyle = "#334155";
  ctx.font = "bold 20px monospace";

  // Easting Ticks (Top & Bottom)
  for (let e = startGridEasting; e <= maxEasting; e += gridStep) {
    const sx = utmToScreenX(e);
    if (sx >= mapFrameLeft + 40 && sx <= mapFrameRight - 40) {
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(e)} mE`, sx, mapFrameTop - 16);
      ctx.fillText(`${Math.round(e)} mE`, sx, mapFrameBottom + 32);
    }
  }

  // Northing Ticks (Left & Right)
  for (let n = startGridNorthing; n <= maxNorthing; n += gridStep) {
    const sy = utmToScreenY(n);
    if (sy >= mapFrameTop + 40 && sy <= mapFrameBottom - 40) {
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(n)} mN`, mapFrameLeft - 16, sy + 6);
      ctx.textAlign = "left";
      ctx.fillText(`${Math.round(n)} mN`, mapFrameRight + 16, sy + 6);
    }
  }

  // Header Title Block (Top Outer Area)
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(options.title || "PETA HASIL DIGITASI SPASIAL", mapFrameLeft, mapFrameTop - 110);

  ctx.fillStyle = "#475569";
  ctx.font = "24px sans-serif";
  ctx.fillText(
    options.subtitle || `Sistem Proyeksi: Transverse Mercator (UTM Zone ${zoneNumber}${bandLetter}) - WGS 84`,
    mapFrameLeft,
    mapFrameTop - 70
  );

  // Footer Information Block (Bottom Frame Area)
  const footerTop = mapFrameBottom + 70;

  // Title Block Box
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 2;
  ctx.strokeRect(mapFrameLeft, footerTop, mapFrameWidth, 380);

  // Left Column: Metadata
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("INFORMASI PETA & KARTOGRAFI", mapFrameLeft + 30, footerTop + 50);

  ctx.font = "22px sans-serif";
  ctx.fillStyle = "#334155";
  ctx.fillText(`Pembuat / Author: ${options.author || "GeoVertex SaaS User"}`, mapFrameLeft + 30, footerTop + 100);
  ctx.fillText(`Organisasi / Tim: ${options.organization || "GeoVertex Workspace"}`, mapFrameLeft + 30, footerTop + 140);
  ctx.fillText(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, mapFrameLeft + 30, footerTop + 180);
  ctx.fillText(`Pusat Koordinat: ${centerLat.toFixed(6)}°, ${centerLng.toFixed(6)}°`, mapFrameLeft + 30, footerTop + 220);
  ctx.fillText(`Sistem Datum: WGS 1984 | Zona UTM: ${zoneNumber}${bandLetter} (${hemisphere.toUpperCase()})`, mapFrameLeft + 30, footerTop + 260);

  // Middle Column: North Arrow Graphic
  const northArrowCenterX = mapFrameLeft + mapFrameWidth * 0.58;
  const northArrowCenterY = footerTop + 160;

  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.moveTo(northArrowCenterX, northArrowCenterY - 70);
  ctx.lineTo(northArrowCenterX - 24, northArrowCenterY + 40);
  ctx.lineTo(northArrowCenterX, northArrowCenterY + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#94A3B8";
  ctx.beginPath();
  ctx.moveTo(northArrowCenterX, northArrowCenterY - 70);
  ctx.lineTo(northArrowCenterX + 24, northArrowCenterY + 40);
  ctx.lineTo(northArrowCenterX, northArrowCenterY + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("U", northArrowCenterX, northArrowCenterY - 82);
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("NORTH", northArrowCenterX, northArrowCenterY + 70);

  // Right Column: Scale Bar & Legend
  const scaleBarLeft = mapFrameLeft + mapFrameWidth * 0.72;
  const { length: scaleVal, unit: scaleUnit } = calculateScaleBarLength(eastingSpan);

  ctx.textAlign = "left";
  ctx.font = "bold 24px sans-serif";
  ctx.fillStyle = "#0F172A";
  ctx.fillText("SKALA BARR & LEGENDA", scaleBarLeft, footerTop + 50);

  // Draw Scale Bar Graphic
  const scaleBarY = footerTop + 110;
  const scalePixelWidth = (scaleVal / eastingSpan) * mapFrameWidth;
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(scaleBarLeft, scaleBarY, scalePixelWidth / 2, 16);
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 3;
  ctx.strokeRect(scaleBarLeft, scaleBarY, scalePixelWidth, 16);

  ctx.font = "20px monospace";
  ctx.fillText(`0`, scaleBarLeft - 6, scaleBarY + 42);
  ctx.fillText(`${scaleVal / 2}`, scaleBarLeft + scalePixelWidth / 2 - 12, scaleBarY + 42);
  ctx.fillText(`${scaleVal} ${scaleUnit}`, scaleBarLeft + scalePixelWidth - 20, scaleBarY + 42);

  // Legend Items
  let legendY = footerTop + 195;
  features.slice(0, 4).forEach((feat) => {
    ctx.fillStyle = feat.color || "#2563EB";
    ctx.fillRect(scaleBarLeft, legendY, 32, 20);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2;
    ctx.strokeRect(scaleBarLeft, legendY, 32, 20);

    ctx.fillStyle = "#1E293B";
    ctx.font = "20px sans-serif";
    ctx.fillText(`${feat.name} (${feat.type})`, scaleBarLeft + 44, legendY + 16);
    legendY += 34;
  });

  // Free Tier Watermark
  if (!options.isProTier) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((-30 * Math.PI) / 180);
    ctx.fillStyle = "rgba(203, 213, 225, 0.35)";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GeoVertex SaaS (Free Tier)", 0, 0);
    ctx.restore();
  }

  return canvas;
};

export const exportCartographicPDF = async (
  features: MapFeatureExportData[],
  options: PDFExportOptions = {}
): Promise<void> => {
  const doc = new jsPDF({
    orientation: options.orientation || "portrait",
    unit: "mm",
    format: "a4",
  });

  // 1. Render Map Canvas
  const canvas = await renderCartographicMapCanvas(features, options);
  const imgData = canvas.toDataURL("image/png");

  // Page 1: Cartographic Map Image
  doc.addImage(imgData, "PNG", 0, 0, 210, 297);

  // 2. Page 2+: Detailed Vertex Coordinates Table
  doc.addPage("a4", "portrait");

  // Header for Table Page
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("TABEL KOORDINAT VERTEX SPASIAL", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Proyek: ${options.title || "GeoVertex Export"} | Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);

  const tableFeatures = options.selectedFeatureId
    ? features.filter((f) => f.id === options.selectedFeatureId)
    : features;
  const renderTableFeatures = tableFeatures.length > 0 ? tableFeatures : features;

  const tableData: (string | number)[][] = [];

  renderTableFeatures.forEach((feat, featIdx) => {
    feat.latLngs.forEach((pt, ptIdx) => {
      const lat = pt[0];
      const lng = pt[1];
      const zoneNumber = getUtmZoneFromLongitude(lng);
      const hemisphere = lat >= 0 ? "north" : "south";
      const { easting, northing } = latLngToUtmWithZone({ lat, lng }, zoneNumber, hemisphere);

      tableData.push([
        `P${ptIdx + 1}`,
        feat.name || `Feature #${featIdx + 1}`,
        feat.type,
        easting.toFixed(2),
        northing.toFixed(2),
        lat.toFixed(6),
        lng.toFixed(6),
        `${zoneNumber}${getLatitudeBand(lat)}`,
      ]);
    });
  });

  autoTable(doc, {
    startY: 34,
    head: [["Point", "Nama Layer / Lahan", "Tipe", "UTM Easting (X)", "UTM Northing (Y)", "Latitude", "Longitude", "Zona UTM"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  const fileName = `${(options.title || "GeoVertex_Map").replace(/\s+/g, "_")}_Cartographic_v1.0.pdf`;
  doc.save(fileName);
};
