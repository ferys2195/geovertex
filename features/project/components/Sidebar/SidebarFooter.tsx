import React from 'react';

export function SidebarFooter() {
  return (
    <div className="p-3.5 bg-muted/40 text-muted-foreground border-t border-border flex items-center justify-center font-semibold">
      <div className="text-[11px] opacity-90">
        &copy; {new Date().getFullYear()} GeoVertex SaaS. Collaborative GIS Platform.
      </div>
    </div>
  );
}
