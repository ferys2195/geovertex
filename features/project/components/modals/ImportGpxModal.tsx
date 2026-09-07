"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileCode, CheckCircle2, AlertCircle, HardDrive, Info } from "lucide-react";
import { parseGpxString, ParsedGpxResult } from "../../utils/gpxParser";
import { useProjectStore } from "../../store/useProjectStore";

interface ImportGpxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportGpxModal({ isOpen, onClose }: ImportGpxModalProps) {
  const addTempGpxFeatures = useProjectStore((state) => state.addTempGpxFeatures);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParsedGpxResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = () => {
    setSelectedFile(null);
    setParseResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".gpx") && !file.name.toLowerCase().endsWith(".xml")) {
      setErrorMsg("Format file harus berupa .gpx atau .xml");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const content = await file.text();
      const result = parseGpxString(content, file.name);
      setSelectedFile(file);
      setParseResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membaca file GPX.";
      setErrorMsg(msg);
      setSelectedFile(null);
      setParseResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.features.length === 0) return;

    addTempGpxFeatures(parseResult.features);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-100">
            <FileCode className="w-5 h-5 text-emerald-400" />
            Import / Buka File GPX
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Impor data trek, rute, atau waypoint dari file GPS (.gpx).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Info Banner */}
          <div className="bg-slate-800/80 border border-emerald-500/30 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-300">Penyimpanan Temporer:</span> File GPX tidak akan langsung disimpan ke database proyek Supabase. Data akan dibuka di <span className="text-slate-100 font-mono">Local Storage</span> browser. Anda dapat menyimpannya ke database kapan saja.
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? "border-emerald-500 bg-emerald-500/10"
                : selectedFile
                ? "border-emerald-500/50 bg-slate-800/50"
                : "border-slate-700 hover:border-slate-500 bg-slate-850/50 hover:bg-slate-800/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx,.xml"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                <Upload className="w-6 h-6" />
              </div>

              {selectedFile ? (
                <div>
                  <p className="font-medium text-slate-200 text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Tarik & Lepas file GPX di sini, atau <span className="text-emerald-400 underline">Pilih File</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Format didukung: .gpx (GPS Exchange Format)</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parse Result Summary */}
          {parseResult && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-200 border-b border-slate-700/50 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ringkasan Data GPX
                </span>
                <span className="text-emerald-400 font-mono">
                  {parseResult.features.length} Fitur
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-slate-900/60 rounded p-1.5 border border-slate-800">
                  <span className="block text-slate-400 text-[10px]">Waypoint</span>
                  <span className="font-bold text-red-400 text-sm">{parseResult.waypointsCount}</span>
                </div>
                <div className="bg-slate-900/60 rounded p-1.5 border border-slate-800">
                  <span className="block text-slate-400 text-[10px]">Track</span>
                  <span className="font-bold text-blue-400 text-sm">{parseResult.tracksCount}</span>
                </div>
                <div className="bg-slate-900/60 rounded p-1.5 border border-slate-800">
                  <span className="block text-slate-400 text-[10px]">Route</span>
                  <span className="font-bold text-pink-400 text-sm">{parseResult.routesCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={!parseResult || parseResult.features.length === 0 || isProcessing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5"
          >
            <HardDrive className="w-4 h-4" />
            Buka di Canvas (Temp)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
