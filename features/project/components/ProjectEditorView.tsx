"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { ExportModal } from "./modals/ExportModal";
import { ShareModal } from "./modals/ShareModal";
import { EditAttributesModal } from "./modals/EditAttributesModal";
import { Loader2 } from "lucide-react";
import { EditorSidebar } from "./EditorSidebar";
import { GisFeatureProperties, UserRole } from "../types/project.types";
import { useProjectStore } from "../store/useProjectStore";
import { useProjectInit } from "../hooks/useProjectInit";
import { useAutoSave } from "../hooks/useAutoSave";
import { useGeoJsonSync } from "../hooks/useGeoJsonSync";
import { EditorHeader } from "./EditorHeader/EditorHeader";
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

  const { geoJsonData, handleUpdateGeoJSON } = useGeoJsonSync();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

  const project = useProjectStore((state) => state.project);
  const currentRole = useProjectStore((state) => state.currentRole);
  const members = useProjectStore((state) => state.members);
  const mapFeatures = useProjectStore((state) => state.mapFeatures);
  const loading = useProjectStore((state) => state.loading);
  const saveStatus = useProjectStore((state) => state.saveStatus);
  const isAutoSaveEnabled = useProjectStore((state) => state.isAutoSaveEnabled);
  const toggleAutoSave = useProjectStore((state) => state.toggleAutoSave);
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
  const setProjectData = useProjectStore((state) => state.setProjectData);

  const supabase = createClient();

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
      {/* Top Navbar Header */}
      <EditorHeader
        projectTitle={project?.title}
        currentRole={currentRole}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
        saveStatus={saveStatus}
        onOpenShareModal={() => setIsShareOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
      />

      {/* Main Content Body: Sidebar + Map Canvas Container */}
      <div className="flex-1 relative overflow-hidden flex flex-row">
        {/* Sidebar Panel with Smooth Slide Animation */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <>
              {/* Backdrop overlay for mobile screen */}
              <motion.div
                key="sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-xs"
                onClick={toggleSidebar}
              />

              {/* Sidebar panel with smooth sliding transition */}
              <motion.div
                key="sidebar-panel"
                initial={{ x: "-100%", opacity: 0.3 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  mass: 0.7,
                }}
                className="absolute md:relative left-0 top-0 bottom-0 z-40 h-full shrink-0 shadow-2xl"
              >
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
              </motion.div>
            </>
          )}
        </AnimatePresence>

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

export default ProjectEditorView;
