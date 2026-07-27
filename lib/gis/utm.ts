/**
 * UTM (Universal Transverse Mercator) Coordinate Conversion Utility
 * Converts between WGS-84 Latitude/Longitude and UTM Coordinates.
 */

const WGS84_A = 6378137.0; // Equatorial radius (semi-major axis)
const WGS84_F = 1.0 / 298.257223563; // Flattening
const WGS84_B = WGS84_A * (1.0 - WGS84_F); // Polar radius (semi-minor axis)
const E_SQR = (WGS84_A * WGS84_A - WGS84_B * WGS84_B) / (WGS84_A * WGS84_A); // First eccentricity squared
const E2_SQR = (WGS84_A * WGS84_A - WGS84_B * WGS84_B) / (WGS84_B * WGS84_B); // Second eccentricity squared

/**
 * Returns the UTM Zone Letter for a given Latitude
 */
export function getUtmZoneFromLongitude(lng: number): number {
  return Math.floor((lng + 180.0) / 6.0) + 1;
}

export function getLatitudeBand(lat: number): string {
  return getUtmLetter(lat);
}

export function latLngToUtmWithZone(
  pt: { lat: number; lng: number },
  zoneNumber: number,
  hemisphere: 'north' | 'south'
): { easting: number; northing: number } {
  const result = latLngToUtm(pt.lat, pt.lng);
  return { easting: result.easting, northing: result.northing };
}

export function getUtmLetter(lat: number): string {
  if (lat < -80 || lat > 84) {
    return 'Z'; // Outside UTM boundaries
  }
  const letters = 'CDEFGHJKLMNPQRSTUVWXX'; // 'X' is double-sized at the top
  const index = Math.floor((lat + 80) / 8);
  return letters.charAt(Math.min(Math.max(index, 0), letters.length - 1));
}

/**
 * Converts Latitude and Longitude to UTM
 */
export function latLngToUtm(lat: number, lng: number): {
  easting: number;
  northing: number;
  zoneNumber: number;
  zoneLetter: string;
  formatted: string;
} {
  // Clamp longitude to [-180, 180] and latitude to [-90, 90]
  const latitude = Math.max(-90, Math.min(90, lat));
  let longitude = lng;
  if (longitude < -180 || longitude > 180) {
    longitude = ((longitude + 180) % 360) - 180;
    if (longitude < -180) longitude += 360;
  }

  const latRad = (latitude * Math.PI) / 180.0;
  const lngRad = (longitude * Math.PI) / 180.0;

  // Determine standard UTM zone
  let zoneNumber = Math.floor((longitude + 180.0) / 6.0) + 1;

  // Handle special zones
  if (latitude >= 56.0 && latitude < 64.0 && longitude >= 3.0 && longitude < 12.0) {
    zoneNumber = 32;
  }
  // Svalbard special zones
  if (latitude >= 72.0 && latitude < 84.0) {
    if (longitude >= 0.0 && longitude < 9.0) zoneNumber = 31;
    else if (longitude >= 9.0 && longitude < 21.0) zoneNumber = 33;
    else if (longitude >= 21.0 && longitude < 33.0) zoneNumber = 35;
    else if (longitude >= 33.0 && longitude < 42.0) zoneNumber = 37;
  }

  const zoneLetter = getUtmLetter(latitude);
  const lngOrigin = ((zoneNumber - 1) * 6 - 180 + 3) * Math.PI / 180.0;

  const k0 = 0.9996; // scale factor

  const eccPrimeSqr = E2_SQR;
  const N = WGS84_A / Math.sqrt(1.0 - E_SQR * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = eccPrimeSqr * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lngRad - lngOrigin);

  // Calculation of meridian distance M
  const M = WGS84_A * (
    (1.0 - E_SQR / 4.0 - 3.0 * E_SQR * E_SQR / 64.0 - 5.0 * E_SQR * E_SQR * E_SQR / 256.0) * latRad -
    (3.0 * E_SQR / 8.0 + 3.0 * E_SQR * E_SQR / 32.0 + 45.0 * E_SQR * E_SQR * E_SQR / 1024.0) * Math.sin(2.0 * latRad) +
    (15.0 * E_SQR * E_SQR / 256.0 + 45.0 * E_SQR * E_SQR * E_SQR / 1024.0) * Math.sin(4.0 * latRad) -
    (35.0 * E_SQR * E_SQR * E_SQR / 3072.0) * Math.sin(6.0 * latRad)
  );

  let easting = k0 * N * (
    A +
    (1.0 - T + C) * A * A * A / 6.0 +
    (5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * eccPrimeSqr) * A * A * A * A * A / 120.0
  ) + 500000.0;

  let northing = k0 * (
    M +
    N * Math.tan(latRad) * (
      A * A / 2.0 +
      (5.0 - T + 9.0 * C + 4.0 * C * C) * A * A * A * A / 24.0 +
      (61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * eccPrimeSqr) * A * A * A * A * A * A / 720.0
    )
  );

  // Offset northing if in Southern hemisphere
  if (latitude < 0) {
    northing += 10000000.0;
  }

  // Ensure precision
  easting = Math.round(easting * 100) / 100;
  northing = Math.round(northing * 100) / 100;

  const formatted = `${zoneNumber}${zoneLetter} ${easting.toFixed(1)}m E ${northing.toFixed(1)}m N`;

  return {
    easting,
    northing,
    zoneNumber,
    zoneLetter,
    formatted,
  };
}

/**
 * Converts UTM back to Latitude and Longitude (WGS-84)
 */
export function utmToLatLng(
  easting: number,
  northing: number,
  zoneNumber: number,
  zoneLetter: string
): { lat: number; lng: number } {
  const k0 = 0.9996;
  const a = WGS84_A;
  const eccSquared = E_SQR;
  const e1 = (1.0 - Math.sqrt(1.0 - eccSquared)) / (1.0 + Math.sqrt(1.0 - eccSquared));

  let x = easting - 500000.0; // remove False Easting
  let y = northing;

  // Check if Southern Hemisphere from Zone Letter
  const isSouthern = 'CDEFGHJKLM'.includes(zoneLetter.toUpperCase());
  if (isSouthern) {
    y -= 10000000.0; // remove False Northing
  }

  const lngOrigin = ((zoneNumber - 1) * 6 - 180 + 3) * Math.PI / 180.0;

  const eccPrimeSqr = E2_SQR;

  const M = y / k0;
  const mu = M / (a * (1.0 - eccSquared / 4.0 - 3.0 * eccSquared * eccSquared / 64.0 - 5.0 * eccSquared * eccSquared * eccSquared / 256.0));

  const phi1Rad = mu +
    (3.0 * e1 / 2.0 - 27.0 * e1 * e1 * e1 / 32.0) * Math.sin(2.0 * mu) +
    (21.0 * e1 * e1 / 16.0 - 55.0 * e1 * e1 * e1 * e1 / 32.0) * Math.sin(4.0 * mu) +
    (151.0 * e1 * e1 * e1 / 96.0) * Math.sin(6.0 * mu) +
    (1097.0 * e1 * e1 * e1 * e1 / 512.0) * Math.sin(8.0 * mu);

  const N1 = a / Math.sqrt(1.0 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
  const T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
  const C1 = eccPrimeSqr * Math.cos(phi1Rad) * Math.cos(phi1Rad);
  const R1 = a * (1.0 - eccSquared) / Math.pow(1.0 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
  const D = x / (N1 * k0);

  let lat = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (
    D * D / 2.0 -
    (5.0 + 3.0 * T1 + 10.0 * C1 - 4.0 * C1 * C1 - 9.0 * eccPrimeSqr) * D * D * D * D / 24.0 +
    (61.0 + 90.0 * T1 + 298.0 * C1 + 45.0 * T1 * T1 - 252.0 * eccPrimeSqr - 3.0 * C1 * C1) * D * D * D * D * D * D / 720.0
  );
  lat = (lat * 180.0) / Math.PI;

  let lng = (D - (1.0 + 2.0 * T1 + C1) * D * D * D / 6.0 +
    (5.0 - 2.0 * C1 + 28.0 * T1 - 3.0 * C1 * C1 + 8.0 * eccPrimeSqr + 24.0 * T1 * T1) * D * D * D * D * D / 120.0) / Math.cos(phi1Rad);
  lng = lngOrigin + lng;
  lng = (lng * 180.0) / Math.PI;

  // Ensure longitude is within [-180, 180]
  if (lng < -180) lng += 360;
  if (lng > 180) lng -= 360;

  return { lat, lng };
}

/**
 * Detects hemispheres based on Latitude
 * @param lat 
 * @returns 'northern' | 'southern'
 */
export function getHemisphere(lat: number): 'northern' | 'southern' {
  return lat >= 0 ? 'northern' : 'southern';
}

/**
 * Returns formatted UTM string of LatLng with custom precision
 */
export function formatUtm(lat: number, lng: number): string {
  const utm = latLngToUtm(lat, lng);
  return utm.formatted;
}
