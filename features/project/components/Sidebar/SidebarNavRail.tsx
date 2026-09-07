"use client";

import React from "react";
import { Layers, FileCode, Settings, PanelLeftClose, Map } from "lucide-react";
import { useProjectStore, SidebarTab } from "../../store/useProjectStore";

interface SidebarNavRailProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  tempCount: number;
  layersCount: number;
  onToggleSidebar: () => void;
}

export function SidebarNavRail({
  activeTab,
  onTabChange,
  tempCount,
  layersCount,
  onToggleSidebar,
}: SidebarNavRailProps) {
  const navItems: {
    id: SidebarTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: "layers",
      label: "Daftar Bidang",
      icon: Layers,
      badge: layersCount,
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    {
      id: "drafts",
      label: "Draft & Temp GPX",
      icon: FileCode,
      badge: tempCount,
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      id: "settings",
      label: "Pengaturan Editor",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-14 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center justify-between py-3.5 shrink-0 z-30 select-none">
      {/* Top Section: App Brand & Nav Tabs */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Brand Icon Header */}
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
          <Map className="w-5 h-5 stroke-[2.2]" />
        </div>

        <div className="w-8 h-px bg-slate-800/80 my-0.5" />

        {/* Navigation Rail Buttons */}
        <nav className="flex flex-col items-center gap-2.5 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-xs shadow-emerald-950/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`} />

                {/* Active Indicator Pillar */}
                {isActive && (
                  <span className="absolute -left-2 w-1 h-5 bg-emerald-400 rounded-r-full shadow-sm shadow-emerald-400/50" />
                )}

                {/* Counter Badge if > 0 */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-[9px] font-mono font-bold px-1 min-w-[16px] h-4 rounded-full border flex items-center justify-center ${
                      item.badgeColor || "bg-slate-800 text-slate-200 border-slate-700"
                    }`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Collapse Toggle */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          title="Tutup Sidebar"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-colors border border-transparent"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
