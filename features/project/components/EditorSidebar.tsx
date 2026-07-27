"use client";

import React, { useState } from "react";
import {
  FileText,
  Trash2,
  Eye,
  Check,
  Edit3,
  Plus,
  Compass,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FeatureCollection } from "geojson";
import { CoordinateMode, GisFeatureProperties } from "@/lib/types";
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance, latLngToUtm } from "@/lib/gis";
import { TEMPLATES } from "@/lib/templates";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EditorSidebarProps {
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
}

export function EditorSidebar({
  geoJsonData,
  coordinateMode,
  onZoomToFeature,
  onDeleteFeature,
  onUpdateFeatureProperties,
  selectedPdfFeatureId = null,
  onSelectPdfFeature = () => {},
  onOpenExportModal,
  onEditFeature,
}: EditorSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [editColor, setEditColor] = useState<string>("#3b82f6");
  const [editCustomProps, setEditCustomProps] = useState<Record<string, string>>({});

  // Start Editing Feature
  const handleStartEditFeature = (feature: unknown) => {
    const feat = feature as { properties?: GisFeatureProperties };
    const props = (feat.properties || {}) as GisFeatureProperties;
    const featureId = props.id || `f-${geoJsonData.features.indexOf(feature as any)}`;
    setEditingId(featureId);
    setEditName(props.name || "");
    setEditDesc(props.description || "");
    setEditColor(props.color || "#3b82f6");

    const custom: Record<string, string> = {};
    Object.entries(props).forEach(([k, v]) => {
      if (!["id", "name", "description", "color", "areaSqm", "perimeterMeters"].includes(k)) {
        custom[k] = String(v ?? "");
      }
    });
    setEditCustomProps(custom);
  };

  const handleSaveFeature = (featureId: string) => {
    onUpdateFeatureProperties(featureId, {
      id: featureId,
      name: editName,
      description: editDesc,
      color: editColor,
      ...editCustomProps,
    });
    setEditingId(null);
  };

  const handleAddCustomProp = () => {
    const key = `prop_${Object.keys(editCustomProps).length + 1}`;
    setEditCustomProps({ ...editCustomProps, [key]: "" });
  };

  const handleRemoveCustomProp = (key: string) => {
    const updated = { ...editCustomProps };
    delete updated[key];
    setEditCustomProps(updated);
  };

  const handleCustomPropChange = (key: string, val: string) => {
    setEditCustomProps({ ...editCustomProps, [key]: val });
  };

  const handleRenameCustomPropKey = (oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    const updated: Record<string, string> = {};
    Object.entries(editCustomProps).forEach(([k, v]) => {
      if (k === oldKey) updated[newKey] = v;
      else updated[k] = v;
    });
    setEditCustomProps(updated);
  };

  const handleApplyTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const tmpl = TEMPLATES[templateKey];
    if (!tmpl) return;
    const merged = { ...editCustomProps, ...tmpl.data };
    setEditCustomProps(merged);
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 text-foreground flex flex-col h-full shrink-0 z-20 shadow-xl">
      {/* Header Panel */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-sm text-foreground">Daftar Bidang &amp; Layer</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          {geoJsonData.features.length} Item
        </span>
      </div>

      {/* Main List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Layer / Feature Items List */}
        <div className="space-y-2">
          {geoJsonData.features.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-xl bg-card/40 my-4">
              <Compass className="w-8 h-8 mx-auto text-muted-foreground/60 animate-pulse" />
              <p className="text-xs font-medium">Belum ada bidang atau objek spasial.</p>
              <p className="text-[11px] text-muted-foreground/80">Gunakan toolbar peta untuk melukis polygon bidang tanah.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {geoJsonData.features.map((feature, idx) => {
                  const props = (feature.properties || {}) as GisFeatureProperties;
                  const featureId = props.id || `f-${idx}`;
                  const isEditing = editingId === featureId;
                  const geom = feature.geometry;
                  const type = geom?.type;

                  // Measurements
                  let areaStr = "";
                  let perimeterStr = "";
                  let lengthStr = "";
                  let posStr = "";

                  if (type === "Polygon" && geom.coordinates?.[0]) {
                    const latLngs = (geom.coordinates[0] as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
                    const area = typeof props.areaSqm === "number" ? props.areaSqm : calculatePolygonArea(latLngs);
                    const perim = typeof props.perimeterMeters === "number" ? props.perimeterMeters : calculatePolygonPerimeter(latLngs);
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
                        <Card className="p-3 bg-muted/30 border-primary/40 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-border pb-1.5">
                            <span className="text-xs font-bold text-primary">Edit Atribut Layer</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{featureId}</span>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Nama Bidang</label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="text-xs h-7 mt-1 bg-background"
                              placeholder="Misal: Bidang A - Pak Budi"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Keterangan / Deskripsi</label>
                            <textarea
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full bg-background text-xs border rounded-md px-2.5 py-1.5 mt-1 h-14 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Warna Geometri</span>
                            <div className="flex gap-1.5 mt-1">
                              {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((hex) => (
                                <button
                                  key={hex}
                                  type="button"
                                  onClick={() => setEditColor(hex)}
                                  className="w-4.5 h-4.5 rounded-full border border-border flex items-center justify-center cursor-pointer"
                                  style={{ backgroundColor: hex }}
                                >
                                  {editColor === hex && <Check className="w-3 h-3 text-white" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Properties */}
                          <div className="space-y-2 pt-1 border-t border-border">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Custom Properties</span>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-6 text-[9px] px-2" onClick={() => handleApplyTemplate("surat_tanah")}>
                                  + Surat Tanah
                                </Button>
                                <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={handleAddCustomProp}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {Object.entries(editCustomProps).map(([key, val], i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <Input
                                    defaultValue={key}
                                    onBlur={(e) => handleRenameCustomPropKey(key, e.target.value)}
                                    className="h-6 text-[10px] w-1/3 bg-muted/50"
                                    placeholder="Key"
                                  />
                                  <Input
                                    value={val}
                                    onChange={(e) => handleCustomPropChange(key, e.target.value)}
                                    className="h-6 text-[10px] flex-1 bg-background"
                                    placeholder="Value"
                                  />
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => handleRemoveCustomProp(key)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              {Object.keys(editCustomProps).length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic text-center py-1">Belum ada custom properties.</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="h-7 text-[11px]">
                              Batal
                            </Button>
                            <Button size="sm" onClick={() => handleSaveFeature(featureId)} className="h-7 text-[11px]">
                              Simpan
                            </Button>
                          </div>
                        </Card>
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
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Bottom info footer */}
      <div className="p-3.5 bg-muted/40 text-muted-foreground border-t border-border flex items-center justify-center font-semibold">
        <div className="text-[11px] opacity-90">
          &copy; {new Date().getFullYear()} GeoVertex SaaS. Collaborative GIS Platform.
        </div>
      </div>
    </aside>
  );
}
