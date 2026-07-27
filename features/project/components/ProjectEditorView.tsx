"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ExportModal } from "./modals/ExportModal";
import { ShareModal } from "./modals/ShareModal";
import { EditAttributesModal } from "./modals/EditAttributesModal";
import { MapFeatureExportData } from "@/lib/export/pdfExporter";
import { Button } from "@/components/ui/button";
import { Share2, Download, Cloud, CloudOff, Loader2, ArrowLeft, PanelLeft } from "lucide-react";
import Link from "next/link";
import { EditorSidebar } from "./EditorSidebar";
import { FeatureCollection } from "geojson";
import { GisFeatureProperties, UserRole } from "../types/project.types";
import { useProjectStore } from "../store/useProjectStore";
import { useProjectInit } from "../hooks/useProjectInit";
import { useAutoSave } from "../hooks/useAutoSave";
import { createClient } from "@/lib/supabase/client";

const DynamicMapCanvas = dynamic(() => import("./MapCanvas").then((mod) => mod.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
      Memuat Editor Peta Cloud...
    </div>
  ),
});

interface ProjectEditorViewProps {
  projectId: string;
}

export function ProjectEditorView({ projectId }: ProjectEditorViewProps) {
  useProjectInit(projectId);
  useAutoSave();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

  const project = useProjectStore((state) => state.project);
  const currentRole = useProjectStore((state) => state.currentRole);
  const members = useProjectStore((state) => state.members);
  const mapFeatures = useProjectStore((state) => state.mapFeatures);
  const loading = useProjectStore((state) => state.loading);
  const saveStatus = useProjectStore((state) => state.saveStatus);
  const isSidebarOpen = useProjectStore((state) => state.isSidebarOpen);
  const toggleSidebar = useProjectStore((state) => state.toggleSidebar);
  const coordinateMode = useProjectStore((state) => state.coordinateMode);
  const setCoordinateMode = useProjectStore((state) => state.setCoordinateMode);
  const zoomToTrigger = useProjectStore((state) => state.zoomToTrigger);
  const setZoomToTrigger = useProjectStore((state) => state.setZoomToTrigger);
  const isExportOpen = useProjectStore((state) => state.isExportOpen);
  const setIsExportOpen = useProjectStore((state) => state.setIsExportOpen);
  const isShareOpen = useProjectStore((state) => state.isShareOpen);
  const setIsShareOpen = useProjectStore((state) => state.setIsShareOpen);
  const selectedPdfFeatureId = useProjectStore((state) => state.selectedPdfFeatureId);
  const setSelectedPdfFeatureId = useProjectStore((state) => state.setSelectedPdfFeatureId);
  const deleteMapFeature = useProjectStore((state) => state.deleteMapFeature);
  const updateMapFeature = useProjectStore((state) => state.updateMapFeature);
  const addMapFeature = useProjectStore((state) => state.addMapFeature);
  const setMapFeatures = useProjectStore((state) => state.setMapFeatures);
  const setProjectData = useProjectStore((state) => state.setProjectData);

  const supabase = createClient();

  const geoJsonData: FeatureCollection = useMemo(() => ({
    type: "FeatureCollection",
    features: mapFeatures.map((f) => {
      let geometry: unknown;
      const typeLower = (f.type || "").toString().toLowerCase();

      if (typeLower.includes("polygon") || typeLower.includes("rect")) {
        const coords = f.latLngs.map(([lat, lng]) => [lng, lat]);
        if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push(coords[0]);
        }
        geometry = { type: "Polygon", coordinates: [coords] };
      } else if (typeLower.includes("line") || typeLower.includes("path") || typeLower.includes("string")) {
        geometry = { type: "LineString", coordinates: f.latLngs.map(([lat, lng]) => [lng, lat]) };
      } else {
        const pt = f.latLngs[0] || [0, 0];
        geometry = { type: "Point", coordinates: [pt[1], pt[0]] };
      }

      return {
        type: "Feature",
        geometry: geometry as any,
        properties: {
          id: f.id,
          name: f.name,
          description: f.properties?.description || "",
          color: f.color || "#2563EB",
          ...f.properties,
        },
      };
    }),
  }), [mapFeatures]);

  const handleZoomToFeature = (featureId: string) => {
    setZoomToTrigger({ id: featureId, time: Date.now() });
  };

  const handleDeleteFeature = (featureId: string) => {
    deleteMapFeature(featureId);
  };

  const handleUpdateFeatureProperties = (featureId: string, properties: GisFeatureProperties) => {
    updateMapFeature(featureId, {
      name: properties.name,
      color: properties.color,
      properties: properties as Record<string, unknown>,
    });
  };

  const handleAddPoint = (lat: number, lng: number, name: string, description: string, color?: string) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pt-${Date.now()}`;
    addMapFeature({
      id,
      type: "Marker",
      name: name || "Point Marker Baru",
      latLngs: [[lat, lng]],
      color: color || "#DC2626",
      properties: { id, name, description },
    });
  };

  const handleUpdateGeoJSON = (data: FeatureCollection) => {
    const converted: MapFeatureExportData[] = data.features
      .filter((feat) => feat && feat.geometry)
      .map((feat, idx) => {
        const props = (feat.properties || {}) as GisFeatureProperties;
        const type = feat.geometry.type;

        let latLngs: [number, number][] = [];
        if (type === "Polygon") {
          const coords = (feat.geometry as unknown as { coordinates: number[][][] }).coordinates[0] || [];
          latLngs = coords.map(([lng, lat]) => [Number(lat), Number(lng)]);
        } else if (type === "LineString") {
          const coords = (feat.geometry as unknown as { coordinates: number[][] }).coordinates || [];
          latLngs = coords.map(([lng, lat]) => [Number(lat), Number(lng)]);
        } else if (type === "Point") {
          const pt = (feat.geometry as unknown as { coordinates: number[] }).coordinates || [0, 0];
          latLngs = [[Number(pt[1]), Number(pt[0])]];
        }

        const existing = mapFeatures.find((f) => f.id === props.id);
        const assignedId = (props.id && props.id !== "undefined")
          ? props.id
          : existing?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `f-${idx}-${Date.now()}`);

        return {
          id: assignedId,
          type: type === "Polygon" ? "Polygon" : type === "LineString" ? "Polyline" : "Marker",
          name: props.name || existing?.name || `Geometri ${idx + 1}`,
          latLngs: latLngs.length > 0 ? latLngs : (existing?.latLngs || []),
          color: props.color || existing?.color || "#2563EB",
          properties: { ...existing?.properties, ...props },
        };
      });

    setMapFeatures(converted);
  };

  const handleInviteMember = async (email: string, role: UserRole): Promise<boolean> => {
    if (projectId.startsWith("demo-proj")) {
      setProjectData(project, currentRole, [...members, { id: `mem-${Date.now()}`, email, full_name: email, role }]);
      return true;
    }

    try {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (!targetProfile) return false;

      const { error } = await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: targetProfile.id,
        role,
      });

      if (error) return false;
      return true;
    } catch (err) {
      console.error("Invite error:", err);
      return false;
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (projectId.startsWith("demo-proj")) {
      setProjectData(project, currentRole, members.filter((m) => m.id !== memberId));
      return;
    }

    try {
      await supabase.from("project_members").delete().eq("id", memberId);
      setProjectData(project, currentRole, members.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error("Remove member error:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-300 text-sm">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
        Memuat Proyek Pemetaan Spasial...
      </div>
    );
  }

  const isReadOnly = currentRole === "viewer";
  const targetEditingFeature = mapFeatures.find((f) => f.id === editingFeatureId) || null;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 font-sans">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors" title="Kembali ke Dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-slate-800" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`h-8 w-8 text-slate-300 hover:text-white ${isSidebarOpen ? "bg-slate-800 text-blue-400" : ""}`}
            title="Buka/Tutup Sidebar Panel"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm text-white">{project?.title || "Proyek Pemetaan"}</h1>
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

        {/* Status Cloud & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Menyimpan ke Cloud...</span>
              </>
            ) : saveStatus === "synced" ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersimpan di Cloud</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">Belum Tersimpan</span>
              </>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsShareOpen(true)}
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs h-8"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Kolaborasi Tim
          </Button>

          <Button
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Ekspor PDF &amp; Data
          </Button>
        </div>
      </header>

      {/* Main Content Body: Sidebar + Map Canvas Container */}
      <div className="flex-1 relative overflow-hidden flex flex-row">
        {/* Sidebar Panel */}
        {isSidebarOpen && (
          <EditorSidebar
            geoJsonData={geoJsonData}
            onUpdateGeoJSON={handleUpdateGeoJSON}
            coordinateMode={coordinateMode}
            onZoomToFeature={handleZoomToFeature}
            onDeleteFeature={handleDeleteFeature}
            onUpdateFeatureProperties={handleUpdateFeatureProperties}
            onAddPoint={handleAddPoint}
            selectedPdfFeatureId={selectedPdfFeatureId}
            onSelectPdfFeature={setSelectedPdfFeatureId}
            onOpenExportModal={() => setIsExportOpen(true)}
            onEditFeature={(featureId) => {
              setEditingFeatureId(featureId);
              setIsEditModalOpen(true);
            }}
          />
        )}

        {/* Map Canvas */}
        <div className="flex-1 relative overflow-hidden h-full">
          <DynamicMapCanvas
            geoJsonData={geoJsonData}
            onGeoJsonChange={handleUpdateGeoJSON}
            coordinateMode={coordinateMode}
            onCoordinateModeChange={setCoordinateMode}
            zoomToTrigger={zoomToTrigger}
            selectedPdfFeatureId={selectedPdfFeatureId}
            onSelectPdfFeature={setSelectedPdfFeatureId}
            onOpenExportModal={() => setIsExportOpen(true)}
            onDeleteFeature={handleDeleteFeature}
            onEditFeature={(featureId) => {
              setEditingFeatureId(featureId);
              setIsEditModalOpen(true);
            }}
            readOnly={isReadOnly}
          />
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectTitle={project?.title || "GeoVertex_Map"}
        features={mapFeatures}
        selectedPdfFeatureId={selectedPdfFeatureId}
        onSelectPdfFeature={setSelectedPdfFeatureId}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectTitle={project?.title || "GeoVertex Project"}
        members={members}
        currentRole={currentRole}
        onInviteMember={handleInviteMember}
        onRemoveMember={handleRemoveMember}
      />

      <EditAttributesModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        feature={targetEditingFeature}
        onSave={(featureId, props) => {
          handleUpdateFeatureProperties(featureId, props);
        }}
      />
    </div>
  );
}
