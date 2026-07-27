import { useMemo } from "react";
import { FeatureCollection } from "geojson";
import { MapFeatureExportData } from "@/lib/export/pdfExporter";
import { GisFeatureProperties } from "../types/project.types";
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength } from "@/lib/gis";
import { useProjectStore } from "../store/useProjectStore";

export function useGeoJsonSync() {
  const mapFeatures = useProjectStore((state) => state.mapFeatures);
  const setMapFeatures = useProjectStore((state) => state.setMapFeatures);
  const markDirty = useProjectStore((state) => state.markDirty);

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

  const handleUpdateGeoJSON = (data: FeatureCollection) => {
    markDirty();
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

        const finalLatLngs = latLngs.length > 0 ? latLngs : (existing?.latLngs || []);

        let areaSqm: number | undefined = undefined;
        let perimeterMeters: number | undefined = undefined;

        if (type === "Polygon" && finalLatLngs.length >= 3) {
          areaSqm = calculatePolygonArea(finalLatLngs);
          perimeterMeters = calculatePolygonPerimeter(finalLatLngs);
        } else if (type === "LineString" && finalLatLngs.length >= 2) {
          perimeterMeters = calculateLineLength(finalLatLngs);
        }

        return {
          id: assignedId,
          type: type === "Polygon" ? "Polygon" : type === "LineString" ? "Polyline" : "Marker",
          name: props.name || existing?.name || `Geometri ${idx + 1}`,
          latLngs: finalLatLngs,
          areaSqm: areaSqm ?? existing?.areaSqm,
          perimeterMeters: perimeterMeters ?? existing?.perimeterMeters,
          color: props.color || existing?.color || "#2563EB",
          properties: {
            ...existing?.properties,
            ...props,
            areaSqm: areaSqm ?? existing?.areaSqm ?? null,
            perimeterMeters: perimeterMeters ?? existing?.perimeterMeters ?? null,
            latLngs: finalLatLngs.map(([lat, lng]) => ({ lat, lng })),
          },
        };
      });

    setMapFeatures(converted);
  };

  return {
    geoJsonData,
    handleUpdateGeoJSON,
  };
}
