"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Plus, Trash2, Check, Sparkles, Sliders, ChevronDown } from "lucide-react";
import { GisFeatureProperties } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";

interface EditAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: {
    id: string;
    name: string;
    type?: string;
    color?: string;
    properties?: Record<string, unknown>;
  } | null;
  onSave: (featureId: string, updatedProperties: GisFeatureProperties) => void;
}

export function EditAttributesModal({
  isOpen,
  onClose,
  feature,
  onSave,
}: EditAttributesModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [customProps, setCustomProps] = useState<Record<string, string>>({});
  const [isPresetOpen, setIsPresetOpen] = useState(false);

  useEffect(() => {
    if (!feature || !isOpen) return;

    setName(feature.name || "");
    const props = (feature.properties || {}) as GisFeatureProperties;
    setDescription((props.description as string) || "");
    setColor(feature.color || (props.color as string) || "#3b82f6");

    const custom: Record<string, string> = {};
    const IGNORED_KEYS = ["id", "name", "description", "color", "areaSqm", "perimeterMeters", "geojson", "latlngs", "latLngs", "geometry", "type", "latlng", "latLng", "gpxType"];
    Object.entries(props).forEach(([k, v]) => {
      if (!IGNORED_KEYS.includes(k) && typeof v !== "object") {
        custom[k] = String(v ?? "");
      }
    });
    setCustomProps(custom);
    setIsPresetOpen(false);
  }, [feature, isOpen]);

  if (!feature) return null;

  const handleAddProp = () => {
    const key = `prop_${Object.keys(customProps).length + 1}`;
    setCustomProps({ ...customProps, [key]: "" });
  };

  const handleRemoveProp = (key: string) => {
    const updated = { ...customProps };
    delete updated[key];
    setCustomProps(updated);
  };

  const handlePropChange = (key: string, val: string) => {
    setCustomProps({ ...customProps, [key]: val });
  };

  const handleRenamePropKey = (oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    const updated: Record<string, string> = {};
    Object.entries(customProps).forEach(([k, v]) => {
      if (k === oldKey) updated[newKey] = v;
      else updated[k] = v;
    });
    setCustomProps(updated);
  };

  const handleApplyTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const tmpl = TEMPLATES[templateKey];
    if (!tmpl || !tmpl.data) return;
    setCustomProps({ ...customProps, ...tmpl.data });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feature) return;

    onSave(feature.id, {
      id: feature.id,
      name,
      description,
      color,
      ...customProps,
    });
    onClose();
  };

  const presetColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[92vw] max-h-[90vh] bg-background border-border text-foreground shadow-2xl flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Sliders className="w-5 h-5 text-blue-500" />
              Ubah Atribut Geometri Bidang
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Ubah nama, deskripsi, warna rendering, dan custom properties bidang tanah ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3 text-xs flex-1 max-h-[78vh] overflow-y-auto pr-1.5">
            {/* Nama Bidang */}
            <div>
              <label className="block font-semibold text-foreground mb-1">Nama Bidang / Geometri</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Bidang A - Lahan Pak Budi"
                className="text-xs"
                required
              />
            </div>

            {/* Keterangan / Deskripsi */}
            <div>
              <label className="block font-semibold text-muted-foreground mb-1">Keterangan / Deskripsi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan tambahan, status sertifikat, lokasi, atau peruntukan lahan..."
                className="w-full bg-background text-xs border border-input rounded-md px-3 py-2 h-20 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Warna Rendering */}
            <div>
              <label className="block font-semibold text-muted-foreground mb-1.5">Warna Rendering Geometri</label>
              <div className="flex flex-wrap items-center gap-2">
                {presetColors.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    className="w-6 h-6 rounded-full border border-border flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: hex }}
                  >
                    {color === hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                ))}
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-6 p-0 border-0 cursor-pointer bg-transparent"
                  title="Pilih warna custom"
                />
              </div>
            </div>

            {/* Custom Properties Manager */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Custom Properties
                </label>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant={isPresetOpen ? "secondary" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5 flex items-center gap-1"
                    onClick={() => setIsPresetOpen(!isPresetOpen)}
                  >
                    + Preset Atribut <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${isPresetOpen ? "rotate-180" : ""}`} />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={handleAddProp}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Property
                  </Button>
                </div>
              </div>

              {/* Panel Preset Atribut yang expandable */}
              {isPresetOpen && (
                <div className="p-2.5 bg-muted/40 rounded-lg border border-border space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Klik preset di bawah untuk menambahkan grup atribut:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                      <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 bg-background hover:bg-primary/10 hover:border-primary/50 text-foreground transition-colors flex items-center gap-1.5 shadow-sm"
                        onClick={() => handleApplyTemplate(key as keyof typeof TEMPLATES)}
                      >
                        <Plus className="w-3 h-3 text-emerald-500" />
                        <span>{tmpl.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {Object.entries(customProps).map(([k, v], i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      defaultValue={k}
                      onBlur={(e) => handleRenamePropKey(k, e.target.value)}
                      className="h-7 text-xs w-1/3 bg-muted/50 font-mono"
                      placeholder="Nama Attribute"
                    />
                    <Input
                      value={v}
                      onChange={(e) => handlePropChange(k, e.target.value)}
                      className="h-7 text-xs flex-1 bg-background"
                      placeholder="Nilai Value"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive shrink-0 hover:bg-destructive/10"
                      onClick={() => handleRemoveProp(k)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {Object.keys(customProps).length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic text-center py-2 border border-dashed border-border rounded-md">
                    Belum ada custom properties. Klik &quot;+ Preset Atribut&quot; atau &quot;Tambah Property&quot; untuk menambahkan atribut.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-5 border-t border-border pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Edit3 className="w-4 h-4 mr-1.5" /> Simpan Atribut Bidang
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
