import { MapFeatureExportData } from "./pdfExporter";
import { latLngToUtmWithZone, getUtmZoneFromLongitude } from "../utm";

// 1. GeoJSON Exporter
export const exportToGeoJSON = (features: MapFeatureExportData[], title = "GeoVertex_Export"): void => {
  const geojson = {
    type: "FeatureCollection",
    name: title,
    features: features.map((feat) => {
      let geometry: any;
      if (feat.type === "Polygon" || feat.type === "Rectangle") {
        const coords = feat.latLngs.map(([lat, lng]) => [lng, lat]);
        // Close polygon ring if needed
        if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push(coords[0]);
        }
        geometry = { type: "Polygon", coordinates: [coords] };
      } else if (feat.type === "Polyline") {
        geometry = { type: "LineString", coordinates: feat.latLngs.map(([lat, lng]) => [lng, lat]) };
      } else {
        const pt = feat.latLngs[0] || [0, 0];
        geometry = { type: "Point", coordinates: [pt[1], pt[0]] };
      }

      return {
        type: "Feature",
        properties: {
          id: feat.id,
          name: feat.name,
          featureType: feat.type,
          areaSqm: feat.areaSqm || null,
          perimeterMeters: feat.perimeterMeters || null,
          ...feat.properties,
        },
        geometry,
      };
    }),
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
  downloadBlob(blob, `${title}.geojson`);
};

// 2. GPX Exporter
export const exportToGPX = (features: MapFeatureExportData[], title = "GeoVertex_Export"): void => {
  let gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GeoVertex SaaS" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(title)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>\n`;

  features.forEach((feat) => {
    if (feat.type === "Marker") {
      const [lat, lon] = feat.latLngs[0] || [0, 0];
      gpxXml += `  <wpt lat="${lat}" lon="${lon}">\n    <name>${escapeXml(feat.name)}</name>\n  </wpt>\n`;
    } else {
      gpxXml += `  <trk>\n    <name>${escapeXml(feat.name)}</name>\n    <trkseg>\n`;
      feat.latLngs.forEach(([lat, lon]) => {
        gpxXml += `      <trkpt lat="${lat}" lon="${lon}" />\n`;
      });
      gpxXml += `    </trkseg>\n  </trk>\n`;
    }
  });

  gpxXml += `</gpx>`;
  const blob = new Blob([gpxXml], { type: "application/gpx+xml" });
  downloadBlob(blob, `${title}.gpx`);
};

// 3. KML Exporter
export const exportToKML = (features: MapFeatureExportData[], title = "GeoVertex_Export"): void => {
  let kmlXml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>\n`;

  features.forEach((feat) => {
    kmlXml += `    <Placemark>\n      <name>${escapeXml(feat.name)}</name>\n`;
    if (feat.type === "Polygon" || feat.type === "Rectangle") {
      const coords = feat.latLngs.map(([lat, lng]) => `${lng},${lat},0`).join(" ");
      kmlXml += `      <Polygon>\n        <outerBoundaryIs>\n          <LinearRing>\n            <coordinates>${coords}</coordinates>\n          </LinearRing>\n        </outerBoundaryIs>\n      </Polygon>\n`;
    } else if (feat.type === "Polyline") {
      const coords = feat.latLngs.map(([lat, lng]) => `${lng},${lat},0`).join(" ");
      kmlXml += `      <LineString>\n        <coordinates>${coords}</coordinates>\n      </LineString>\n`;
    } else {
      const [lat, lon] = feat.latLngs[0] || [0, 0];
      kmlXml += `      <Point>\n        <coordinates>${lon},${lat},0</coordinates>\n      </Point>\n`;
    }
    kmlXml += `    </Placemark>\n`;
  });

  kmlXml += `  </Document>\n</kml>`;
  const blob = new Blob([kmlXml], { type: "application/vnd.google-earth.kml+xml" });
  downloadBlob(blob, `${title}.kml`);
};

// 4. CSV Vertex Exporter
export const exportToCSV = (features: MapFeatureExportData[], title = "GeoVertex_Export"): void => {
  let csv = `Point_ID,Feature_Name,Type,Easting_X,Northing_Y,Latitude,Longitude,UTM_Zone\n`;

  features.forEach((feat) => {
    feat.latLngs.forEach(([lat, lng], idx) => {
      const zoneNumber = getUtmZoneFromLongitude(lng);
      const hemisphere = lat >= 0 ? "north" : "south";
      const { easting, northing } = latLngToUtmWithZone({ lat, lng }, zoneNumber, hemisphere);
      csv += `P${idx + 1},"${feat.name}",${feat.type},${easting.toFixed(2)},${northing.toFixed(2)},${lat.toFixed(6)},${lng.toFixed(6)},${zoneNumber}\n`;
    });
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${title}_Vertices.csv`);
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
};
