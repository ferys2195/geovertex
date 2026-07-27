import React from 'react';
import { Compass, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarEmptyStateProps {
  totalFeaturesCount: number;
  searchQuery: string;
  onResetSearch: () => void;
}

export function SidebarEmptyState({ totalFeaturesCount, searchQuery, onResetSearch }: SidebarEmptyStateProps) {
  if (totalFeaturesCount === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-xl bg-card/40 my-4">
        <Compass className="w-8 h-8 mx-auto text-muted-foreground/60 animate-pulse" />
        <p className="text-xs font-medium">Belum ada bidang atau objek spasial.</p>
        <p className="text-[11px] text-muted-foreground/80">Gunakan toolbar peta untuk melukis polygon bidang tanah.</p>
      </div>
    );
  }

  return (
    <div className="p-5 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-xl bg-card/40 my-3">
      <Search className="w-6 h-6 mx-auto text-muted-foreground/60" />
      <p className="text-xs font-semibold">Tidak ditemukan hasil pencarian.</p>
      <p className="text-[11px] text-muted-foreground">Tidak ada bidang yang cocok dengan kata kunci &quot;{searchQuery}&quot;.</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 text-[11px] text-emerald-500 hover:text-emerald-400 mt-1"
        onClick={onResetSearch}
      >
        Reset Pencarian
      </Button>
    </div>
  );
}
