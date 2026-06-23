/**
 * GIS Calculations for Area and Distance (WGS-84 Sphere)
 */

/**
 * Calculates the distance between two [lng, lat] coordinates in meters using Haversine formula
 */
export function calculateDistance(c1: number[], c2: number[]): number {
  const lon1 = c1[0], lat1 = c1[1];
  const lon2 = c2[0], lat2 = c2[1];
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
  if (coordinates.length < 3) return 0;
  let area = 0;
  const len = coordinates.length;
  const rad = Math.PI / 180;
  const R = 6378137;

  // Ensure rings are calculated correctly
  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];
    area += (p2[0] - p1[0]) * rad * (2 + Math.sin(p1[1] * rad) + Math.sin(p2[1] * rad));
  }
  
  area = (area * R * R) / 2.0;
  return Math.abs(area);
}

/**
 * Calculates perimeter of a polygon in meters
 */
export function calculatePolygonPerimeter(coordinates: number[][]): number {
  if (coordinates.length < 2) return 0;
  let perimeter = 0;
  const len = coordinates.length;
  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];
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
