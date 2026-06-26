import { FeatureCollection } from 'geojson';

export type CoordinateMode = 'UTM' | 'LatLng';

export interface GisFeatureProperties {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color for custom rendering
  gpxType?: 'waypoint' | 'track' | 'route';
  [key: string]: any;
}

export interface MapSample {
  name: string;
  description: string;
  data: FeatureCollection;
}
