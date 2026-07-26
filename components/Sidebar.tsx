"use client";

import React, { useState } from "react";
import {
  FileCode,
  TableProperties,
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
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance } from "@/lib/gisCalc";
import { latLngToUtm } from "@/lib/utm";
import { TEMPLATES } from "@/lib/templates";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  geoJsonData: FeatureCollection;
  onUpdateGeoJSON: (data: FeatureCollection) => void;
  coordinateMode: CoordinateMode;
  onZoomToFeature: (featureId: string) => void;
  onDeleteFeature: (featureId: string) => void;
  onUpdateFeatureProperties: (featureId: string, properties: GisFeatureProperties) => void;
  onAddPoint: (lat: number, lng: number, name: string, description: string, color?: string) => void;
  selectedPdfFeatureId?: string | null;
  onSelectPdfFeature?: (id: string | null) => void;
}

export default function Sidebar({
  geoJsonData,
  onUpdateGeoJSON,
  coordinateMode,
  onZoomToFeature,
  onDeleteFeature,
  onUpdateFeatureProperties,
  selectedPdfFeatureId = null,
  onSelectPdfFeature = () => {},
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [editColor, setEditColor] = useState<string>("#3b82f6");
  const [editCustomProps, setEditCustomProps] = useState<Record<string, string>>({});

  // Start Editing Feature
  const handleStartEditFeature = (feature: any) => {
    const props = (feature.properties || {}) as GisFeatureProperties;
    const featureId = props.id || `f-${geoJsonData.features.indexOf(feature)}`;
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
      if (k === oldKey) updated[newKey.trim()] = v;
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

  // Calculate statistics
  const totalFeatures = geoJsonData.features.length;
  const polyFeatures = geoJsonData.features.filter((f) => f.geometry?.type === "Polygon");
  const lineFeatures = geoJsonData.features.filter((f) => f.geometry?.type === "LineString");
  const pointFeatures = geoJsonData.features.filter((f) => f.geometry?.type === "Point");

  const totalLineLength = lineFeatures.reduce((acc, f) => {
    if (f.geometry?.type === "LineString") {
      return acc + calculateLineLength(f.geometry.coordinates);
    }
    return acc;
  }, 0);

  const totalPolygonArea = polyFeatures.reduce((acc, f) => {
    if (f.geometry?.type === "Polygon") {
      return acc + calculatePolygonArea(f.geometry.coordinates[0]);
    }
    return acc;
  }, 0);

  return (
    <aside id="sidebar-container" className="w-full lg:w-120 h-full bg-background border-r flex flex-col z-40 shrink-0 relative font-sans">
      {/* Header Bar */}
      <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" />
          <h2 className="font-bold text-xs text-foreground tracking-tight">Daftar Bidang &amp; Layer Spasial</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          {totalFeatures} Layer
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Statistics Overview Card */}
        <div className="bg-muted/30 p-3.5 rounded-xl border grid grid-cols-3 gap-2">
          <Card className="shadow-none border-border bg-background p-2 text-center">
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Poligon / Bidang</span>
            <span className="text-base font-extrabold text-foreground mt-0.5 block">{polyFeatures.length}</span>
            <span className="text-[9px] text-muted-foreground font-medium truncate block">{formatArea(totalPolygonArea)}</span>
          </Card>
          <Card className="shadow-none border-border bg-background p-2 text-center">
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Polyline</span>
            <span className="text-base font-extrabold text-foreground mt-0.5 block">{lineFeatures.length}</span>
            <span className="text-[9px] text-muted-foreground font-medium truncate block">{formatDistance(totalLineLength)}</span>
          </Card>
          <Card className="shadow-none border-border bg-background p-2 text-center">
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Titik</span>
            <span className="text-base font-extrabold text-foreground mt-0.5 block">{pointFeatures.length}</span>
            <span className="text-[9px] text-muted-foreground font-medium truncate block">Total: {totalFeatures}</span>
          </Card>
        </div>

        {/* List of Features */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Daftar Geometri ({totalFeatures})</span>
            {totalFeatures === 0 && <span className="text-[10px] text-muted-foreground lowercase font-normal italic">Gunakan toolbar peta untuk menggambar</span>}
          </h3>

          {totalFeatures === 0 ? (
            <div className="text-center py-12 px-6 bg-muted/30 border border-dashed rounded-xl space-y-2">
              <Compass className="w-8 h-8 text-muted-foreground mx-auto stroke-[1.2]" />
              <p className="text-xs font-bold text-foreground">Peta masih kosong.</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Gunakan instrumen gambar di panel toolbar peta untuk membuat Poligon, Garis (Polyline), atau Waypoint secara interaktif.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 pr-1">
              <AnimatePresence mode="popLayout">
                {geoJsonData.features.map((feature, idx) => {
                  const props = (feature.properties || {}) as GisFeatureProperties;
                  const featureId = props.id || `f-${idx}`;
                  const type = feature.geometry?.type;
                  const isEditing = editingId === featureId;

                  // Measures calculations
                  let areaStr = "";
                  let perimeterStr = "";
                  let lengthStr = "";
                  let posStr = "";

                  if (type === "Polygon" && feature.geometry) {
                    const coords = (feature.geometry as any).coordinates[0];
                    const areaVal = calculatePolygonArea(coords);
                    const perimeterVal = calculatePolygonPerimeter(coords);
                    areaStr = formatArea(areaVal);
                    perimeterStr = formatDistance(perimeterVal);
                  } else if (type === "LineString" && feature.geometry) {
                    const coords = (feature.geometry as any).coordinates;
                    const lenVal = calculateLineLength(coords);
                    lengthStr = formatDistance(lenVal);
                  } else if (type === "Point" && feature.geometry) {
                    const coords = (feature.geometry as any).coordinates;
                    if (coordinateMode === "UTM") {
                      const utm = latLngToUtm(coords[1], coords[0]);
                      posStr = utm.formatted;
                    } else {
                      posStr = `${coords[1].toFixed(6)}°, ${coords[0].toFixed(6)}°`;
                    }
                  }

                  const borderTheme = type === "Polygon"
                    ? "border-l-3 border-l-emerald-500"
                    : type === "LineString"
                    ? "border-l-3 border-l-blue-500"
                    : "border-l-3 border-l-amber-500";

                  const badgeTheme = type === "Polygon"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                    : type === "LineString"
                    ? "bg-blue-50 text-blue-700 border-blue-200/50"
                    : "bg-amber-50 text-amber-700 border-amber-200/50";

                  return (
                    <motion.div
                      key={featureId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`bg-muted/30 border rounded-lg p-3 space-y-2.5 transition-all hover:bg-muted/50 ${borderTheme}`}
                    >
                      {/* Inner properties details */}
                      {isEditing ? (
                        <Card className="p-3 shadow-sm border space-y-2.5">
                          <div>
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Nama Fitur</label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-7 text-xs mt-1 bg-background"
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
                        <div onClick={() => onZoomToFeature(featureId)} className="cursor-pointer group">
                          {/* Header Card */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs">{props.name || `Geometri ${idx + 1}`}</h4>
                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badgeTheme}`}>
                                  {type === "Polygon" ? "Polygon" : type === "LineString" ? "Polyline" : "Point/Marker"}
                                </span>
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
                                    variant={selectedPdfFeatureId === featureId ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => onSelectPdfFeature(selectedPdfFeatureId === featureId ? null : featureId)}
                                    className={`w-7 h-7 ${selectedPdfFeatureId === featureId ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" : ""}`}
                                  >
                                    <FileCode className="w-3.5 h-3.5" />
                                  </Button>
                                } />
                                <TooltipContent>{selectedPdfFeatureId === featureId ? "Terpilih untuk PDF" : "Pilih untuk PDF"}</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger render={
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onZoomToFeature(featureId)}
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
                                    onClick={() => handleStartEditFeature(feature)}
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
                                    onClick={() => onDeleteFeature(featureId)}
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
