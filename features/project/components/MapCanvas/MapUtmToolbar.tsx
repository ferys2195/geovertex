import React from 'react';
import { Calculator } from 'lucide-react';

interface MapUtmToolbarProps {
  onOpenUtmDialog: () => void;
  isSidebarOpen?: boolean;
}

export function MapUtmToolbar({ onOpenUtmDialog, isSidebarOpen = false }: MapUtmToolbarProps) {
  return (
    <div
      className="absolute top-4 z-1000 flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ left: isSidebarOpen ? '376px' : '56px' }}
    >
      <button
        onClick={onOpenUtmDialog}
        className="bg-white/95 backdrop-blur-xs hover:bg-white text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 shadow-md font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="Buka UTM Converter & Input Koordinat"
      >
        <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-slate-900 font-extrabold">UTM Converter</span>
      </button>

      <div className="hidden md:block bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-900 shadow-xs">
        <span className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 text-slate-800">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
          </span>
          Double-Klik jika selesai menggambar jalur/area. Drag titik untuk mengubah geometri.
        </span>
      </div>
    </div>
  );
}
