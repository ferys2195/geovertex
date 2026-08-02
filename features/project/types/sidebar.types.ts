import { FeatureCollection } from "geojson";
import { CoordinateMode, GisFeatureProperties } from "@/lib/types";

export interface EditorSidebarProps {
  geoJsonData: FeatureCollection;
  onUpdateGeoJSON: (data: FeatureCollection) => void;
  coordinateMode: CoordinateMode;
  onZoomToFeature: (featureId: string) => void;
  onDeleteFeature: (featureId: string) => void;
  onUpdateFeatureProperties: (featureId: string, properties: GisFeatureProperties) => void;
  onAddPoint: (lat: number, lng: number, name: string, description: string, color?: string) => void;
  selectedPdfFeatureId?: string | null;
  onSelectPdfFeature?: (id: string | null) => void;
  onOpenExportModal?: () => void;
  onEditFeature?: (featureId: string) => void;
  isReadOnly?: boolean;
  currentRole?: string;
}
