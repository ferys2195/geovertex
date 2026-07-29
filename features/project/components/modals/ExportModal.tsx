"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Loader2,
  FileSpreadsheet,
  MapPin,
  Globe,
  Eye,
  Layers,
  Check,
  Maximize2,
  Sparkles,
  Grid,
  Ruler,
} from "lucide-react";
import {
  exportCartographicPDF,
  renderCartographicMapCanvas,
  MapFeatureExportData,
  Orientation,
  BaseMapType,
} from "@/lib/export/pdfExporter";
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
  const [title, setTitle] = useState(projectTitle || "PETA HASIL DIGITASI SPASIAL");
  const [subtitle, setSubtitle] = useState("GeoVertex SaaS — Collaborative GIS Platform");
  const [author, setAuthor] = useState("Drafter Pemetaan");
  const [organization, setOrganization] = useState("Surveyor Team");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [baseMap, setBaseMap] = useState<BaseMapType>("global");
  const [showGrid, setShowGrid] = useState(true);
  const [showEdgeDistances, setShowEdgeDistances] = useState(true);
  const [targetFeatureId, setTargetFeatureId] = useState<string | "all">(selectedPdfFeatureId || "all");

  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Sync target feature & auto-update title to parcel name when modal opens or selected feature changes
  useEffect(() => {
    if (!isOpen) return;

    const currentTarget = selectedPdfFeatureId || "all";
    setTargetFeatureId(currentTarget);

    if (currentTarget !== "all") {
      const targetFeat = features.find((f) => f.id === currentTarget);
      if (targetFeat && targetFeat.name) {
        const cleanName = targetFeat.name.trim().toUpperCase();
        const autoTitle = cleanName.startsWith("PETA") ? cleanName : `PETA ${cleanName}`;
        setTitle(autoTitle);
      }
    } else {
      const projClean = (projectTitle || "").trim().toUpperCase();
      setTitle(projClean ? (projClean.startsWith("PETA") ? projClean : `PETA ${projClean}`) : "PETA HASIL DIGITASI SPASIAL");
    }
  }, [isOpen, selectedPdfFeatureId, projectTitle, features]);

  const handleTargetFeatureChange = (val: string) => {
    setTargetFeatureId(val);
    onSelectPdfFeature?.(val === "all" ? null : val);

    if (val !== "all") {
      const targetFeat = features.find((f) => f.id === val);
      if (targetFeat && targetFeat.name) {
        const cleanName = targetFeat.name.trim().toUpperCase();
        const autoTitle = cleanName.startsWith("PETA") ? cleanName : `PETA ${cleanName}`;
        setTitle(autoTitle);
      }
    } else {
      const projClean = (projectTitle || "").trim().toUpperCase();
      setTitle(projClean ? (projClean.startsWith("PETA") ? projClean : `PETA ${projClean}`) : "PETA HASIL DIGITASI SPASIAL");
    }
  };

  // Re-render live canvas preview whenever PDF export options change
  useEffect(() => {
    if (!isOpen || activeTab !== "pdf") return;

    let isMounted = true;
    const updatePreview = async () => {
      try {
        setIsPreviewLoading(true);
        const canvas = await renderCartographicMapCanvas(features, {
          title,
          subtitle,
          author,
          organization,
          orientation,
          baseMap,
          showGrid,
          showEdgeDistances,
          isProTier,
          selectedFeatureId: targetFeatureId === "all" ? null : targetFeatureId,
        });

        if (isMounted) {
          const dataUrl = canvas.toDataURL("image/png");
          setPreviewDataUrl(dataUrl);
        }
      } catch (err) {
        console.error("Error generating PDF preview canvas:", err);
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    };

    const timer = setTimeout(updatePreview, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    activeTab,
    title,
    subtitle,
    author,
    organization,
    orientation,
    baseMap,
    showGrid,
    showEdgeDistances,
    targetFeatureId,
    features,
    isProTier,
  ]);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportCartographicPDF(features, {
        title,
        subtitle,
        author,
        organization,
        orientation,
        baseMap,
        showGrid,
        showEdgeDistances,
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

  const baseMapOptions: { id: BaseMapType; name: string; desc: string; iconBg: string }[] = [
    {
      id: "global",
      name: "Global Map",
      desc: "Vektor Minimalis & Bersih",
      iconBg: "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200",
    },
    {
      id: "osm",
      name: "OpenStreetMap",
      desc: "Standard OpenStreetMap",
      iconBg: "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300",
    },
    {
      id: "esri",
      name: "Esri Satellite",
      desc: "Citra Satelit High-Res Esri",
      iconBg: "bg-blue-900 border-blue-700 text-blue-100",
    },
    {
      id: "google_satellite",
      name: "Google Satellite",
      desc: "Satelit Google Maps",
      iconBg: "bg-slate-900 border-slate-700 text-amber-300",
    },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={`bg-background border-border text-foreground shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col overflow-hidden ${
            activeTab === "pdf" ? "sm:max-w-5xl" : "sm:max-w-xl"
          }`}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Download className="w-5 h-5 text-emerald-500" />
              Ekspor Data &amp; Laporan Peta Kartografi
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Preview halaman pertama laporan peta kartografi PDF berskala atau unduh format data spasial digital.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pdf" | "data")} className="w-full flex-1 flex flex-col min-h-0 overflow-hidden mt-1">
            <TabsList className="grid grid-cols-2 w-full bg-muted shrink-0">
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Laporan PDF Kartografi
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                Data Spasial Digital
              </TabsTrigger>
            </TabsList>

            {/* TAB PDF LAPORAN KARTOGRAFI */}
            <TabsContent value="pdf" className="pt-3 flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 max-h-[calc(90vh-190px)] grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* LEFT COLUMN: FORM CONTROLS */}
                <div className="md:col-span-6 space-y-3.5 text-xs pr-1">
                  {/* Target Parcel Selector */}
                  <div>
                    <label className="block font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Target Bidang / Feature PDF
                    </label>
                    <select
                      value={targetFeatureId}
                      onChange={(e) => handleTargetFeatureChange(e.target.value)}
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

                  {/* Base Map Switcher */}
                  <div>
                    <label className="block font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-500" /> Base Map Peta PDF
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {baseMapOptions.map((bm) => (
                        <button
                          key={bm.id}
                          type="button"
                          onClick={() => setBaseMap(bm.id)}
                          className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                            baseMap === bm.id
                              ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 font-semibold"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-foreground">{bm.name}</p>
                            <p className="text-[10px] text-muted-foreground">{bm.desc}</p>
                          </div>
                          {baseMap === bm.id && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-2">
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">Judul Utama Kop Peta</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Misal: PETA KADASTRAL BIDANG LAHAN BLOK A"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">Sub-Judul / Catatan Laporan</label>
                      <Input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Misal: SURAT UKUR KADASTRAL DESA SUKAMAJU"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Author & Organization */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">Nama Drafter / Author</label>
                      <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="text-xs" />
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">Organisasi / Tim</label>
                      <Input value={organization} onChange={(e) => setOrganization(e.target.value)} className="text-xs" />
                    </div>
                  </div>

                  {/* Orientation */}
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Orientasi Kertas (A4)</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={orientation === "portrait" ? "default" : "outline"}
                        className="flex-1 text-xs h-8"
                        onClick={() => setOrientation("portrait")}
                      >
                        A4 Portrait
                      </Button>
                      <Button
                        type="button"
                        variant={orientation === "landscape" ? "default" : "outline"}
                        className="flex-1 text-xs h-8"
                        onClick={() => setOrientation("landscape")}
                      >
                        A4 Landscape
                      </Button>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted/40 text-xs">
                      <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <Grid className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Garis Grid UTM</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-muted/40 text-xs">
                      <input
                        type="checkbox"
                        checked={showEdgeDistances}
                        onChange={(e) => setShowEdgeDistances(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Panjang Sisi Segmen</span>
                    </label>
                  </div>
                </div>

                {/* RIGHT COLUMN: LIVE PAGE 1 PREVIEW CANVAS */}
                <div className="md:col-span-6 flex flex-col items-center justify-start bg-muted/40 border border-border rounded-xl p-3 relative">
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-500" /> Preview Halaman 1 (Map &amp; Kop)
                    </span>
                    {previewDataUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsFullscreenPreview(true)}
                      >
                        <Maximize2 className="w-3 h-3 mr-1" /> Zoom Full
                      </Button>
                    )}
                  </div>

                  {/* Preview Container Box */}
                  <div className="w-full aspect-[1/1.3] max-h-[40vh] relative bg-slate-950 rounded-lg overflow-hidden border border-border flex items-center justify-center group shadow-inner">
                    {isPreviewLoading && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                        <span className="text-xs font-semibold text-muted-foreground">Generasi Live Preview...</span>
                      </div>
                    )}

                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt="PDF Page 1 Cartographic Preview"
                        className="w-full h-full object-contain cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
                        onClick={() => setIsFullscreenPreview(true)}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                        <span className="text-xs text-muted-foreground">Memuat preview kartografi...</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Halaman 1 memuat Peta Kartografi &amp; Kop Laporan. Halaman 2 memuat Tabel Koordinat Kadastral.
                  </p>
                </div>
              </div>

              <DialogFooter className="shrink-0 mt-3 border-t border-border pt-3">
                <Button variant="outline" onClick={onClose} disabled={isExporting}>
                  Batal
                </Button>
                <Button
                  onClick={handleExportPDF}
                  disabled={isExporting || isPreviewLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Proses Ekspor PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Unduh Laporan PDF Kartografi
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* TAB DATA SPASIAL DIGITAL */}
            <TabsContent value="data" className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Unduh berkas spasial digital untuk digunakan di QGIS, ArcGIS, Google Earth, atau Excel:
              </p>

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
                  <span className="text-[11px] text-muted-foreground font-normal">Standar GIS &amp; Web Map</span>
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
                  <span className="text-[11px] text-muted-foreground font-normal">Perangkat GPS Garmin &amp; Lapangan</span>
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
                  <span className="text-[11px] text-muted-foreground font-normal">Google Earth &amp; Mobile Apps</span>
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
                  <span className="text-[11px] text-muted-foreground font-normal">Tabel Koordinat X/Y &amp; Lat/Lng</span>
                </Button>
              </div>

              <DialogFooter className="mt-5 border-t border-border pt-3">
                <Button variant="outline" onClick={onClose}>
                  Tutup
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* FULLSCREEN PREVIEW MODAL OVERLAY */}
      {isFullscreenPreview && previewDataUrl && (
        <Dialog open={isFullscreenPreview} onOpenChange={setIsFullscreenPreview}>
          <DialogContent className="max-w-[92vw] max-h-[92vh] bg-slate-950/95 border-slate-800 text-white p-4 flex flex-col items-center justify-center">
            <DialogHeader className="w-full flex flex-row items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <DialogTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" /> Preview Halaman 1 PDF Kartografi (Ukuran Penuh)
              </DialogTitle>
            </DialogHeader>

            <div className="w-full h-[78vh] overflow-auto flex items-center justify-center p-2">
              <img
                src={previewDataUrl}
                alt="Full Preview PDF Page 1"
                className="max-h-full max-w-full object-contain rounded shadow-2xl border border-slate-800"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
