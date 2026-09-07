"use client";

import { useState, useMemo } from "react";
import {
  FileCode,
  Upload,
  HardDrive,
  Save,
  Trash2,
  MapPin,
  Route,
  Navigation,
  Globe,
  Search,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapFeatureExportData } from "../../types/project.types";
import { useProjectStore } from "../../store/useProjectStore";

export type GpxFilterType = "ALL" | "waypoint" | "route" | "track";

interface DraftsPanelProps {
  tempFeatures: MapFeatureExportData[];
  onZoomToFeature?: (featureId: string) => void;
}

export function DraftsPanel({ tempFeatures, onZoomToFeature }: DraftsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gpxFilter, setGpxFilter] = useState<GpxFilterType>("ALL");

  const promoteTempFeature = useProjectStore((state) => state.promoteTempFeature);
  const promoteAllTempFeatures = useProjectStore((state) => state.promoteAllTempFeatures);
  const removeTempFeature = useProjectStore((state) => state.removeTempFeature);
  const clearAllTempFeatures = useProjectStore((state) => state.clearAllTempFeatures);
  const setSelectedFeatureId = useProjectStore((state) => state.setSelectedFeatureId);
  const selectedFeatureId = useProjectStore((state) => state.selectedFeatureId);
  const setIsImportGpxOpen = useProjectStore((state) => state.setIsImportGpxOpen);

  // Category counts
  const categoryCounts = useMemo(() => {
    let waypoints = 0;
    let tracks = 0;
    let routes = 0;

    tempFeatures.forEach((f) => {
      const gpxType = (f.properties as any)?.gpxType;
      if (gpxType === "waypoint" || f.type === "Marker") {
        waypoints++;
      } else if (gpxType === "route") {
        routes++;
      } else {
        tracks++;
      }
    });

    return {
      all: tempFeatures.length,
      waypoint: waypoints,
      route: routes,
      track: tracks,
    };
  }, [tempFeatures]);

  // Filtered temp features based on category & search query
  const filteredTempFeatures = useMemo(() => {
    let list = tempFeatures;

    // 1. Filter by GPX category tab
    if (gpxFilter !== "ALL") {
      list = list.filter((f) => {
        const gpxType = (f.properties as any)?.gpxType;
        if (gpxFilter === "waypoint") {
          return gpxType === "waypoint" || f.type === "Marker";
        }
        if (gpxFilter === "route") {
          return gpxType === "route";
        }
        if (gpxFilter === "track") {
          return gpxType === "track" || (f.type === "Polyline" && gpxType !== "route");
        }
        return true;
      });
    }

    // 2. Filter by search query
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();

    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        String((f.properties as any)?.gpxType || "").toLowerCase().includes(q)
    );
  }, [tempFeatures, gpxFilter, searchQuery]);

  const getGeometryIcon = (type: string, color?: string, gpxType?: string) => {
    const style = { color: color || "#10b981" };
    if (gpxType === "waypoint" || type === "Marker" || type === "Point") {
      return <MapPin className="w-4 h-4 shrink-0 text-red-400" />;
    }
    if (gpxType === "route") {
      return <Navigation className="w-4 h-4 shrink-0 text-pink-400" />;
    }
    return <Route className="w-4 h-4 shrink-0 text-blue-400" />;
  };

  const filterTabs: { id: GpxFilterType; label: string; count: number }[] = [
    { id: "ALL", label: "All", count: categoryCounts.all },
    { id: "waypoint", label: "Waypoint", count: categoryCounts.waypoint },
    { id: "route", label: "Route", count: categoryCounts.route },
    { id: "track", label: "Track", count: categoryCounts.track },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Draft & GPX
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-mono border border-emerald-500/30">
                  {tempFeatures.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Layer Temporer (Local Storage)</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsImportGpxOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-2.5 font-medium gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            Import GPX
          </Button>
        </div>

        {/* Search Bar */}
        {tempFeatures.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <Input
              type="text"
              placeholder="Cari draft GPX..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-slate-950/70 border-slate-800 focus:border-emerald-500 text-slate-200"
            />
          </div>
        )}

        {/* GPX Category Filter Tabs */}
        {tempFeatures.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 overflow-x-auto">
            {filterTabs.map((tab) => {
              const isActive = gpxFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGpxFilter(tab.id)}
                  className={`flex-1 text-[11px] font-medium py-1 px-2 rounded-md transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] font-mono px-1 rounded-full ${
                      isActive ? "bg-emerald-800 text-emerald-100" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tempFeatures.length === 0 ? (
          /* Empty State */
          <div className="h-64 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/30 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <HardDrive className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1 max-w-[200px]">
              <p className="text-xs font-semibold text-slate-200">Belum Ada Draft GPX</p>
              <p className="text-[11px] text-slate-500">
                Impor file GPX untuk melihat trek atau waypoint secara temporer tanpa mengotori database.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsImportGpxOpen(true)}
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs h-8 px-3"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload File GPX
            </Button>
          </div>
        ) : filteredTempFeatures.length === 0 ? (
          /* Empty Filter State */
          <div className="py-8 text-center text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-slate-300">Tidak ada item di kategori {gpxFilter}</p>
            <p className="text-[11px] text-slate-500">Coba pilih tab kategori lain atau atur ulang pencarian.</p>
          </div>
        ) : (
          <>
            {/* Info Note */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Data temporer tersimpan di browser Anda. Klik <strong className="text-emerald-300 font-normal">Simpan</strong> untuk memindahkannya ke database Supabase secara permanen.
              </span>
            </div>

            {/* Batch Action Bar */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 px-1">
                Aksi Batch ({filteredTempFeatures.length})
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={promoteAllTempFeatures}
                  className="h-6 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Simpan Semua
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearAllTempFeatures}
                  className="h-6 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Hapus Semua
                </Button>
              </div>
            </div>

            {/* Draft Feature List */}
            <div className="space-y-2">
              {filteredTempFeatures.map((feat, idx) => {
                const isSelected = selectedFeatureId === feat.id;
                const gpxType = (feat.properties as any)?.gpxType || (feat.type === "Marker" ? "waypoint" : "track");

                return (
                  <div
                    key={`${feat.id}-${idx}`}
                    onClick={() => setSelectedFeatureId(feat.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500/50 shadow-xs shadow-emerald-950/50"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getGeometryIcon(feat.type, feat.color, gpxType)}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs text-slate-200 truncate">
                            {feat.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                            <span
                              className={`font-mono px-1 py-0.2 rounded uppercase ${
                                gpxType === "waypoint"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : gpxType === "route"
                                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {gpxType}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-400">Local Temp</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {onZoomToFeature && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onZoomToFeature(feat.id)}
                            title="Fokus di Peta"
                            className="h-7 w-7 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => promoteTempFeature(feat.id)}
                          title="Simpan ke Database Supabase"
                          className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTempFeature(feat.id)}
                          title="Hapus Layer Temporer"
                          className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
