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
    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
      {/* Auto-Save Settings Toggle */}
      <button
        type="button"
        onClick={onToggleAutoSave}
        title={
          isAutoSaveEnabled
            ? "Auto-Save Aktif (Klik untuk menonaktifkan)"
            : "Auto-Save Non-Aktif (Klik untuk mengaktifkan)"
        }
        className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
          isAutoSaveEnabled
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
            isAutoSaveEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
          }`}
        />
        <span className="font-semibold text-[10px] sm:text-[11px]">
          <span className="hidden xs:inline">Auto-Save: </span>
          {isAutoSaveEnabled ? "ON" : "OFF"}
        </span>
      </button>

      {/* Cloud status badge */}
      <div
        className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-400 bg-slate-950 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-slate-800 shrink-0"
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
            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-blue-400" />
            <span className="hidden sm:inline">Menyimpan ke Cloud...</span>
          </>
        ) : saveStatus === "synced" ? (
          <>
            <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            <span className="text-emerald-400 hidden sm:inline">Tersimpan di Cloud</span>
          </>
        ) : (
          <>
            <CloudOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span className="text-amber-400 hidden sm:inline">Belum Tersimpan</span>
          </>
        )}
      </div>
    </div>
  );
}
