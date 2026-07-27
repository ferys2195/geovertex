import React from 'react';
import { Layers } from 'lucide-react';

interface SidebarHeaderProps {
  filteredCount: number;
  totalCount: number;
}

export function SidebarHeader({ filteredCount, totalCount }: SidebarHeaderProps) {
  return (
    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-sm text-foreground">Daftar Bidang &amp; Layer</h3>
      </div>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        {filteredCount} / {totalCount} Item
      </span>
    </div>
  );
}
