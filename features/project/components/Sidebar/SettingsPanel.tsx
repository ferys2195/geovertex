"use client";

import React, { useState, useEffect } from "react";
import { Settings, Sliders, Cloud, Compass, FolderEdit, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "../../store/useProjectStore";
import { CoordinateMode } from "../../types/project.types";
import { createClient } from "@/lib/supabase/client";

interface SettingsPanelProps {
  coordinateMode: CoordinateMode;
}

export function SettingsPanel({ coordinateMode }: SettingsPanelProps) {
  const project = useProjectStore((state) => state.project);
  const projectId = useProjectStore((state) => state.projectId);
  const currentRole = useProjectStore((state) => state.currentRole);
  const members = useProjectStore((state) => state.members);
  const setProjectData = useProjectStore((state) => state.setProjectData);
  const isAutoSaveEnabled = useProjectStore((state) => state.isAutoSaveEnabled);
  const toggleAutoSave = useProjectStore((state) => state.toggleAutoSave);
  const setCoordinateMode = useProjectStore((state) => state.setCoordinateMode);
  const saveStatus = useProjectStore((state) => state.saveStatus);

  const isReadOnly = currentRole === "viewer";

  const [title, setTitle] = useState(project?.title || "");
  const [description, setDescription] = useState(project?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setDescription(project.description || "");
    }
  }, [project]);

  const handleSaveProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isReadOnly) return;

    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (projectId && !projectId.startsWith("demo-proj")) {
        const supabase = createClient();
        const { error } = await supabase
          .from("projects")
          .update({
            title: title.trim(),
            description: description.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);

        if (error) {
          throw error;
        }
      }

      // Update store state immediately
      if (project) {
        setProjectData(
          {
            ...project,
            title: title.trim(),
            description: description.trim(),
            updated_at: new Date().toISOString(),
          },
          currentRole,
          members
        );
      }

      setSuccessMsg("Detail proyek berhasil diperbarui!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui proyek.";
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Pengaturan Editor</h2>
            <p className="text-[11px] text-slate-400">Konfigurasi Proyek & Preferensi Canvas</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Section 1: Edit Project Details (Title & Description) */}
        <form onSubmit={handleSaveProjectDetails} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <FolderEdit className="w-4 h-4 text-emerald-400" />
              <span>Detail Proyek</span>
            </div>
            {isReadOnly && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                Read Only
              </span>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Judul Proyek</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isReadOnly || isSaving}
              placeholder="Masukkan judul proyek pemetaan..."
              className="h-8 text-xs bg-slate-900 border-slate-800 focus:border-emerald-500 text-slate-200"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Deskripsi Proyek</label>
            <textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              disabled={isReadOnly || isSaving}
              placeholder="Tambahkan catatan atau deskripsi singkat lokasi..."
              className="w-full min-h-[70px] p-2 text-xs rounded-md bg-slate-900 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Feedback Messages */}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          {!isReadOnly && (
            <Button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Simpan Detail Proyek
                </>
              )}
            </Button>
          )}
        </form>

        {/* Section 2: System Coordinate Settings */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Format Sistem Koordinat</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCoordinateMode("UTM")}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                coordinateMode === "UTM"
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-xs"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <span className="block text-xs font-bold font-mono">UTM Zone</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">Metrik (Zona Spasial)</span>
            </button>

            <button
              type="button"
              onClick={() => setCoordinateMode("LatLng")}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                coordinateMode === "LatLng"
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-xs"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <span className="block text-xs font-bold font-mono">Lat / Lng</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">Derajat Desimal</span>
            </button>
          </div>
        </div>

        {/* Section 3: Cloud Auto-Save Settings */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Cloud Auto-Save</span>
            </div>

            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                saveStatus === "synced"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : saveStatus === "saving"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}
            >
              {saveStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div>
              <p className="text-xs font-medium text-slate-300">Simpan Otomatis Ke Cloud</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Simpan perubahan layer permanen secara berkala</p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={toggleAutoSave}
              className={`text-xs h-7 px-2.5 font-medium border ${
                isAutoSaveEnabled
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : "border-slate-700 text-slate-400 bg-slate-800"
              }`}
            >
              {isAutoSaveEnabled ? "Aktif" : "Non-Aktif"}
            </Button>
          </div>
        </div>

        {/* Section 4: Preferences Summary */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Info Versi & Platform</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-400">
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span>Aplikasi</span>
              <span className="font-mono text-slate-300">GeoVertex GIS v1.0</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span>Engine Canvas</span>
              <span className="font-mono text-slate-300">Leaflet + Mapbox GL</span>
            </div>
            <div className="flex justify-between">
              <span>Mode Render</span>
              <span className="font-mono text-emerald-400">Feature-based Hybrid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
