import React from "react";
import { Project } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Map, Users, Calendar, Trash2, ExternalLink } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  return (
    <div
      onClick={() => onOpen(project.id)}
      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-blue-500/10"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Map className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
              onClick={(e) => onDelete(project.id, e)}
              title="Hapus Proyek"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {project.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-8">
            {project.description || "Tidak ada deskripsi proyek."}
          </p>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            {project.members_count || 1} Tim
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {new Date(project.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </span>
        </div>

        <span className="text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          Buka Editor <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
