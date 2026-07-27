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
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors" title="Kembali ke Dashboard">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div className="h-4 w-px bg-slate-800" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className={`h-8 w-8 text-slate-300 hover:text-white ${isSidebarOpen ? "bg-slate-800 text-blue-400" : ""}`}
        title="Buka/Tutup Sidebar Panel"
      >
        <PanelLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2">
        <h1 className="font-bold text-sm text-white">{projectTitle || "Proyek Pemetaan"}</h1>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
            currentRole === "owner"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : currentRole === "editor"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          Role: {currentRole}
        </span>
      </div>
    </div>
  );
}
