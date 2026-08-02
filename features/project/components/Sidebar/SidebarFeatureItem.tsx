import React from 'react';
import { motion } from 'motion/react';
import { Feature } from 'geojson';
import { CoordinateMode, GisFeatureProperties } from '@/lib/types';
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance, latLngToUtm } from '@/lib/gis';
import { SidebarFeatureEditForm } from './SidebarFeatureEditForm';
import { FeatureActionButtons } from '../FeatureActionButtons';
import { TEMPLATES } from '@/lib/templates';

interface SidebarFeatureItemProps {
  feature: Feature;
  idx: number;
  editingId: string | null;
  coordinateMode: CoordinateMode;
  selectedPdfFeatureId?: string | null;
  onZoomToFeature: (featureId: string) => void;
  onDeleteFeature: (featureId: string) => void;
  onSelectPdfFeature: (id: string | null) => void;
  onOpenExportModal?: () => void;
  onEditFeature?: (featureId: string) => void;
  isReadOnly?: boolean;
  editName: string;
  setEditName: (val: string) => void;
  editDesc: string;
  setEditDesc: (val: string) => void;
  editColor: string;
  setEditColor: (val: string) => void;
  editCustomProps: Record<string, string>;
  onSaveFeature: (featureId: string) => void;
  onCancelEdit: () => void;
  onAddCustomProp: () => void;
  onRemoveCustomProp: (key: string) => void;
  onCustomPropChange: (key: string, val: string) => void;
  onRenameCustomPropKey: (oldKey: string, newKey: string) => void;
  onApplyTemplate: (templateKey: keyof typeof TEMPLATES) => void;
}

export function SidebarFeatureItem({
  feature,
  idx,
  editingId,
  coordinateMode,
  selectedPdfFeatureId,
  onZoomToFeature,
  onDeleteFeature,
  onSelectPdfFeature,
  onOpenExportModal,
  onEditFeature,
  isReadOnly = false,
  editName,
  setEditName,
  editDesc,
  setEditDesc,
  editColor,
  setEditColor,
  editCustomProps,
  onSaveFeature,
  onCancelEdit,
  onAddCustomProp,
  onRemoveCustomProp,
  onCustomPropChange,
  onRenameCustomPropKey,
  onApplyTemplate,
}: SidebarFeatureItemProps) {
  const props = (feature.properties || {}) as GisFeatureProperties;
  const featureId = props.id || `f-${idx}`;
  const isEditing = editingId === featureId;
  const geom = feature.geometry;
  const type = geom?.type;

  // Measurements calculation
  let areaStr = "";
  let perimeterStr = "";
  let lengthStr = "";
  let posStr = "";

  if (type === "Polygon" && geom.coordinates?.[0]) {
    const latLngs = (geom.coordinates[0] as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
    const area = calculatePolygonArea(latLngs);
    const perim = calculatePolygonPerimeter(latLngs);
    areaStr = formatArea(area);
    perimeterStr = formatDistance(perim);
  } else if (type === "LineString" && geom.coordinates) {
    const latLngs = (geom.coordinates as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
    const len = calculateLineLength(latLngs);
    lengthStr = formatDistance(len);
  } else if (type === "Point" && geom.coordinates) {
    const [lng, lat] = geom.coordinates as number[];
    if (coordinateMode === "UTM") {
      const utm = latLngToUtm(lat, lng);
      posStr = utm.formatted;
    } else {
      posStr = `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
    }
  }

  const badgeTheme =
    type === "Polygon"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
      : type === "LineString"
      ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
      : "bg-purple-500/10 text-purple-500 border-purple-500/30";

  return (
    <motion.div
      key={featureId}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 rounded-xl border transition-all border-border hover:border-slate-700 bg-card"
    >
      {isEditing ? (
        <SidebarFeatureEditForm
          featureId={featureId}
          editName={editName}
          setEditName={setEditName}
          editDesc={editDesc}
          setEditDesc={setEditDesc}
          editColor={editColor}
          setEditColor={setEditColor}
          editCustomProps={editCustomProps}
          onSave={onSaveFeature}
          onCancel={onCancelEdit}
          onAddCustomProp={onAddCustomProp}
          onRemoveCustomProp={onRemoveCustomProp}
          onCustomPropChange={onCustomPropChange}
          onRenameCustomPropKey={onRenameCustomPropKey}
          onApplyTemplate={onApplyTemplate}
        />
      ) : (
        <div
          onClick={() => {
            onZoomToFeature(featureId);
          }}
          className="cursor-pointer group"
        >
          {/* Header Card: Nama & Jenis Geometri sejajar flex justify-between items-center */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-xs text-foreground group-hover:text-emerald-400 transition-colors truncate">
              {props.name || `Geometri ${idx + 1}`}
            </h4>
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeTheme}`}>
              {type === "Polygon" ? "Polygon" : type === "LineString" ? "Polyline" : "Point/Marker"}
            </span>
          </div>

          {props.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 italic mt-1 leading-relaxed">
              {props.description}
            </p>
          )}

          {/* Quick Measurements Display */}
          <div className="mt-2 text-[11px] font-mono text-muted-foreground flex flex-wrap items-center justify-between gap-x-2">
            {type === "Polygon" && (
              <>
                <span>Luas: <strong className="text-foreground">{areaStr}</strong></span>
                <span>Keliling: <strong className="text-foreground">{perimeterStr}</strong></span>
              </>
            )}
            {type === "LineString" && (
              <span>Panjang: <strong className="text-foreground">{lengthStr}</strong></span>
            )}
            {type === "Point" && (
              <span>Posisi: <strong className="text-foreground">{posStr}</strong></span>
            )}
          </div>

          {/* Action icons di bawah item (Reusable Component) */}
          <div className="mt-2.5 pt-2 border-t border-border/60">
            <FeatureActionButtons
              featureId={featureId}
              geom={geom}
              coordinateMode={coordinateMode}
              onSelectPdfFeature={onSelectPdfFeature}
              onOpenExportModal={onOpenExportModal}
              onZoomToFeature={onZoomToFeature}
              onEditFeature={onEditFeature}
              onDeleteFeature={onDeleteFeature}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
