import React from "react";
import { Share2, Download, Coffee, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "../../store/useProjectStore";

interface ActionButtonsProps {
  onOpenShareModal: () => void;
  onOpenExportModal: () => void;
  onOpenSupportModal: () => void;
}

export function ActionButtons({ onOpenShareModal, onOpenExportModal, onOpenSupportModal }: ActionButtonsProps) {
  const setIsImportGpxOpen = useProjectStore((state) => state.setIsImportGpxOpen);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsImportGpxOpen(true)}
        title="Buka / Import File GPX"
        className="border-emerald-600/40 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 text-[11px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 shrink-0"
      >
        <FileCode className="w-3.5 h-3.5 sm:mr-1.5 text-emerald-400" />
        <span className="hidden sm:inline">Import GPX</span>
        <span className="hidden xs:inline sm:hidden">GPX</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onOpenSupportModal}
        title="Dukung Pengembangan GeoVertex (Trakteer / Saweria)"
        className="border-amber-600/40 bg-linear-to-r from-amber-950/60 to-orange-950/60 hover:from-amber-900/80 hover:to-orange-900/80 text-amber-200 hover:text-amber-100 text-[11px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 shrink-0 shadow-sm"
      >
        <Coffee className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400" />
        <span className="hidden sm:inline">Dukung</span>
        <span className="hidden xs:inline sm:hidden">☕</span>
      </Button>

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
