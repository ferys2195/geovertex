import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, ShieldAlert } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateProjectModal({
  isOpen,
  onOpenChange,
  title,
  setTitle,
  description,
  setDescription,
  isSubmitting,
  errorMessage,
  onSubmit,
}: CreateProjectModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120 bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Plus className="w-5 h-5 text-blue-400" /> Buat Proyek Pemetaan Baru
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Isi parameter proyek untuk membuka kanvas pemetaan spasial kolaboratif.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Proyek *</label>
            <Input
              placeholder="Misal: Digitasi Sertifikat Lahan Sukamaju"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Proyek</label>
            <Input
              placeholder="Misal: Pemetaan batas area dan konversi titik UTM"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-800 text-xs">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
              {isSubmitting ? "Membuat..." : "Buat & Buka Canvas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
