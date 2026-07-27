import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SidebarSearchProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearSearch: () => void;
}

export function SidebarSearch({ searchQuery, onSearchQueryChange, onClearSearch }: SidebarSearchProps) {
  return (
    <div className="p-2.5 border-b border-slate-800 bg-slate-900/60">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Cari bidang, deskripsi, atribut..."
          className="pl-8 pr-7 text-xs h-8 bg-background border-border text-foreground focus-visible:ring-emerald-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50"
            title="Hapus Pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
