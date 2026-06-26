/**
 * GPX (GPS Exchange Format) Parser and Writer Utility.
 * Uses native browser DOMParser and XML string compilation. No heavy dependencies.
 */

import { FeatureCollection, Feature, Geometry } from 'geojson';

/**
 * Converts a GPX XML String into a GeoJSON FeatureCollection
 */
export function gpxToGeoJSON(gpxText: string): FeatureCollection {
  const parser = new DOMParser();
  const xml = parser.parseFromString(gpxText, 'application/xml');

  // Verify parsing didn't fail
  const parserError = xml.querySelector('parsererror');
  if (parserError) {
    throw new Error('Format file GPX tidak valid atau XML bermasalah.');
  }

  const features: Feature[] = [];

  // 1. Parse Waypoints (<wpt>) -> GeoJSON Points
  const waypoints = xml.querySelectorAll('wpt');
  waypoints.forEach((wpt, idx) => {
    const lat = parseFloat(wpt.getAttribute('lat') || '0');
    const lon = parseFloat(wpt.getAttribute('lon') || '0');
    if (isNaN(lat) || isNaN(lon)) return;

    const name = wpt.querySelector('name')?.textContent || `Waypoint ${idx + 1}`;
    const desc = wpt.querySelector('desc')?.textContent || '';
    const ele = wpt.querySelector('ele') ? parseFloat(wpt.querySelector('ele')?.textContent || '0') : undefined;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: ele !== undefined ? [lon, lat, ele] : [lon, lat],
      },
      properties: {
        name,
        description: desc,
        gpxType: 'waypoint',
      },
    });
  });

  // 2. Parse Tracks (<trk>) -> GeoJSON LineStrings
  const tracks = xml.querySelectorAll('trk');
  tracks.forEach((trk, trkIdx) => {
    const name = trk.querySelector('name')?.textContent || `Track ${trkIdx + 1}`;
    const desc = trk.querySelector('desc')?.textContent || '';
    const segments = trk.querySelectorAll('trkseg');

    segments.forEach((seg) => {
      const points = seg.querySelectorAll('trkpt');
      const coordinates: number[][] = [];

      points.forEach((pt) => {
        const lat = parseFloat(pt.getAttribute('lat') || '0');
        const lon = parseFloat(pt.getAttribute('lon') || '0');
        if (isNaN(lat) || isNaN(lon)) return;

        const ele = pt.querySelector('ele') ? parseFloat(pt.querySelector('ele')?.textContent || '') : undefined;
        if (ele !== undefined && !isNaN(ele)) {
          coordinates.push([lon, lat, ele]);
        } else {
          coordinates.push([lon, lat]);
        }
      });

      if (coordinates.length > 0) {
        // Check if track is a polygon (e.g. self-closing track loop exported from Polygon)
        const isClosed = coordinates.length > 3 &&
          coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
          coordinates[0][1] === coordinates[coordinates.length - 1][1];

        features.push({
          type: 'Feature',
          geometry: {
            type: isClosed ? 'Polygon' : 'LineString',
            coordinates: isClosed ? [coordinates] : coordinates,
          } as any,
          properties: {
            name,
            description: desc,
            gpxType: 'track',
          },
        });
      }
    });
  });

  // 3. Parse Routes (<rte>) -> GeoJSON LineStrings
  const routes = xml.querySelectorAll('rte');
  routes.forEach((rte, rteIdx) => {
    const name = rte.querySelector('name')?.textContent || `Route ${rteIdx + 1}`;
    const desc = rte.querySelector('desc')?.textContent || '';
    const points = rte.querySelectorAll('rtept');
    const coordinates: number[][] = [];

    points.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute('lat') || '0');
      const lon = parseFloat(pt.getAttribute('lon') || '0');
      if (isNaN(lat) || isNaN(lon)) return;

      const ele = pt.querySelector('ele') ? parseFloat(pt.querySelector('ele')?.textContent || '') : undefined;
      if (ele !== undefined && !isNaN(ele)) {
        coordinates.push([lon, lat, ele]);
      } else {
        coordinates.push([lon, lat]);
      }
    });

    if (coordinates.length > 0) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
        properties: {
          name,
          description: desc,
          gpxType: 'route',
        },
      });
    }
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Converts a GeoJSON FeatureCollection to a GPX XML String
 */
export function geojsonToGPX(geojson: FeatureCollection): string {
  let gpx = '<?xml version="1.1" encoding="UTF-8"?>\n';
  gpx += '<gpx version="1.1" creator="Web GIS Map Editor"\n';
  gpx += '     xmlns="http://www.topografix.com/GPX/1/1"\n';
  gpx += '     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  gpx += '     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n';
  gpx += '  <metadata>\n';
  gpx += '    <name>Export GIS Web Editor</name>\n';
  gpx += '    <desc>Data diekspor dari Web GIS Editor</desc>\n';
  gpx += `    <time>${new Date().toISOString()}</time>\n`;
  gpx += '  </metadata>\n';

  geojson.features.forEach((feature, index) => {
    const properties = feature.properties || {};
    const name = (properties.name || `Fitur ${index + 1}`).replace(/[<>&'"]/g, (c: string) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
    const desc = properties.description || '';
    const geom = feature.geometry;

    if (!geom) return;

    if (geom.type === 'Point') {
      const coords = geom.coordinates;
      const lon = coords[0];
      const lat = coords[1];
      const ele = coords[2];

      gpx += `  <wpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}">\n`;
      gpx += `    <name>${name}</name>\n`;
      if (desc) gpx += `    <desc>${desc}</desc>\n`;
      if (ele !== undefined && !isNaN(ele)) {
        gpx += `    <ele>${ele.toFixed(2)}</ele>\n`;
      }
      gpx += '  </wpt>\n';
    } else if (geom.type === 'LineString') {
      const coords = geom.coordinates;
      gpx += '  <trk>\n';
      gpx += `    <name>${name}</name>\n`;
      if (desc) gpx += `    <desc>${desc}</desc>\n`;
      gpx += '    <trkseg>\n';

      coords.forEach((c) => {
        const lon = c[0];
        const lat = c[1];
        const ele = c[2];
        gpx += `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}">\n`;
        if (ele !== undefined && !isNaN(ele)) {
          gpx += `        <ele>${ele.toFixed(2)}</ele>\n`;
        }
        gpx += '      </trkpt>\n';
      });

      gpx += '    </trkseg>\n';
      gpx += '  </trk>\n';
    } else if (geom.type === 'Polygon') {
      // In GPX export polygons as track loops
      const rings = geom.coordinates;
      rings.forEach((ring, ringIdx) => {
        gpx += '  <trk>\n';
        gpx += `    <name>${name}${rings.length > 1 ? ` (Ring ${ringIdx + 1})` : ''}</name>\n`;
        if (desc) gpx += `    <desc>${desc}</desc>\n`;
        gpx += '    <trkseg>\n';

        ring.forEach((c) => {
          const lon = c[0];
          const lat = c[1];
          const ele = c[2];
          gpx += `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}">\n`;
          if (ele !== undefined && !isNaN(ele)) {
            gpx += `        <ele>${ele.toFixed(2)}</ele>\n`;
          }
          gpx += '      </trkpt>\n';
        });

        gpx += '    </trkseg>\n';
        gpx += '  </trk>\n';
      });
    } else if (geom.type === 'MultiLineString') {
      const paths = geom.coordinates;
      paths.forEach((path, pathIdx) => {
        gpx += '  <trk>\n';
        gpx += `    <name>${name} (Segmen ${pathIdx + 1})</name>\n`;
        if (desc) gpx += `    <desc>${desc}</desc>\n`;
        gpx += '    <trkseg>\n';

        path.forEach((c) => {
          const lon = c[0];
          const lat = c[1];
          gpx += `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"/>\n`;
        });

        gpx += '    </trkseg>\n';
        gpx += '  </trk>\n';
      });
    } else if (geom.type === 'MultiPolygon') {
      const polygons = geom.coordinates;
      polygons.forEach((poly, polyIdx) => {
        poly.forEach((ring, ringIdx) => {
          gpx += '  <trk>\n';
          gpx += `    <name>${name} (Polygon ${polyIdx + 1} - Ring ${ringIdx + 1})</name>\n`;
          if (desc) gpx += `    <desc>${desc}</desc>\n`;
          gpx += '    <trkseg>\n';

          ring.forEach((c) => {
            const lon = c[0];
            const lat = c[1];
            gpx += `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"/>\n`;
          });

          gpx += '    </trkseg>\n';
          gpx += '  </trk>\n';
        });
      });
    }
  });

  gpx += '</gpx>\n';
  return gpx;
}
