import React from 'react';
import { CoordinateMode } from '@/lib/types';
import { latLngToUtm } from '@/lib/gis';
import { Crosshair, ArrowRightLeft } from 'lucide-react';
import { LatLngCoords } from '../../types/mapCanvas.types';

interface MapCoordinateBarProps {
  hoverCoords: LatLngCoords | null;
  internalHoverCoords: LatLngCoords | null;
  activeCoordMode: CoordinateMode;
  onToggleCoordinateMode: () => void;
}

export function MapCoordinateBar({
  hoverCoords,
  internalHoverCoords,
  activeCoordMode,
  onToggleCoordinateMode,
}: MapCoordinateBarProps) {
  const currentHover = hoverCoords || internalHoverCoords;

  return (
    <div className="absolute bottom-4 left-4 z-1000 bg-white/95 backdrop-blur-xs text-slate-900 py-1.5 px-3.5 rounded-lg border border-slate-200 shadow-md flex items-center gap-2 font-mono text-[11px]">
      <Crosshair className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
      <span className="text-slate-500 border-r border-slate-200 pr-2 font-bold uppercase tracking-wider text-[9px]">Kursor:</span>
      {currentHover ? (
        activeCoordMode === 'UTM' ? (
          <span className="text-slate-900 font-extrabold">
            {latLngToUtm(currentHover.lat, currentHover.lng).formatted}
          </span>
        ) : (
          <span className="text-slate-900 font-extrabold">
            Lat: <span>{currentHover.lat.toFixed(6)}°</span>, Lng: <span>{currentHover.lng.toFixed(6)}°</span>
          </span>
        )
      ) : (
        <span className="text-slate-500 font-medium italic">Pindahkan kursor di atas peta</span>
      )}

      <div className="h-3 w-px bg-slate-200 mx-1" />

      <button
        onClick={onToggleCoordinateMode}
        className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
        title="Klik untuk Ganti Format Koordinat (UTM ↔ Lat/Lng)"
      >
        <ArrowRightLeft className="w-3 h-3 text-blue-600" />
        <span>{activeCoordMode === 'UTM' ? 'UTM' : 'Lat/Lng'}</span>
      </button>
    </div>
  );
}
