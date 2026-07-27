import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapFeatureRecord, UserRole } from "@/lib/supabase/types";
import { isDevModeAllowed } from "@/lib/utils";
import { useProjectStore } from "../store/useProjectStore";
import type { MapFeatureExportData, TeamMemberItem } from "../types/project.types";
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength } from "@/lib/gis";

export function useProjectInit(projectId: string) {
  const router = useRouter();
  const setProjectId = useProjectStore((state) => state.setProjectId);
  const setProjectData = useProjectStore((state) => state.setProjectData);
  const setMapFeatures = useProjectStore((state) => state.setMapFeatures);
  const setLoading = useProjectStore((state) => state.setLoading);

  const parseGeoJsonCoords = useCallback((featureRecord: MapFeatureRecord): [number, number][] => {
    let rawList: unknown[] = [];
    let hint: "geojson" | "latlngs" = "geojson";

    const geometry = featureRecord?.geometry;
    let geom: { type?: string; coordinates?: unknown } | null = null;

    if (geometry) {
      if (typeof geometry === "object" && (geometry as { coordinates?: unknown }).coordinates) {
        geom = geometry as { type?: string; coordinates?: unknown };
      } else if (typeof geometry === "string") {
        const cleanStr = geometry.trim();
        if (cleanStr.startsWith("{")) {
          try {
            geom = JSON.parse(cleanStr);
          } catch (e) {
            console.error("Error parsing GeoJSON geometry string:", e);
          }
        }
      }
    }

    if (geom?.coordinates) {
      hint = "geojson";
      const geomTypeUpper = (geom.type || "").toString().toUpperCase();
      const coords = geom.coordinates as unknown[];
      if (geomTypeUpper.includes("POLYGON")) {
        rawList = geomTypeUpper.includes("MULTI")
          ? ((coords[0] as unknown[][])?.[0] || [])
          : ((coords[0] as unknown[]) || []);
      } else if (geomTypeUpper.includes("LINE") || geomTypeUpper.includes("STRING")) {
        rawList = geomTypeUpper.includes("MULTI")
          ? ((coords[0] as unknown[]) || [])
          : coords;
      } else if (geomTypeUpper.includes("POINT")) {
        const pt = Array.isArray(coords[0]) ? coords[0] : coords;
        rawList = [pt];
      }
    }

    if (
      rawList.length === 0 &&
      Array.isArray(featureRecord?.properties?.latLngs) &&
      featureRecord.properties.latLngs.length > 0
    ) {
      rawList = featureRecord.properties.latLngs;
      hint = "latlngs";
    }

    const clean: [number, number][] = [];
    for (const item of rawList) {
      const pair = ensureLatLngPair(item, hint);
      if (pair) clean.push(pair);
    }

    return clean;
  }, []);

  const ensureLatLngPair = (
    pt: unknown,
    sourceHint: "geojson" | "latlngs"
  ): [number, number] | null => {
    if (pt && typeof pt === "object" && !Array.isArray(pt)) {
      const obj = pt as { lat?: number; latitude?: number; lng?: number; longitude?: number };
      const valLat = Number(obj.lat ?? obj.latitude);
      const valLng = Number(obj.lng ?? obj.longitude);
      if (!isNaN(valLat) && !isNaN(valLng)) {
        return [valLat, valLng];
      }
    }

    if (Array.isArray(pt) && pt.length >= 2) {
      const v0 = Number(pt[0]);
      const v1 = Number(pt[1]);
      if (isNaN(v0) || isNaN(v1)) return null;

      if (Math.abs(v0) > 90 && Math.abs(v1) <= 90) return [v1, v0];
      if (Math.abs(v1) > 90 && Math.abs(v0) <= 90) return [v0, v1];

      if (sourceHint === "geojson") {
        return [v1, v0];
      } else {
        return [v0, v1];
      }
    }

    return null;
  };

  const fetchProjectData = useCallback(async () => {
    const supabase = createClient();
    setProjectId(projectId);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user && !isDevModeAllowed()) {
        router.push("/login");
        return;
      }

      if (!session?.user || projectId.startsWith("demo-proj")) {
        // Fallback for demo mode
        setProjectData(
          {
            id: projectId,
            owner_id: "demo-user-1",
            title: "Proyek Pemetaan Lahan (Demo)",
            description: "Mode Uji Coba Lahan",
            center_lat: -2.5,
            center_lng: 118.0,
            zoom_level: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          "owner",
          [
            { id: "mem-1", email: "surveyor@geovertex.com", full_name: "Surveyor Utama", role: "owner" },
            { id: "mem-2", email: "drafter@geovertex.com", full_name: "Drafter Lahan", role: "editor" },
          ]
        );
        setLoading(false);
        return;
      }

      // Fetch Project from Supabase
      const { data: projData, error: projErr } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projErr || !projData) {
        console.error("Project not found:", projErr);
        setLoading(false);
        return;
      }

      // User Role Determination
      let currentRole: UserRole = "owner";
      if (projData.owner_id !== session.user.id) {
        const { data: memData } = await supabase
          .from("project_members")
          .select("role")
          .eq("project_id", projectId)
          .eq("user_id", session.user.id)
          .single();
        if (memData) currentRole = memData.role as UserRole;
      }

      // Team Members Fetching
      const { data: teamData } = await supabase
        .from("project_members")
        .select("*, profiles(*)")
        .eq("project_id", projectId);

      const mappedMembers: TeamMemberItem[] = (teamData || []).map((m: unknown) => {
        const memberRow = m as {
          id: string;
          role: UserRole;
          profiles?: { email?: string; full_name?: string; avatar_url?: string };
        };
        return {
          id: memberRow.id,
          email: memberRow.profiles?.email || "user@geovertex.com",
          full_name: memberRow.profiles?.full_name || memberRow.profiles?.email,
          role: memberRow.role,
          avatar_url: memberRow.profiles?.avatar_url,
        };
      });

      setProjectData(projData, currentRole, mappedMembers);

      // Map Features Fetching
      const { data: featData, error: featErr } = await supabase
        .from("map_features")
        .select("*")
        .eq("project_id", projectId);

      if (featErr) {
        console.error("❌ [Supabase Fetch Error] Gagal mengambil data map_features:", featErr);
      }

      if (featData) {
        const mappedFeats: MapFeatureExportData[] = featData
          .map((f: MapFeatureRecord) => {
            const parsedLatLngs = parseGeoJsonCoords(f);

            let areaSqm: number | undefined = f.properties?.areaSqm;
            let perimeterMeters: number | undefined = f.properties?.perimeterMeters;

            const featType = String(f.feature_type || "");
            if ((featType.includes("Polygon") || featType.includes("Rectangle")) && parsedLatLngs.length >= 3) {
              areaSqm = calculatePolygonArea(parsedLatLngs);
              perimeterMeters = calculatePolygonPerimeter(parsedLatLngs);
            } else if (featType.includes("Line") && parsedLatLngs.length >= 2) {
              perimeterMeters = calculateLineLength(parsedLatLngs);
            }

            return {
              id: f.id,
              type: f.feature_type as unknown as MapFeatureExportData["type"],
              name: f.layer_name || "Feature",
              latLngs: parsedLatLngs,
              properties: {
                ...f.properties,
                areaSqm,
                perimeterMeters,
              },
              areaSqm,
              perimeterMeters,
              color: f.properties?.color || "#2563EB",
            };
          })
          .filter((f) => Array.isArray(f.latLngs) && f.latLngs.length > 0);

        setMapFeatures(mappedFeats);
      }
    } catch (err) {
      console.error("Error loading project:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, router, setProjectId, setProjectData, setMapFeatures, setLoading, parseGeoJsonCoords]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  return { refetchProject: fetchProjectData };
}
