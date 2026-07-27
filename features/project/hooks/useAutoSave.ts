import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjectStore } from "../store/useProjectStore";
import type { MapFeatureExportData } from "../types/project.types";

export function useAutoSave() {
  const projectId = useProjectStore((state) => state.projectId);
  const project = useProjectStore((state) => state.project);
  const mapFeatures = useProjectStore((state) => state.mapFeatures);
  const deletedFeatureIds = useProjectStore((state) => state.deletedFeatureIds);
  const loading = useProjectStore((state) => state.loading);
  const isAutoSaveEnabled = useProjectStore((state) => state.isAutoSaveEnabled);
  const isDirty = useProjectStore((state) => state.isDirty);
  const setSaveStatus = useProjectStore((state) => state.setSaveStatus);
  const setMapFeatures = useProjectStore((state) => state.setMapFeatures);
  const clearDeletedFeatureIds = useProjectStore((state) => state.clearDeletedFeatureIds);
  const clearDirty = useProjectStore((state) => state.clearDirty);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveFeaturesToCloud = useCallback(
    async (featuresToSave: MapFeatureExportData[], idsToDelete: string[]) => {
      if (!project || !projectId || projectId.startsWith("demo-proj") || loading) {
        clearDirty();
        return;
      }

      try {
        setSaveStatus("saving");
        const supabase = createClient();

        // 1. Delete removed features
        const uniqueIdsToDelete = [...new Set(idsToDelete)];
        if (uniqueIdsToDelete.length > 0) {
          await supabase.from("map_features").delete().in("id", uniqueIdsToDelete);
          clearDeletedFeatureIds();
        }

        // 2. Upsert existing features
        if (featuresToSave.length > 0) {
          const payload = featuresToSave.map((f) => {
            let geometryObj: unknown;
            if (f.type === "Polygon" || f.type === "Rectangle") {
              const coords = f.latLngs.map(([lat, lng]) => [lng, lat]);
              if (
                coords.length > 0 &&
                (coords[0][0] !== coords[coords.length - 1][0] ||
                  coords[0][1] !== coords[coords.length - 1][1])
              ) {
                coords.push(coords[0]);
              }
              geometryObj = { type: "Polygon", coordinates: [coords] };
            } else if (f.type === "Polyline") {
              geometryObj = {
                type: "LineString",
                coordinates: f.latLngs.map(([lat, lng]) => [lng, lat]),
              };
            } else {
              const pt = f.latLngs[0] || [0, 0];
              geometryObj = { type: "Point", coordinates: [pt[1], pt[0]] };
            }

            const isUuid =
              f.id &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                f.id
              );
            const validId = isUuid
              ? f.id
              : typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : undefined;

            return {
              id: validId,
              project_id: projectId,
              layer_name: f.name,
              feature_type: f.type,
              geometry: geometryObj,
              properties: {
                ...(f.properties || {}),
                areaSqm: f.areaSqm ?? null,
                perimeterMeters: f.perimeterMeters ?? null,
                latLngs: f.latLngs.map(([lat, lng]) => ({ lat, lng })),
                geojson: geometryObj,
              },
            };
          });

          const { data: upsertedData, error: upsertError } = await supabase
            .from("map_features")
            .upsert(payload, { onConflict: "id" })
            .select("id, properties");

          if (upsertError) {
            console.error("❌ [Cloud Auto-Save Error] Gagal upsert ke Supabase:", upsertError);
            setSaveStatus("unsaved");
            return;
          }

          if (upsertedData && upsertedData.length > 0) {
            setMapFeatures(
              mapFeatures.map((f, idx) => {
                const returnedItem = upsertedData[idx];
                if (
                  returnedItem?.id &&
                  (!f.id || f.id.startsWith("f-") || f.id.startsWith("pt-"))
                ) {
                  return { ...f, id: returnedItem.id };
                }
                return f;
              })
            );
          }
        }

        clearDirty();
      } catch (err) {
        console.error("Cloud Auto-Save error:", err);
        setSaveStatus("unsaved");
      }
    },
    [
      project,
      projectId,
      loading,
      setSaveStatus,
      clearDeletedFeatureIds,
      clearDirty,
      mapFeatures,
      setMapFeatures,
    ]
  );

  useEffect(() => {
    // Only auto-save if auto-save setting is enabled AND there are unsaved changes (isDirty === true)
    if (!isAutoSaveEnabled || !isDirty || loading) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveFeaturesToCloud(mapFeatures, deletedFeatureIds);
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [mapFeatures, deletedFeatureIds, loading, isAutoSaveEnabled, isDirty, saveFeaturesToCloud]);
}
