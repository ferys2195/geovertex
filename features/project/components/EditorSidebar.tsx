"use client";

import React, { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { GisFeatureProperties } from "@/lib/types";

import { EditorSidebarProps } from "../types/sidebar.types";
import { useFeatureEdit } from "../hooks/useFeatureEdit";

import { SidebarHeader } from "./Sidebar/SidebarHeader";
import { SidebarSearch } from "./Sidebar/SidebarSearch";
import { SidebarFilterTabs, FeatureFilterType } from "./Sidebar/SidebarFilterTabs";
import { SidebarEmptyState } from "./Sidebar/SidebarEmptyState";
import { SidebarFeatureItem } from "./Sidebar/SidebarFeatureItem";
import { SidebarFooter } from "./Sidebar/SidebarFooter";
import { SidebarNavRail } from "./Sidebar/SidebarNavRail";
import { DraftsPanel } from "./Sidebar/DraftsPanel";
import { SettingsPanel } from "./Sidebar/SettingsPanel";
import { useProjectStore } from "../store/useProjectStore";

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
  isReadOnly = false,
}: EditorSidebarProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<FeatureFilterType>("ALL");

  const activeTab = useProjectStore((state) => state.activeTab);
  const setActiveTab = useProjectStore((state) => state.setActiveTab);
  const toggleSidebar = useProjectStore((state) => state.toggleSidebar);

  const mapFeatures = useProjectStore((state) => state.mapFeatures);
  const tempFeatures = useMemo(
    () => mapFeatures.filter((f) => f.isTemporary),
    [mapFeatures]
  );

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

  // Filter features based on tab filter and search query (excluding temporary features from main DB list)
  const dbFeaturesCount = useMemo(
    () => geoJsonData.features.filter((f) => !(f.properties as any)?.isTemporary).length,
    [geoJsonData.features]
  );

  const filteredFeatures = useMemo(() => {
    let list = geoJsonData.features.filter((f) => !(f.properties as any)?.isTemporary);

    // 1. Filter by geometry type tab
    if (activeFilter !== "ALL") {
      list = list.filter((feat) => {
        const type = feat.geometry?.type;
        if (activeFilter === "Polygon") {
          return type === "Polygon" || type === "MultiPolygon";
        }
        if (activeFilter === "LineString") {
          return type === "LineString" || type === "MultiLineString";
        }
        if (activeFilter === "Point") {
          return type === "Point" || type === "MultiPoint";
        }
        return true;
      });
    }

    // 2. Filter by search query
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();

    return list.filter((feat, idx) => {
      const props = (feat.properties || {}) as GisFeatureProperties;
      const name = (props.name || `Geometri ${idx + 1}`).toLowerCase();
      const desc = (props.description || "").toLowerCase();
      const geomType = (feat.geometry?.type || "").toLowerCase();

      if (name.includes(q) || desc.includes(q) || geomType.includes(q)) return true;

      return Object.entries(props).some(
        ([k, v]) => k.toLowerCase().includes(q) || String(v ?? "").toLowerCase().includes(q)
      );
    });
  }, [geoJsonData.features, activeFilter, searchQuery]);

  return (
    <aside className="w-96 h-full bg-slate-900 border-r border-slate-800 text-foreground flex flex-row shrink-0 z-20 shadow-xl overflow-hidden">
      {/* 1. Left Vertical Icon Navigation Rail */}
      <SidebarNavRail
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tempCount={tempFeatures.length}
        layersCount={dbFeaturesCount}
        onToggleSidebar={toggleSidebar}
      />

      {/* 2. Dynamic Content Panel (Daftar Bidang / Drafts / Settings) */}
      <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
        {activeTab === "layers" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <SidebarHeader filteredCount={filteredFeatures.length} totalCount={dbFeaturesCount} />

            <SidebarSearch
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onClearSearch={() => setSearchQuery("")}
            />

            <SidebarFilterTabs
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              features={geoJsonData.features.filter((f) => !(f.properties as any)?.isTemporary)}
            />

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="space-y-2">
                {dbFeaturesCount === 0 || filteredFeatures.length === 0 ? (
                  <SidebarEmptyState
                    totalFeaturesCount={dbFeaturesCount}
                    searchQuery={searchQuery}
                    onResetSearch={() => {
                      setSearchQuery("");
                      setActiveFilter("ALL");
                    }}
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
                          isReadOnly={isReadOnly}
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
          </div>
        )}

        {activeTab === "drafts" && (
          <DraftsPanel
            tempFeatures={tempFeatures}
            onZoomToFeature={onZoomToFeature}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPanel coordinateMode={coordinateMode} />
        )}
      </div>
    </aside>
  );
}

export default EditorSidebar;
