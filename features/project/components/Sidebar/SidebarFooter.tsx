import React from 'react';

export function SidebarFooter() {
  return (
    <div className="p-3 bg-muted/40 text-muted-foreground border-t border-border flex items-center justify-between text-[11px]">
      <div>&copy; {new Date().getFullYear()} GeoVertex</div>
      <div>
        By{" "}
        <a
          href="https://feryirawan.com"
          target="_blank"
          rel="noreferrer"
          className="text-foreground font-semibold hover:underline"
        >
          Fery Irawan
        </a>
      </div>
    </div>
  );
}
