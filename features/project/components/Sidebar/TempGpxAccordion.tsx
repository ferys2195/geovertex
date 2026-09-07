"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  HardDrive,
  Save,
  Trash2,
  MapPin,
  Route,
  Navigation,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapFeatureExportData } from "../../types/project.types";
import { useProjectStore } from "../../store/useProjectStore";

interface TempGpxAccordionProps {
  tempFeatures: MapFeatureExportData[];
  onZoomToFeature?: (featureId: string) => void;
}

export function TempGpxAccordion({ tempFeatures, onZoomToFeature }: TempGpxAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const promoteTempFeature = useProjectStore((state) => state.promoteTempFeature);
  const promoteAllTempFeatures = useProjectStore((state) => state.promoteAllTempFeatures);
  const removeTempFeature = useProjectStore((state) => state.removeTempFeature);
  const clearAllTempFeatures = useProjectStore((state) => state.clearAllTempFeatures);
  const setSelectedFeatureId = useProjectStore((state) => state.setSelectedFeatureId);
  const selectedFeatureId = useProjectStore((state) => state.selectedFeatureId);

  if (tempFeatures.length === 0) return null;

  const getGeometryIcon = (type: string, color?: string) => {
    const style = { color: color || "#3b82f6" };
    if (type === "Marker" || type === "Point") return <MapPin className="w-3.5 h-3.5 shrink-0" style={style} />;
    if (type === "Polyline" || type === "LineString") return <Route className="w-3.5 h-3.5 shrink-0" style={style} />;
    return <Navigation className="w-3.5 h-3.5 shrink-0" style={style} />;
  };

  return (
    <div className="border border-emerald-500/30 bg-slate-900/90 rounded-lg overflow-hidden my-2 shadow-lg">
      {/* Accordion Header */}
      <div className="bg-slate-800/80 px-3 py-2 flex items-center justify-between border-b border-emerald-500/20">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left flex-1 min-w-0 group"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate">
              Local GPX Temp
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-emerald-500/30">
              {tempFeatures.length}
            </span>
          </div>
        </button>

        {/* Batch Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={promoteAllTempFeatures}
            title="Simpan Semua ke Database"
            className="h-6 w-6 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded"
          >
            <Save className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearAllTempFeatures}
            title="Hapus Semua Temp GPX"
            className="h-6 w-6 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Accordion Content List */}
      {isOpen && (
        <div className="p-1.5 space-y-1 max-h-56 overflow-y-auto divide-y divide-slate-800/40">
          {tempFeatures.map((feat) => {
            const isSelected = selectedFeatureId === feat.id;

            return (
              <div
                key={feat.id}
                onClick={() => setSelectedFeatureId(feat.id)}
                className={`flex items-center justify-between p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-200"
                    : "hover:bg-slate-800/60 text-slate-300"
                }`}
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getGeometryIcon(feat.type, feat.color)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-slate-200 text-xs">
                      {feat.name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {feat.type} • Local Storage
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Zoom to feature */}
                  {onZoomToFeature && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onZoomToFeature(feat.id)}
                      title="Fokus di Peta"
                      className="h-6 w-6 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded"
                    >
                      <Globe className="w-3 h-3" />
                    </Button>
                  )}

                  {/* Promote to DB */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => promoteTempFeature(feat.id)}
                    title="Simpan ke Database Supabase"
                    className="h-6 w-6 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded"
                  >
                    <Save className="w-3 h-3" />
                  </Button>

                  {/* Delete Temp Item */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTempFeature(feat.id)}
                    title="Hapus Layer Temporer"
                    className="h-6 w-6 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
