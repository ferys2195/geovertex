"use client";

import React, { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { GisFeatureProperties } from "@/lib/types";

import { EditorSidebarProps } from "../types/sidebar.types";
import { useFeatureEdit } from "../hooks/useFeatureEdit";

import { SidebarHeader } from "./Sidebar/SidebarHeader";
import { SidebarSearch } from "./Sidebar/SidebarSearch";
import { SidebarEmptyState } from "./Sidebar/SidebarEmptyState";
import { SidebarFeatureItem } from "./Sidebar/SidebarFeatureItem";
import { SidebarFooter } from "./Sidebar/SidebarFooter";

export function EditorSidebar({
  geoJsonData,
  coordinateMode,
  onZoomToFeature,
  onDeleteFeature,
  onUpdateFeatureProperties,
  selectedPdfFeatureId = null,
  onSelectPdfFeature = () => {},
  onOpenExportModal,
  onEditFeature,
}: EditorSidebarProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const {
    editingId,
    editName,
    setEditName,
    editDesc,
    setEditDesc,
    editColor,
    setEditColor,
    editCustomProps,
    handleSaveFeature,
    cancelEditing,
    handleAddCustomProp,
    handleRemoveCustomProp,
    handleCustomPropChange,
    handleRenameCustomPropKey,
    handleApplyTemplate,
  } = useFeatureEdit({ geoJsonData, onUpdateFeatureProperties });

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return geoJsonData.features;
    const q = searchQuery.toLowerCase().trim();

    return geoJsonData.features.filter((feat, idx) => {
      const props = (feat.properties || {}) as GisFeatureProperties;
      const name = (props.name || `Geometri ${idx + 1}`).toLowerCase();
      const desc = (props.description || "").toLowerCase();
      const geomType = (feat.geometry?.type || "").toLowerCase();

      if (name.includes(q) || desc.includes(q) || geomType.includes(q)) return true;

      return Object.entries(props).some(
        ([k, v]) => k.toLowerCase().includes(q) || String(v ?? "").toLowerCase().includes(q)
      );
    });
  }, [geoJsonData.features, searchQuery]);

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 text-foreground flex flex-col h-full shrink-0 z-20 shadow-xl">
      <SidebarHeader filteredCount={filteredFeatures.length} totalCount={geoJsonData.features.length} />

      <SidebarSearch
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onClearSearch={() => setSearchQuery("")}
      />

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="space-y-2">
          {geoJsonData.features.length === 0 || filteredFeatures.length === 0 ? (
            <SidebarEmptyState
              totalFeaturesCount={geoJsonData.features.length}
              searchQuery={searchQuery}
              onResetSearch={() => setSearchQuery("")}
            />
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {filteredFeatures.map((feature, idx) => (
                  <SidebarFeatureItem
                    key={(feature.properties as any)?.id || `f-${idx}`}
                    feature={feature}
                    idx={idx}
                    editingId={editingId}
                    coordinateMode={coordinateMode}
                    selectedPdfFeatureId={selectedPdfFeatureId}
                    onZoomToFeature={onZoomToFeature}
                    onDeleteFeature={onDeleteFeature}
                    onSelectPdfFeature={onSelectPdfFeature}
                    onOpenExportModal={onOpenExportModal}
                    onEditFeature={onEditFeature}
                    editName={editName}
                    setEditName={setEditName}
                    editDesc={editDesc}
                    setEditDesc={setEditDesc}
                    editColor={editColor}
                    setEditColor={setEditColor}
                    editCustomProps={editCustomProps}
                    onSaveFeature={handleSaveFeature}
                    onCancelEdit={cancelEditing}
                    onAddCustomProp={handleAddCustomProp}
                    onRemoveCustomProp={handleRemoveCustomProp}
                    onCustomPropChange={handleCustomPropChange}
                    onRenameCustomPropKey={handleRenameCustomPropKey}
                    onApplyTemplate={handleApplyTemplate}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <SidebarFooter />
    </aside>
  );
}

export default EditorSidebar;
