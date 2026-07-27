import React, { useState } from 'react';
import { Check, ChevronDown, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TEMPLATES } from '@/lib/templates';

interface SidebarFeatureEditFormProps {
  featureId: string;
  editName: string;
  setEditName: (val: string) => void;
  editDesc: string;
  setEditDesc: (val: string) => void;
  editColor: string;
  setEditColor: (val: string) => void;
  editCustomProps: Record<string, string>;
  onSave: (featureId: string) => void;
  onCancel: () => void;
  onAddCustomProp: () => void;
  onRemoveCustomProp: (key: string) => void;
  onCustomPropChange: (key: string, val: string) => void;
  onRenameCustomPropKey: (oldKey: string, newKey: string) => void;
  onApplyTemplate: (templateKey: keyof typeof TEMPLATES) => void;
}

export function SidebarFeatureEditForm({
  featureId,
  editName,
  setEditName,
  editDesc,
  setEditDesc,
  editColor,
  setEditColor,
  editCustomProps,
  onSave,
  onCancel,
  onAddCustomProp,
  onRemoveCustomProp,
  onCustomPropChange,
  onRenameCustomPropKey,
  onApplyTemplate,
}: SidebarFeatureEditFormProps) {
  const [isPresetOpen, setIsPresetOpen] = useState(false);

  return (
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
            <Button
              type="button"
              variant={isPresetOpen ? "secondary" : "outline"}
              size="sm"
              className="h-6 text-[9px] px-1.5 flex items-center gap-0.5"
              onClick={() => setIsPresetOpen(!isPresetOpen)}
            >
              + Preset <ChevronDown className={`w-2.5 h-2.5 opacity-70 transition-transform ${isPresetOpen ? "rotate-180" : ""}`} />
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-6 w-6 p-0" onClick={onAddCustomProp}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Expandable Preset Panel */}
        {isPresetOpen && (
          <div className="p-2 bg-background/80 rounded border border-border space-y-1 my-1">
            <p className="text-[10px] font-semibold text-muted-foreground">Pilih preset atribut:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-5 text-[9px] px-1.5 bg-background hover:bg-primary/10 text-foreground flex items-center gap-1"
                  onClick={() => onApplyTemplate(key as keyof typeof TEMPLATES)}
                >
                  <Plus className="w-2.5 h-2.5 text-emerald-500" />
                  <span>{tmpl.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {Object.entries(editCustomProps).map(([key, val], i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                defaultValue={key}
                onBlur={(e) => onRenameCustomPropKey(key, e.target.value)}
                className="h-6 text-[10px] w-1/3 bg-muted/50"
                placeholder="Key"
              />
              <Input
                value={val}
                onChange={(e) => onCustomPropChange(key, e.target.value)}
                className="h-6 text-[10px] flex-1 bg-background"
                placeholder="Value"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => onRemoveCustomProp(key)}>
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
        <Button variant="outline" size="sm" onClick={onCancel} className="h-7 text-[11px]">
          Batal
        </Button>
        <Button size="sm" onClick={() => onSave(featureId)} className="h-7 text-[11px]">
          Simpan
        </Button>
      </div>
    </Card>
  );
}
