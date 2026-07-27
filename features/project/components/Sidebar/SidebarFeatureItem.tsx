import React from 'react';
import { motion } from 'motion/react';
import { FileText, Eye, Edit3, Trash2 } from 'lucide-react';
import { Feature } from 'geojson';
import { CoordinateMode, GisFeatureProperties } from '@/lib/types';
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance, latLngToUtm } from '@/lib/gis';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarFeatureEditForm } from './SidebarFeatureEditForm';
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

  const isPdfSelected = selectedPdfFeatureId === featureId;

  return (
    <motion.div
      key={featureId}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`p-3 rounded-xl border transition-all ${
        isPdfSelected
          ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-md"
          : "border-border hover:border-slate-700 bg-card"
      }`}
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
            onSelectPdfFeature(featureId);
          }}
          className="cursor-pointer group"
        >
          {/* Header Card */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-xs text-foreground group-hover:text-emerald-400 transition-colors">
                  {props.name || `Geometri ${idx + 1}`}
                </h4>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badgeTheme}`}>
                  {type === "Polygon" ? "Polygon" : type === "LineString" ? "Polyline" : "Point/Marker"}
                </span>
                {isPdfSelected && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Target PDF
                  </span>
                )}
              </div>
              {props.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 italic pr-2 mt-0.5 leading-relaxed">
                  {props.description}
                </p>
              )}
            </div>

            {/* Actions icons */}
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant={isPdfSelected ? "default" : "outline"}
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPdfFeature(featureId);
                      onOpenExportModal?.();
                    }}
                    className={`w-7 h-7 transition-all ${
                      isPdfSelected
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow"
                        : "hover:border-emerald-500 hover:text-emerald-500"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </Button>
                } />
                <TooltipContent>Ekspor Laporan PDF Kartografi Bidang Ini</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomToFeature(featureId);
                    }}
                    className="w-7 h-7"
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                } />
                <TooltipContent>Fokus Peta</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditFeature?.(featureId);
                    }}
                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                } />
                <TooltipContent>Ubah Atribut</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFeature(featureId);
                    }}
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                } />
                <TooltipContent>Hapus Geometri</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Quick Measurements Display */}
          <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground">
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
        </div>
      )}
    </motion.div>
  );
}
