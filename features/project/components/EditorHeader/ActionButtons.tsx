import React from "react";
import { Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onOpenShareModal: () => void;
  onOpenExportModal: () => void;
}

export function ActionButtons({ onOpenShareModal, onOpenExportModal }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onOpenShareModal}
        className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs h-8"
      >
        <Share2 className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Kolaborasi Tim
      </Button>

      <Button
        size="sm"
        onClick={onOpenExportModal}
        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold"
      >
        <Download className="w-3.5 h-3.5 mr-1.5" /> Ekspor PDF &amp; Data
      </Button>
    </div>
  );
}
