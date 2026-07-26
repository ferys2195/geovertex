import { FeatureCollection } from 'geojson';

export type CoordinateMode = 'UTM' | 'LatLng';

export interface GisFeatureProperties {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color for custom rendering
  gpxType?: 'waypoint' | 'track' | 'route';
  [key: string]: unknown;
}

export interface MapSample {
  name: string;
  description: string;
  data: FeatureCollection;
}
