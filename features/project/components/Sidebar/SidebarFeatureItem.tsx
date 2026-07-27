import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Eye, Edit3, Trash2, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const props = (feature.properties || {}) as GisFeatureProperties;
  const featureId = props.id || `f-${idx}`;
  const isEditing = editingId === featureId;
  const geom = feature.geometry;
  const type = geom?.type;

  const handleCopyCoordinates = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!geom) return;

    let textToCopy = "";
    if (geom.type === "Point" && geom.coordinates) {
      const [lng, lat] = geom.coordinates as number[];
      textToCopy = coordinateMode === "UTM"
        ? latLngToUtm(lat, lng).formatted
        : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } else if (geom.type === "LineString" && geom.coordinates) {
      const coords = geom.coordinates as number[][];
      textToCopy = coords
        .map(([lng, lat]) =>
          coordinateMode === "UTM"
            ? latLngToUtm(lat, lng).formatted
            : `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        )
        .join("\n");
    } else if (geom.type === "Polygon" && geom.coordinates?.[0]) {
      const ring = geom.coordinates[0] as number[][];
      textToCopy = ring
        .map(([lng, lat]) =>
          coordinateMode === "UTM"
            ? latLngToUtm(lat, lng).formatted
            : `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        )
        .join("\n");
    } else {
      textToCopy = JSON.stringify((geom as any).coordinates || {});
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

          {/* Action icons di bawah item */}
          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPdfFeature(featureId);
                    onOpenExportModal?.();
                  }}
                  className="w-7 h-7 hover:border-emerald-500 hover:text-emerald-500"
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
                  onClick={handleCopyCoordinates}
                  className={`w-7 h-7 transition-colors ${
                    copied
                      ? "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                      : "hover:border-slate-500 hover:text-foreground"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              } />
              <TooltipContent>{copied ? "Koordinat Disalin!" : "Salin Koordinat Geometri"}</TooltipContent>
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
                  className="w-7 h-7 hover:border-blue-500 hover:text-blue-500"
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-blue-500" />
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
      )}
    </motion.div>
  );
}
