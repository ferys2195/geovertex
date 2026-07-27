import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { latLngToUtmWithZone, getUtmZoneFromLongitude, getLatitudeBand } from "../gis";

export type PaperSize = "a4";
export type Orientation = "portrait" | "landscape";
export type BaseMapType = "global" | "osm" | "esri" | "google_satellite";

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  author?: string;
  organization?: string;
  paperSize?: PaperSize;
  orientation?: Orientation;
  baseMap?: BaseMapType;
  showGrid?: boolean;
  showEdgeDistances?: boolean;
  isProTier?: boolean;
  selectedFeatureId?: string | null;
}

export interface MapFeatureExportData {
  id: string;
  type: "Polygon" | "Polyline" | "Marker" | "Circle" | "Rectangle";
  name: string;
  latLngs: [number, number][]; // Array of [lat, lng]
  properties?: Record<string, unknown>;
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

// Web Mercator Tile Helpers for Base Maps
const lon2tile = (lon: number, zoom: number): number => {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
};

const lat2tile = (lat: number, zoom: number): number => {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom));
};

const tile2lon = (x: number, z: number): number => {
  return (x / Math.pow(2, z)) * 360 - 180;
};

const tile2lat = (y: number, z: number): number => {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
};

const getTileUrl = (type: BaseMapType, x: number, y: number, z: number): string => {
  switch (type) {
    case "osm":
      return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    case "esri":
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    case "google_satellite":
      return `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
    case "global":
    default:
      return "";
  }
};

const loadTileImage = (url: string): Promise<HTMLImageElement | null> => {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const renderCartographicMapCanvas = async (
  features: MapFeatureExportData[],
  options: PDFExportOptions
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  const isLandscape = options.orientation === "landscape";
  const width = isLandscape ? 2970 : 2100;
  const height = isLandscape ? 2100 : 2970;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Outer Page Neatline Border (Dual Line)
  const outerMargin = 80;
  const innerMargin = 92;
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 6;
  ctx.strokeRect(outerMargin, outerMargin, width - 2 * outerMargin, height - 2 * outerMargin);
  ctx.lineWidth = 2;
  ctx.strokeRect(innerMargin, innerMargin, width - 2 * innerMargin, height - 2 * innerMargin);

  // Layout Frames
  const mapFrameLeft = 240;
  const mapFrameTop = 260;
  const mapFrameRight = width - 240;
  const mapFrameBottom = height - 600;
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

  const padEasting = eastingSpan * 0.18;
  const padNorthing = northingSpan * 0.18;
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

  // Calculate Numerical Scale (e.g. 1 : 1.500)
  const mapWidthMm = isLandscape ? 297 * (mapFrameWidth / width) : 210 * (mapFrameWidth / width);
  const scaleRatio = Math.round((eastingSpan / (mapWidthMm / 1000)));

  // Clip to Map Frame
  ctx.save();
  ctx.beginPath();
  ctx.rect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);
  ctx.clip();

  // Draw Base Map Background
  const baseMap = options.baseMap || "global";
  if (baseMap === "global") {
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);
  } else {
    // Render Base Map Tiles
    ctx.fillStyle = baseMap === "google_satellite" || baseMap === "esri" ? "#0F172A" : "#E2E8F0";
    ctx.fillRect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);

    try {
      // Calculate tile zoom level
      const latDiff = maxLat - minLat || 0.005;
      const zoom = Math.min(19, Math.max(1, Math.floor(Math.log2(360 / latDiff)) - 1));

      const minTx = lon2tile(minLng, zoom);
      const maxTx = lon2tile(maxLng, zoom);
      const minTy = lat2tile(maxLat, zoom);
      const maxTy = lat2tile(minLat, zoom);

      const tilePromises: { tx: number; ty: number; promise: Promise<HTMLImageElement | null> }[] = [];
      for (let tx = minTx; tx <= maxTx; tx++) {
        for (let ty = minTy; ty <= maxTy; ty++) {
          const url = getTileUrl(baseMap, tx, ty, zoom);
          tilePromises.push({ tx, ty, promise: loadTileImage(url) });
        }
      }

      const loadedTiles = await Promise.all(tilePromises.map((t) => t.promise));
      loadedTiles.forEach((img, idx) => {
        if (!img) return;
        const { tx, ty } = tilePromises[idx];
        const tileNWLon = tile2lon(tx, zoom);
        const tileNWLat = tile2lat(ty, zoom);
        const tileSELon = tile2lon(tx + 1, zoom);
        const tileSELat = tile2lat(ty + 1, zoom);

        const nwUtm = latLngToUtmWithZone({ lat: tileNWLat, lng: tileNWLon }, zoneNumber, hemisphere);
        const seUtm = latLngToUtmWithZone({ lat: tileSELat, lng: tileSELon }, zoneNumber, hemisphere);

        const sx1 = utmToScreenX(nwUtm.easting);
        const sy1 = utmToScreenY(nwUtm.northing);
        const sx2 = utmToScreenX(seUtm.easting);
        const sy2 = utmToScreenY(seUtm.northing);

        ctx.drawImage(img, sx1, sy1, sx2 - sx1, sy2 - sy1);
      });
    } catch {
      // Fallback background on tile failure
    }
  }

  // Render Map Features
  renderFeatures.forEach((feat) => {
    if (feat.latLngs.length === 0) return;
    const projectedSeg = feat.latLngs.map(([lat, lng]) => {
      const { easting, northing } = latLngToUtmWithZone({ lat, lng }, zoneNumber, hemisphere);
      return { x: utmToScreenX(easting), y: utmToScreenY(northing), easting, northing, lat, lng };
    });

    if (feat.type === "Polygon" || feat.type === "Rectangle") {
      ctx.beginPath();
      ctx.moveTo(projectedSeg[0].x, projectedSeg[0].y);
      for (let i = 1; i < projectedSeg.length; i++) {
        ctx.lineTo(projectedSeg[i].x, projectedSeg[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = feat.color ? `${feat.color}40` : "rgba(37, 99, 235, 0.3)";
      ctx.fill();
      ctx.strokeStyle = feat.color || "#2563EB";
      ctx.lineWidth = 7;
      ctx.stroke();

      // Render Segment Edge Distances (if enabled)
      if (options.showEdgeDistances !== false) {
        for (let i = 0; i < projectedSeg.length; i++) {
          const p1 = projectedSeg[i];
          const p2 = projectedSeg[(i + 1) % projectedSeg.length];
          const distMeters = Math.hypot(p2.easting - p1.easting, p2.northing - p1.northing);

          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          ctx.font = "bold 18px sans-serif";
          const text = `${distMeters.toFixed(1)}m`;
          const textMetrics = ctx.measureText(text);

          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.beginPath();
          ctx.roundRect(
            midX - textMetrics.width / 2 - 8,
            midY - 14,
            textMetrics.width + 16,
            26,
            6
          );
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.fillText(text, midX, midY + 5);
        }
      }

      // Render Vertex points with labels P1, P2...
      projectedSeg.forEach((pt, idx) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 11, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#1E3A8A";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Badge label P1, P2...
        ctx.font = "bold 22px monospace";
        const label = `P${idx + 1}`;
        const labelMetrics = ctx.measureText(label);
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(pt.x + 14, pt.y - 24, labelMetrics.width + 12, 28, 4);
        ctx.fill();
        ctx.fillStyle = "#F8FAFC";
        ctx.textAlign = "left";
        ctx.fillText(label, pt.x + 20, pt.y - 4);
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
      ctx.arc(pt.x, pt.y, 18, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  });

  // Render UTM Grid Lines inside Map Frame
  const showGrid = options.showGrid !== false;
  const gridStep = calculateNiceGridStep(eastingSpan, 6);

  if (showGrid) {
    ctx.strokeStyle = baseMap === "google_satellite" || baseMap === "esri" ? "rgba(255, 255, 255, 0.4)" : "rgba(148, 163, 184, 0.45)";
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
  }
  ctx.restore(); // Restore clip

  // Map Frame Border Line
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 6;
  ctx.strokeRect(mapFrameLeft, mapFrameTop, mapFrameWidth, mapFrameHeight);

  // Render Grid Tick Labels outside map frame
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 20px monospace";

  const startGridEasting = Math.ceil(minEasting / gridStep) * gridStep;
  for (let e = startGridEasting; e <= maxEasting; e += gridStep) {
    const sx = utmToScreenX(e);
    if (sx >= mapFrameLeft + 40 && sx <= mapFrameRight - 40) {
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(e)} mE`, sx, mapFrameTop - 16);
      ctx.fillText(`${Math.round(e)} mE`, sx, mapFrameBottom + 32);
    }
  }

  const startGridNorthing = Math.ceil(minNorthing / gridStep) * gridStep;
  for (let n = startGridNorthing; n <= maxNorthing; n += gridStep) {
    const sy = utmToScreenY(n);
    if (sy >= mapFrameTop + 40 && sy <= mapFrameBottom - 40) {
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(n)} mN`, mapFrameLeft - 18, sy + 7);
      ctx.textAlign = "left";
      ctx.fillText(`${Math.round(n)} mN`, mapFrameRight + 18, sy + 7);
    }
  }

  // Header Title Block (Top Outer Area)
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 46px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(options.title || "PETA HASIL DIGITASI SPASIAL", mapFrameLeft, mapFrameTop - 120);

  ctx.fillStyle = "#475569";
  ctx.font = "24px sans-serif";
  ctx.fillText(
    options.subtitle || `Sistem Proyeksi: Transverse Mercator (UTM Zone ${zoneNumber}${bandLetter}) - WGS 84`,
    mapFrameLeft,
    mapFrameTop - 76
  );

  // GeoVertex Brand Badge (Top Right)
  ctx.fillStyle = "#059669";
  ctx.beginPath();
  ctx.roundRect(mapFrameRight - 380, mapFrameTop - 150, 380, 56, 12);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GEOVERTEX KARTOGRAFI", mapFrameRight - 190, mapFrameTop - 114);

  // Footer Information Block (Kop Peta Laporan)
  const footerTop = mapFrameBottom + 75;
  const footerHeight = 420;

  // Kop Box Frame
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 3;
  ctx.strokeRect(mapFrameLeft, footerTop, mapFrameWidth, footerHeight);

  // Calculate Metrics (Area & Perimeter) for target parcel
  let totalArea = 0;
  let totalPerimeter = 0;
  let totalVertexCount = 0;

  renderFeatures.forEach((f) => {
    if (f.areaSqm) totalArea += f.areaSqm;
    if (f.perimeterMeters) totalPerimeter += f.perimeterMeters;
    totalVertexCount += f.latLngs.length;
  });

  // Left Column: Metadata & Statistics
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("INFORMASI SPASIAL & KARTOGRAFI", mapFrameLeft + 30, footerTop + 48);

  ctx.font = "22px sans-serif";
  ctx.fillStyle = "#334155";
  ctx.fillText(`Luas Total Lahan: ${totalArea.toLocaleString("id-ID", { maximumFractionDigits: 1 })} m² (${(totalArea / 10000).toFixed(3)} Ha)`, mapFrameLeft + 30, footerTop + 96);
  ctx.fillText(`Keliling Lahan: ${totalPerimeter.toFixed(1)} meter (${totalVertexCount} Titik Vertex)`, mapFrameLeft + 30, footerTop + 138);
  ctx.fillText(`Pembuat / Drafter: ${options.author || "GeoVertex User"}`, mapFrameLeft + 30, footerTop + 180);
  ctx.fillText(`Organisasi / Tim: ${options.organization || "Surveyor Team"}`, mapFrameLeft + 30, footerTop + 222);
  ctx.fillText(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, mapFrameLeft + 30, footerTop + 264);
  ctx.fillText(`Pusat Koordinat: ${centerLat.toFixed(6)}°, ${centerLng.toFixed(6)}°`, mapFrameLeft + 30, footerTop + 306);
  ctx.fillText(`Sistem Datum: WGS 1984 | Zona UTM: ${zoneNumber}${bandLetter} (${hemisphere.toUpperCase()})`, mapFrameLeft + 30, footerTop + 348);

  // Divider Line
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mapFrameLeft + mapFrameWidth * 0.54, footerTop + 20);
  ctx.lineTo(mapFrameLeft + mapFrameWidth * 0.54, footerTop + footerHeight - 20);
  ctx.stroke();

  // Middle Column: Stylized Cartographic North Arrow Graphic
  const northArrowCenterX = mapFrameLeft + mapFrameWidth * 0.65;
  const northArrowCenterY = footerTop + 180;

  // Outer Ring
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(northArrowCenterX, northArrowCenterY, 60, 0, 2 * Math.PI);
  ctx.stroke();

  // Dark Spear (Left half)
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.moveTo(northArrowCenterX, northArrowCenterY - 75);
  ctx.lineTo(northArrowCenterX - 22, northArrowCenterY + 35);
  ctx.lineTo(northArrowCenterX, northArrowCenterY + 15);
  ctx.closePath();
  ctx.fill();

  // Light Spear (Right half)
  ctx.fillStyle = "#94A3B8";
  ctx.beginPath();
  ctx.moveTo(northArrowCenterX, northArrowCenterY - 75);
  ctx.lineTo(northArrowCenterX + 22, northArrowCenterY + 35);
  ctx.lineTo(northArrowCenterX, northArrowCenterY + 15);
  ctx.closePath();
  ctx.fill();

  // Labels U (Utara) / N (North)
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 38px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("U", northArrowCenterX, northArrowCenterY - 86);
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("NORTH", northArrowCenterX, northArrowCenterY + 80);

  // Right Column: Scale Bar & Legend Box
  const scaleBarLeft = mapFrameLeft + mapFrameWidth * 0.74;
  const { length: scaleVal, unit: scaleUnit } = calculateScaleBarLength(eastingSpan);

  ctx.textAlign = "left";
  ctx.font = "bold 26px sans-serif";
  ctx.fillStyle = "#0F172A";
  ctx.fillText("SKALA & LEGENDA", scaleBarLeft, footerTop + 48);

  ctx.font = "bold 22px monospace";
  ctx.fillStyle = "#0284C7";
  ctx.fillText(`SKALA 1 : ${scaleRatio.toLocaleString("id-ID")}`, scaleBarLeft, footerTop + 88);

  // Scale Bar Graphic
  const scaleBarY = footerTop + 130;
  const scalePixelWidth = (scaleVal / eastingSpan) * mapFrameWidth;

  // Alternate segment blocks
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(scaleBarLeft, scaleBarY, scalePixelWidth / 2, 18);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(scaleBarLeft + scalePixelWidth / 2, scaleBarY, scalePixelWidth / 2, 18);
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 3;
  ctx.strokeRect(scaleBarLeft, scaleBarY, scalePixelWidth, 18);

  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#1E293B";
  ctx.fillText(`0`, scaleBarLeft - 6, scaleBarY + 44);
  ctx.fillText(`${scaleVal / 2}`, scaleBarLeft + scalePixelWidth / 2 - 12, scaleBarY + 44);
  ctx.fillText(`${scaleVal} ${scaleUnit}`, scaleBarLeft + scalePixelWidth - 20, scaleBarY + 44);

  // Legend Items
  let legendY = footerTop + 225;
  renderFeatures.slice(0, 4).forEach((feat) => {
    ctx.fillStyle = feat.color || "#2563EB";
    ctx.fillRect(scaleBarLeft, legendY, 34, 22);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2;
    ctx.strokeRect(scaleBarLeft, legendY, 34, 22);

    ctx.fillStyle = "#0F172A";
    ctx.font = "20px sans-serif";
    ctx.fillText(`${feat.name} (${feat.type})`, scaleBarLeft + 46, legendY + 17);
    legendY += 38;
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
  const isLandscape = options.orientation === "landscape";
  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  // 1. Render Page 1 Map Canvas
  const canvas = await renderCartographicMapCanvas(features, options);
  const imgData = canvas.toDataURL("image/png");

  const pdfWidth = isLandscape ? 297 : 210;
  const pdfHeight = isLandscape ? 210 : 297;

  // Page 1: Cartographic Map Report Image
  doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  // 2. Page 2: Cadastral Spatial Vertex Coordinates Table
  doc.addPage("a4", "portrait");

  // Header Page 2
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("TABEL KOORDINAT VERTEX KADASTRAL", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Proyek: ${options.title || "GeoVertex Export"} | Tanggal: ${new Date().toLocaleDateString("id-ID")}`,
    14,
    27
  );

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

      // Segment distance to next point
      const nextPt = feat.latLngs[(ptIdx + 1) % feat.latLngs.length];
      const nextUtm = latLngToUtmWithZone({ lat: nextPt[0], lng: nextPt[1] }, zoneNumber, hemisphere);
      const segLength = Math.hypot(nextUtm.easting - easting, nextUtm.northing - northing);

      tableData.push([
        `P${ptIdx + 1}`,
        feat.name || `Bidang #${featIdx + 1}`,
        `P${ptIdx + 1} - P${((ptIdx + 1) % feat.latLngs.length) + 1}`,
        segLength.toFixed(2),
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
    head: [
      [
        "Point",
        "Nama Bidang / Layer",
        "Sisi Segmen",
        "Jarak (m)",
        "UTM Easting (X)",
        "UTM Northing (Y)",
        "Latitude",
        "Longitude",
        "Zona UTM",
      ],
    ],
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

  // Footer Signature Block on Page 2
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 200;
  if (finalY + 50 < 280) {
    const sigY = finalY + 25;
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    doc.text("Disetujui Oleh,", 25, sigY);
    doc.text("Pengukur / Surveyor Lapangan,", 135, sigY);

    doc.text("( ______________________ )", 25, sigY + 30);
    doc.text(`( ${options.author || "Drafter Pemetaan"} )`, 135, sigY + 30);
  }

  const fileName = `${(options.title || "GeoVertex_Map").replace(/\s+/g, "_")}_Cartographic_v1.0.pdf`;
  doc.save(fileName);
};
