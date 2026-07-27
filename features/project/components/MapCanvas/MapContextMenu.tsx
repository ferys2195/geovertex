import React from 'react';
import { Copy } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MapContextMenuProps {
  children: React.ReactNode;
  onCopyCoordinates: () => void;
}

export function MapContextMenu({ children, onCopyCoordinates }: MapContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full block relative">
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48 z-9999">
        <ContextMenuItem onClick={onCopyCoordinates} className="cursor-pointer flex items-center gap-2">
          <Copy className="w-4 h-4 text-zinc-500" />
          <span className="font-medium">Salin Koordinat</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
