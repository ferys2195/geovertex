import React from 'react';
import { Calculator } from 'lucide-react';

interface MapUtmToolbarProps {
  onOpenUtmDialog: () => void;
  isSidebarOpen?: boolean;
  readOnly?: boolean;
}

export function MapUtmToolbar({ onOpenUtmDialog, isSidebarOpen = false, readOnly = false }: MapUtmToolbarProps) {
  return (
    <div
      className="absolute top-4 z-30 flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ left: isSidebarOpen ? '376px' : '56px' }}
    >
      <button
        onClick={() => {
          if (!readOnly) onOpenUtmDialog();
        }}
        disabled={readOnly}
        className="bg-white/95 backdrop-blur-xs hover:bg-white text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 shadow-md font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        title={readOnly ? "Role Viewer hanya memiliki akses baca" : "Buka UTM Converter & Input Koordinat"}
      >
        <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-slate-900 font-extrabold">UTM Converter</span>
      </button>

      <div className="hidden md:block bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-900 shadow-xs">
        <span className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 text-slate-800">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${readOnly ? "bg-amber-400" : "bg-slate-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${readOnly ? "bg-amber-500" : "bg-slate-950"}`}></span>
          </span>
          {readOnly
            ? "Mode Read-Only (Viewer). Akses pengeditan dan pembuatan geometri dinonaktifkan."
            : "Double-Klik jika selesai menggambar jalur/area. Drag titik untuk mengubah geometri."}
        </span>
      </div>
    </div>
  );
}
