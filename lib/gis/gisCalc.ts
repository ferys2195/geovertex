/**
 * GIS Calculations for Area and Distance (WGS-84 Sphere)
 */

/**
 * Normalizes a coordinate pair into [lng, lat] format.
 */
export function normalizeLngLat(coord: number[]): [number, number] {
  if (!coord || coord.length < 2) return [0, 0];
  const c0 = Number(coord[0]);
  const c1 = Number(coord[1]);
  if (isNaN(c0) || isNaN(c1)) return [0, 0];

  // If c0 is out of latitude bounds (-90 to 90), c0 MUST be longitude!
  if (Math.abs(c0) > 90 && Math.abs(c1) <= 90) {
    return [c0, c1];
  }
  // If c1 is out of latitude bounds (-90 to 90), c1 MUST be longitude!
  if (Math.abs(c1) > 90 && Math.abs(c0) <= 90) {
    return [c1, c0];
  }

  // Default: return [c0, c1]
  return [c0, c1];
}

/**
 * Calculates the distance between two coordinates in meters using Haversine formula
 */
export function calculateDistance(c1: number[], c2: number[]): number {
  const p1 = normalizeLngLat(c1);
  const p2 = normalizeLngLat(c2);
  const lon1 = p1[0], lat1 = p1[1];
  const lon2 = p2[0], lat2 = p2[1];
  const R = 6378137; // Earth's mean radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates total length of a path (polyline) in meters
 */
export function calculateLineLength(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 2) return 0;
  let length = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    length += calculateDistance(coordinates[i], coordinates[i + 1]);
  }
  return length;
}

/**
 * Calculates area of a spherical polygon in square meters
 * Chamberlain-Duquette algorithm (used by Turf.js / OpenLayers)
 */
export function calculatePolygonArea(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 3) return 0;
  const normCoords = coordinates.map(normalizeLngLat);
  let area = 0;
  const len = normCoords.length;
  const rad = Math.PI / 180;
  const R = 6378137;

  for (let i = 0; i < len; i++) {
    const p1 = normCoords[i];
    const p2 = normCoords[(i + 1) % len];
    area += (p2[0] - p1[0]) * rad * (2 + Math.sin(p1[1] * rad) + Math.sin(p2[1] * rad));
  }
  
  area = (area * R * R) / 2.0;
  return Math.abs(area);
}

/**
 * Calculates perimeter of a polygon in meters
 */
export function calculatePolygonPerimeter(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 2) return 0;
  const normCoords = coordinates.map(normalizeLngLat);
  let perimeter = 0;
  const len = normCoords.length;
  for (let i = 0; i < len; i++) {
    const p1 = normCoords[i];
    const p2 = normCoords[(i + 1) % len];
    perimeter += calculateDistance(p1, p2);
  }
  return perimeter;
}

/**
 * Formats a distance value to standard Indonesia strings
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }
  return `${(meters / 1000).toFixed(3)} km`;
}

/**
 * Formats an area value to standard Indonesia strings
 */
export function formatArea(sqMeters: number): string {
  if (sqMeters < 10000) {
    return `${sqMeters.toFixed(1)} m²`;
  } else if (sqMeters < 1000000) {
    return `${(sqMeters / 10000).toFixed(3)} Hektar (ha)`;
  } else {
    return `${(sqMeters / 1000000).toFixed(3)} km² (${(sqMeters / 10000).toFixed(1)} ha)`;
  }
}
