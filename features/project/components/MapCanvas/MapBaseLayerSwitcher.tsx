import React from 'react';
import { Layers } from 'lucide-react';
import { BASE_LAYERS } from '../../constants/mapLayers.config';

interface MapBaseLayerSwitcherProps {
  activeLayerId: string;
  showLayerMenu: boolean;
  setShowLayerMenu: (show: boolean) => void;
  onBaseLayerSelect: (layerId: string) => void;
}

export function MapBaseLayerSwitcher({
  activeLayerId,
  showLayerMenu,
  setShowLayerMenu,
  onBaseLayerSelect,
}: MapBaseLayerSwitcherProps) {
  return (
    <div className="absolute top-4 right-4 z-1000">
      <div className="relative">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="bg-white/95 backdrop-blur-xs hover:bg-white text-zinc-800 p-2 rounded-lg border border-zinc-200/80 shadow-md transition-all flex items-center gap-2 cursor-pointer text-xs font-semibold"
          title="Pilih Tampilan Peta Dasar"
        >
          <Layers className="w-4 h-4 text-zinc-650" />
          <span className="hidden sm:inline">Peta Dasar</span>
        </button>

        {showLayerMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-white/98 backdrop-blur-md rounded-xl border border-zinc-200/90 shadow-xl p-1.5 z-1001 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
              Pilih Tile Layer
            </div>
            {BASE_LAYERS.map((layer) => (
              <button
                key={layer.id}
                onClick={() => onBaseLayerSelect(layer.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  activeLayerId === layer.id
                    ? 'bg-zinc-900 text-white font-bold'
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                <span>{layer.name}</span>
                {activeLayerId === layer.id && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
