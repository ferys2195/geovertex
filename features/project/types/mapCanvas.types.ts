import { CoordinateMode } from '@/lib/types';
import { FeatureCollection } from 'geojson';

export interface MapContainerProps {
  geoJsonData?: FeatureCollection;
  onGeoJsonChange?: (data: FeatureCollection) => void;
  coordinateMode?: CoordinateMode;
  onCoordinateModeChange?: (mode: CoordinateMode) => void;
  hoverCoords?: { lat: number; lng: number } | null;
  setHoverCoords?: (coords: { lat: number; lng: number } | null) => void;
  zoomToTrigger?: { id: string; time: number } | null;
  readOnly?: boolean;
  isSidebarOpen?: boolean;
  selectedPdfFeatureId?: string | null;
  onSelectPdfFeature?: (id: string | null) => void;
  onOpenExportModal?: () => void;
  onDeleteFeature?: (id: string) => void;
  onEditFeature?: (id: string) => void;
}

export interface BaseLayerConfig {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxNativeZoom: number;
  maxZoom: number;
}

export interface LatLngCoords {
  lat: number;
  lng: number;
}
