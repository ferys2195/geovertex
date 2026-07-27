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
    <div className="flex items-center gap-3">
      {/* Auto-Save Settings Toggle */}
      <button
        type="button"
        onClick={onToggleAutoSave}
        title={isAutoSaveEnabled ? "Auto-Save Aktif (Klik untuk menonaktifkan)" : "Auto-Save Non-Aktif (Klik untuk mengaktifkan)"}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
          isAutoSaveEnabled
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isAutoSaveEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
        <span className="font-semibold text-[11px]">
          Auto-Save: {isAutoSaveEnabled ? "ON" : "OFF"}
        </span>
      </button>

      {/* Cloud status badge */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
        {saveStatus === "saving" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Menyimpan ke Cloud...</span>
          </>
        ) : saveStatus === "synced" ? (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Tersimpan di Cloud</span>
          </>
        ) : (
          <>
            <CloudOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400">Belum Tersimpan</span>
          </>
        )}
      </div>
    </div>
  );
}
