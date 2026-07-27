import React, { useState } from 'react';
import { FileText, Copy, Check, Eye, Edit3, Trash2 } from 'lucide-react';
import { Geometry } from 'geojson';
import { CoordinateMode } from '@/lib/types';
import { latLngToUtm } from '@/lib/gis';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface FeatureActionButtonsProps {
  featureId: string;
  geom?: Geometry | null;
  coordinateMode: CoordinateMode;
  onSelectPdfFeature?: (id: string | null) => void;
  onOpenExportModal?: () => void;
  onZoomToFeature?: (featureId: string) => void;
  onEditFeature?: (featureId: string) => void;
  onDeleteFeature?: (featureId: string) => void;
  showZoom?: boolean;
  className?: string;
}

export function FeatureActionButtons({
  featureId,
  geom,
  coordinateMode,
  onSelectPdfFeature,
  onOpenExportModal,
  onZoomToFeature,
  onEditFeature,
  onDeleteFeature,
  showZoom = true,
  className = "flex items-center justify-end gap-1",
}: FeatureActionButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCoordinates = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!geom) return;

    let textToCopy = "";
    if (geom.type === "Point" && geom.coordinates) {
      const [lng, lat] = geom.coordinates as number[];
      textToCopy =
        coordinateMode === "UTM"
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

  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPdfFeature?.(featureId);
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

      {showZoom && onZoomToFeature && (
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
      )}

      {onEditFeature && (
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEditFeature(featureId);
              }}
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
          } />
          <TooltipContent>Ubah Atribut</TooltipContent>
        </Tooltip>
      )}

      {onDeleteFeature && (
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
      )}
    </div>
  );
}
