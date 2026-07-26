"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Download, Loader2, FileSpreadsheet, MapPin, Globe } from "lucide-react";
import { exportCartographicPDF, MapFeatureExportData, Orientation } from "@/lib/export/pdfExporter";
import { exportToGeoJSON, exportToGPX, exportToKML, exportToCSV } from "@/lib/export/gisExporter";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  features: MapFeatureExportData[];
  selectedPdfFeatureId?: string | null;
  onSelectPdfFeature?: (id: string | null) => void;
  isProTier?: boolean;
}

export function ExportModal({
  isOpen,
  onClose,
  projectTitle,
  features,
  selectedPdfFeatureId = null,
  onSelectPdfFeature,
  isProTier = false,
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<"pdf" | "data">("pdf");
  const [title, setTitle] = useState(projectTitle || "Peta Hasil Digitasi Lahan");
  const [subtitle, setSubtitle] = useState("GeoVertex SaaS — Collaborative GIS Platform");
  const [author, setAuthor] = useState("Drafter Pemetaan");
  const [organization, setOrganization] = useState("Surveyor Team");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [targetFeatureId, setTargetFeatureId] = useState<string | "all">(selectedPdfFeatureId || "all");
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportCartographicPDF(features, {
        title,
        subtitle,
        author,
        organization,
        orientation,
        isProTier,
        selectedFeatureId: targetFeatureId === "all" ? null : targetFeatureId,
      });
      onClose();
    } catch (err) {
      console.error("PDF Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-135 bg-background border-border text-foreground shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Download className="w-5 h-5 text-primary" />
            Ekspor Data & Laporan Peta
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Pilih format ekspor laporan peta kartografi PDF berskala atau format data spasial digital.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mt-2">
          <TabsList className="grid grid-cols-2 w-full bg-muted">
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              Laporan PDF Kartografi
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              Data Spasial Digital
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 pt-4">
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-emerald-500 mb-1">Target Bidang / Feature PDF</label>
                <select
                  value={targetFeatureId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTargetFeatureId(val);
                    onSelectPdfFeature?.(val === "all" ? null : val);
                  }}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs font-medium text-foreground focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">🌐 Seluruh Bidang (Overview Map)</option>
                  {features.map((feat) => (
                    <option key={feat.id} value={feat.id}>
                      🔹 {feat.name} ({feat.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Judul Utama Peta</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Misal: PETA SERTIFIKAT LAHAN BLOK A" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Sub-Judul / Catatan Laporan</label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Misal: SURAT UKUR KADASTRAL DESA SUKAMAJU" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Nama Pembuat / Author</label>
                  <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Organisasi / Tim</label>
                  <Input value={organization} onChange={(e) => setOrganization(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Orientasi Kertas (A4)</label>
                <div className="flex gap-3 mt-1">
                  <Button
                    type="button"
                    variant={orientation === "portrait" ? "default" : "outline"}
                    className="flex-1 text-xs"
                    onClick={() => setOrientation("portrait")}
                  >
                    A4 Portrait
                  </Button>
                  <Button
                    type="button"
                    variant={orientation === "landscape" ? "default" : "outline"}
                    className="flex-1 text-xs"
                    onClick={() => setOrientation("landscape")}
                  >
                    A4 Landscape
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={onClose} disabled={isExporting}>
                Batal
              </Button>
              <Button onClick={handleExportPDF} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generasi PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Unduh PDF Kartografi
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="data" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground mb-3">Unduh berkas spasial untuk digunakan di QGIS, ArcGIS, Google Earth, atau Excel:</p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex flex-col items-start justify-center p-3 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 text-left"
                onClick={() => {
                  exportToGeoJSON(features, projectTitle);
                  onClose();
                }}
              >
                <span className="font-bold text-sm text-emerald-500 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> GeoJSON (.geojson)
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">Standar GIS & Web Map</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex flex-col items-start justify-center p-3 border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10 text-left"
                onClick={() => {
                  exportToGPX(features, projectTitle);
                  onClose();
                }}
              >
                <span className="font-bold text-sm text-orange-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> GPX (.gpx)
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">Perangkat GPS Garmin & Lapangan</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex flex-col items-start justify-center p-3 border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 text-left"
                onClick={() => {
                  exportToKML(features, projectTitle);
                  onClose();
                }}
              >
                <span className="font-bold text-sm text-blue-500 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> KML (.kml)
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">Google Earth & Mobile Apps</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex flex-col items-start justify-center p-3 border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 text-left"
                onClick={() => {
                  exportToCSV(features, projectTitle);
                  onClose();
                }}
              >
                <span className="font-bold text-sm text-purple-500 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> CSV Vertex Table (.csv)
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">Tabel Koordinat X/Y & Lat/Lng</span>
              </Button>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
