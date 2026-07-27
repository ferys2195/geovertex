import React from "react";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { CloudSaveStatus } from "../../types/project.types";

interface AutoSaveStatusProps {
  isAutoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  saveStatus: CloudSaveStatus;
}

export function AutoSaveStatus({
  isAutoSaveEnabled,
  onToggleAutoSave,
  saveStatus,
}: AutoSaveStatusProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      {/* Auto-Save Settings Toggle */}
      <button
        type="button"
        onClick={onToggleAutoSave}
        title={
          isAutoSaveEnabled
            ? "Auto-Save Aktif (Klik untuk menonaktifkan)"
            : "Auto-Save Non-Aktif (Klik untuk mengaktifkan)"
        }
        className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-bold ${
          isAutoSaveEnabled
            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900/50"
            : "bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isAutoSaveEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
          }`}
        />
        <span className="tracking-tight">
          Auto-Save: {isAutoSaveEnabled ? "ON" : "OFF"}
        </span>
      </button>

      {/* Cloud status badge */}
      <div
        className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/90 px-3 py-1 rounded-full border border-slate-800 shrink-0"
        title={
          saveStatus === "saving"
            ? "Menyimpan ke Cloud..."
            : saveStatus === "synced"
            ? "Tersimpan di Cloud"
            : "Belum Tersimpan"
        }
      >
        {saveStatus === "saving" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span className="hidden sm:inline">Menyimpan ke Cloud...</span>
          </>
        ) : saveStatus === "synced" ? (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium hidden sm:inline">Tersimpan di Cloud</span>
          </>
        ) : (
          <>
            <CloudOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-medium hidden sm:inline">Belum Tersimpan</span>
          </>
        )}
      </div>
    </div>
  );
}
