import React from "react";
import { Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onOpenShareModal: () => void;
  onOpenExportModal: () => void;
}

export function ActionButtons({ onOpenShareModal, onOpenExportModal }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <Button
        size="sm"
        variant="outline"
        onClick={onOpenShareModal}
        title="Kolaborasi Tim & Undang Anggota"
        className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-[11px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 shrink-0"
      >
        <Share2 className="w-3.5 h-3.5 sm:mr-1.5 text-blue-400" />
        <span className="hidden sm:inline">Kolaborasi Tim</span>
        <span className="hidden xs:inline sm:hidden">Tim</span>
      </Button>

      <Button
        size="sm"
        onClick={onOpenExportModal}
        title="Ekspor PDF Peta & Data GIS"
        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 font-semibold shrink-0"
      >
        <Download className="w-3.5 h-3.5 sm:mr-1.5" />
        <span className="hidden sm:inline">Ekspor PDF & Data</span>
        <span className="hidden xs:inline sm:hidden">Ekspor</span>
      </Button>
    </div>
  );
}
