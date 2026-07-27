import { useState } from "react";
import { FeatureCollection } from "geojson";
import { GisFeatureProperties } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";

interface UseFeatureEditOptions {
  geoJsonData: FeatureCollection;
  onUpdateFeatureProperties: (featureId: string, properties: GisFeatureProperties) => void;
}

export function useFeatureEdit({ geoJsonData, onUpdateFeatureProperties }: UseFeatureEditOptions) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [editColor, setEditColor] = useState<string>("#3b82f6");
  const [editCustomProps, setEditCustomProps] = useState<Record<string, string>>({});

  const handleStartEditFeature = (feature: unknown) => {
    const feat = feature as { properties?: GisFeatureProperties };
    const props = (feat.properties || {}) as GisFeatureProperties;
    const featureId = props.id || `f-${geoJsonData.features.indexOf(feature as any)}`;
    setEditingId(featureId);
    setEditName(props.name || "");
    setEditDesc(props.description || "");
    setEditColor(props.color || "#3b82f6");

    const custom: Record<string, string> = {};
    Object.entries(props).forEach(([k, v]) => {
      if (!["id", "name", "description", "color", "areaSqm", "perimeterMeters"].includes(k)) {
        custom[k] = String(v ?? "");
      }
    });
    setEditCustomProps(custom);
  };

  const handleSaveFeature = (featureId: string) => {
    onUpdateFeatureProperties(featureId, {
      id: featureId,
      name: editName,
      description: editDesc,
      color: editColor,
      ...editCustomProps,
    });
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleAddCustomProp = () => {
    const key = `prop_${Object.keys(editCustomProps).length + 1}`;
    setEditCustomProps({ ...editCustomProps, [key]: "" });
  };

  const handleRemoveCustomProp = (key: string) => {
    const updated = { ...editCustomProps };
    delete updated[key];
    setEditCustomProps(updated);
  };

  const handleCustomPropChange = (key: string, val: string) => {
    setEditCustomProps({ ...editCustomProps, [key]: val });
  };

  const handleRenameCustomPropKey = (oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    const updated: Record<string, string> = {};
    Object.entries(editCustomProps).forEach(([k, v]) => {
      if (k === oldKey) updated[newKey] = v;
      else updated[k] = v;
    });
    setEditCustomProps(updated);
  };

  const handleApplyTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const tmpl = TEMPLATES[templateKey];
    if (!tmpl) return;
    const merged = { ...editCustomProps, ...tmpl.data };
    setEditCustomProps(merged);
  };

  return {
    editingId,
    editName,
    setEditName,
    editDesc,
    setEditDesc,
    editColor,
    setEditColor,
    editCustomProps,
    handleStartEditFeature,
    handleSaveFeature,
    cancelEditing,
    handleAddCustomProp,
    handleRemoveCustomProp,
    handleCustomPropChange,
    handleRenameCustomPropKey,
    handleApplyTemplate,
  };
}
