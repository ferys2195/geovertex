import React from "react";
import Link from "next/link";
import { ArrowLeft, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRole } from "../../types/project.types";

interface ProjectTitleBarProps {
  projectTitle?: string;
  currentRole: UserRole;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ProjectTitleBar({
  projectTitle,
  currentRole,
  isSidebarOpen,
  onToggleSidebar,
}: ProjectTitleBarProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
      <Link
        href="/dashboard"
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800 shrink-0"
        title="Kembali ke Dashboard"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </Link>
      <div className="h-4 w-px bg-slate-800 shrink-0" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className={`h-7 w-7 sm:h-8 sm:w-8 text-slate-300 hover:text-white shrink-0 ${
          isSidebarOpen ? "bg-slate-800 text-blue-400" : ""
        }`}
        title="Buka/Tutup Sidebar Panel"
      >
        <PanelLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>

      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <h1 className="font-bold text-xs sm:text-sm text-white truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-xs">
          {projectTitle || "Proyek Pemetaan"}
        </h1>
        <span
          className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase shrink-0 ${
            currentRole === "owner"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : currentRole === "editor"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          <span className="hidden xs:inline">Role: </span>
          {currentRole}
        </span>
      </div>
    </div>
  );
}
