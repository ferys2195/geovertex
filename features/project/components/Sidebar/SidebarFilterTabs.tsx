import React from 'react';
import { Feature } from 'geojson';

export type FeatureFilterType = 'ALL' | 'Polygon' | 'LineString' | 'Point';

interface SidebarFilterTabsProps {
  activeFilter: FeatureFilterType;
  onFilterChange: (filter: FeatureFilterType) => void;
  features: Feature[];
}

export function SidebarFilterTabs({
  activeFilter,
  onFilterChange,
  features,
}: SidebarFilterTabsProps) {
  const counts = React.useMemo(() => {
    let polygonCount = 0;
    let lineCount = 0;
    let pointCount = 0;

    features.forEach((feat) => {
      const type = feat.geometry?.type;
      if (type === 'Polygon' || type === 'MultiPolygon') {
        polygonCount++;
      } else if (type === 'LineString' || type === 'MultiLineString') {
        lineCount++;
      } else if (type === 'Point' || type === 'MultiPoint') {
        pointCount++;
      }
    });

    return {
      ALL: features.length,
      Polygon: polygonCount,
      LineString: lineCount,
      Point: pointCount,
    };
  }, [features]);

  const tabs: { id: FeatureFilterType; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'Polygon', label: 'Polygon' },
    { id: 'LineString', label: 'Polyline' },
    { id: 'Point', label: 'Point' },
  ];

  return (
    <div className="px-2.5 py-1.5 border-b border-slate-800 bg-slate-900/40">
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          const count = counts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={`flex items-center justify-center gap-1 py-1 px-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded-full ${
                  isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
