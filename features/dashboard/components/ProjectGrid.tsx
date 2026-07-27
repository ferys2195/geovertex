import React from "react";
import { Project } from "@/lib/supabase/types";
import { ProjectCard } from "./ProjectCard";
import { Button } from "@/components/ui/button";
import { Map, Plus } from "lucide-react";

interface ProjectGridProps {
  projects: Project[];
  loading: boolean;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onCreateOpen: () => void;
}

export function ProjectGrid({
  projects,
  loading,
  onOpenProject,
  onDeleteProject,
  onCreateOpen,
}: ProjectGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-52 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
        <Map className="w-12 h-12 text-slate-600 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-300">Belum Ada Proyek Pemetaan</h3>
          <p className="text-xs text-slate-500">Mulai dengan membuat proyek pemetaan berbasis cloud pertama Anda.</p>
        </div>
        <Button onClick={onCreateOpen} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
          <Plus className="w-4 h-4 mr-1.5" /> Buat Proyek Pertama
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpenProject}
          onDelete={onDeleteProject}
        />
      ))}
    </div>
  );
}
