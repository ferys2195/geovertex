"use client";

import { useEffect, useState, useRef, use } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Project, UserRole, MapFeatureRecord } from "@/lib/supabase/types";
import { ExportModal } from "@/components/ExportModal";
import { ShareModal, TeamMemberItem } from "@/components/ShareModal";
import { MapFeatureExportData } from "@/lib/export/pdfExporter";
import { Button } from "@/components/ui/button";
import { Layers, Share2, Download, Cloud, CloudOff, Loader2, ArrowLeft, Shield, Sparkles, PanelLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isDevModeAllowed } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import { FeatureCollection } from "geojson";
import { CoordinateMode, GisFeatureProperties } from "@/lib/types";

const DynamicMapContainer = dynamic(() => import("@/components/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
      Memuat Editor Peta Cloud...
    </div>
  ),
});

export default function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("owner");
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [mapFeatures, setMapFeatures] = useState<MapFeatureExportData[]>([]);
  const [loading, setLoading] = useState(true);

  // Cloud Auto-Save Engine State
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "unsaved">("synced");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sidebar & GIS Canvas States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [coordinateMode, setCoordinateMode] = useState<CoordinateMode>("UTM");
  const [zoomToTrigger, setZoomToTrigger] = useState<{ id: string; time: number } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedPdfFeatureId, setSelectedPdfFeatureId] = useState<string | null>(null);
  const deletedFeatureIdsRef = useRef<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!isDevModeAllowed()) {
          router.push("/login");
          return;
        }
      }

      if (!session?.user || projectId.startsWith("demo-proj")) {
        // Demo project fallback
        setProject({
          id: projectId,
          owner_id: "demo-user-1",
          title: "Proyek Pemetaan Lahan (Demo)",
          description: "Mode Uji Coba Lahan",
          center_lat: -6.2,
          center_lng: 106.816666,
          zoom_level: 14,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setCurrentRole("owner");
        setMembers([
          { id: "mem-1", email: "surveyor@geovertex.com", full_name: "Surveyor Utama", role: "owner" },
          { id: "mem-2", email: "drafter@geovertex.com", full_name: "Drafter Lahan", role: "editor" },
        ]);
        setLoading(false);
        return;
      }

      // Fetch Project
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

      setProject(projData);

      // Determine User Role
      if (projData.owner_id === session.user.id) {
        setCurrentRole("owner");
      } else {
        const { data: memData } = await supabase
          .from("project_members")
          .select("role")
          .eq("project_id", projectId)
          .eq("user_id", session.user.id)
          .single();
        if (memData) setCurrentRole(memData.role as UserRole);
      }

      // Fetch Team Members
      const { data: teamData } = await supabase
        .from("project_members")
        .select("*, profiles(*)")
        .eq("project_id", projectId);

      const mappedMembers: TeamMemberItem[] = (teamData || []).map((m: any) => ({
        id: m.id,
        email: m.profiles?.email || "user@geovertex.com",
        full_name: m.profiles?.full_name || m.profiles?.email,
        role: m.role,
        avatar_url: m.profiles?.avatar_url,
      }));
      setMembers(mappedMembers);

      // Fetch Map Features from Supabase PostGIS
      const { data: featData, error: featErr } = await supabase
        .from("map_features")
        .select("*")
        .eq("project_id", projectId);

      if (featErr) {
        console.error("❌ [Supabase Fetch Error] Gagal mengambil data map_features:", featErr);
      }

      console.log(`📥 [Supabase DB Fetch] Mentah (${featData?.length || 0} baris dari tabel map_features):`, featData);

      if (featData) {
        const mappedFeats: MapFeatureExportData[] = featData
          .map((f: MapFeatureRecord) => {
            const parsedLatLngs = parseGeoJsonCoords(f);
            console.log(`🔬 [Row Debug] id=${f.id}, feature_type=${f.feature_type}`, {
              geometry_type: typeof f.geometry,
              geometry_value: f.geometry,
              properties_latLngs: f.properties?.latLngs,
              parsed_latLngs: parsedLatLngs,
              parsed_count: parsedLatLngs.length,
            });
            return {
              id: f.id,
              type: f.feature_type as any,
              name: f.layer_name || "Feature",
              latLngs: parsedLatLngs,
              properties: f.properties || {},
              areaSqm: f.properties?.areaSqm,
              perimeterMeters: f.properties?.perimeterMeters,
              color: f.properties?.color || "#2563EB",
            };
          })
          .filter((f) => {
            const valid = Array.isArray(f.latLngs) && f.latLngs.length > 0;
            if (!valid) console.warn(`⚠️ [Row Filtered Out] id=${f.id}, latLngs=`, f.latLngs);
            return valid;
          });

        console.log(`🗺️ [Map Features Result] Berhasil diproses & disiapkan untuk canvas/sidebar (${mappedFeats.length} geometri):`, mappedFeats);
        setMapFeatures(mappedFeats);
      }
    } catch (err) {
      console.error("Error loading project:", err);
    } finally {
      setLoading(false);
    }
  };

  const hexToBytes = (hex: string): Uint8Array => {
    const cleanHex = hex.trim().replace(/^\\x/i, "").replace(/^0x/i, "");
    const bytes = new Uint8Array(Math.floor(cleanHex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16) || 0;
    }
    return bytes;
  };

  const parseEwkbHex = (hex: string): { type: string; coordinates: any } | null => {
    try {
      const bytes = hexToBytes(hex);
      if (bytes.length < 5) return null;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      let offset = 0;
      const byteOrder = view.getUint8(offset);
      offset += 1;
      if (byteOrder !== 0 && byteOrder !== 1) return null;
      const littleEndian = byteOrder === 1;

      const rawType = view.getUint32(offset, littleEndian);
      offset += 4;

      const hasSrid = (rawType & 0x20000000) !== 0;
      const geomType = rawType & 0xffff;

      if (hasSrid) {
        offset += 4;
      }

      if (geomType === 1) { // Point
        const lng = view.getFloat64(offset, littleEndian);
        offset += 8;
        const lat = view.getFloat64(offset, littleEndian);
        return { type: "Point", coordinates: [lng, lat] };
      } else if (geomType === 2) { // LineString
        const numPoints = view.getUint32(offset, littleEndian);
        offset += 4;
        const coords: [number, number][] = [];
        for (let i = 0; i < numPoints; i++) {
          const lng = view.getFloat64(offset, littleEndian);
          offset += 8;
          const lat = view.getFloat64(offset, littleEndian);
          offset += 8;
          coords.push([lng, lat]);
        }
        return { type: "LineString", coordinates: coords };
      } else if (geomType === 3) { // Polygon
        const numRings = view.getUint32(offset, littleEndian);
        offset += 4;
        const rings: [number, number][][] = [];
        for (let r = 0; r < numRings; r++) {
          const numPoints = view.getUint32(offset, littleEndian);
          offset += 4;
          const ring: [number, number][] = [];
          for (let i = 0; i < numPoints; i++) {
            const lng = view.getFloat64(offset, littleEndian);
            offset += 8;
            const lat = view.getFloat64(offset, littleEndian);
            offset += 8;
            ring.push([lng, lat]);
          }
          rings.push(ring);
        }
        return { type: "Polygon", coordinates: rings };
      } else if (geomType === 6) { // MultiPolygon
        const numPolys = view.getUint32(offset, littleEndian);
        offset += 4;
        const polys: [number, number][][][] = [];
        for (let p = 0; p < numPolys; p++) {
          const subByteOrder = view.getUint8(offset);
          offset += 1;
          const subLittle = subByteOrder === 1;
          const subRawType = view.getUint32(offset, subLittle);
          offset += 4;
          if ((subRawType & 0x20000000) !== 0) offset += 4;

          const numRings = view.getUint32(offset, subLittle);
          offset += 4;
          const rings: [number, number][][] = [];
          for (let r = 0; r < numRings; r++) {
            const numPoints = view.getUint32(offset, subLittle);
            offset += 4;
            const ring: [number, number][] = [];
            for (let i = 0; i < numPoints; i++) {
              const lng = view.getFloat64(offset, subLittle);
              offset += 8;
              const lat = view.getFloat64(offset, subLittle);
              offset += 8;
              ring.push([lng, lat]);
            }
            rings.push(ring);
          }
          polys.push(rings);
        }
        return { type: "MultiPolygon", coordinates: polys };
      }
    } catch (e) {
      console.error("EWKB parse error:", e);
    }
    return null;
  };

  const parseWktString = (wkt: string): { type: string; coordinates: any } | null => {
    try {
      const clean = wkt.replace(/^SRID=\d+;/i, "").trim();
      const typeMatch = clean.match(/^(POLYGON|LINESTRING|POINT|MULTIPOLYGON|MULTILINESTRING)/i);
      if (!typeMatch) return null;
      const type = typeMatch[1].toUpperCase();
      const coordStr = clean.slice(clean.indexOf("("));

      if (type === "POLYGON") {
        const ringMatches = coordStr.match(/\(([^()]+)\)/g);
        if (!ringMatches) return null;
        const rings = ringMatches.map((ring) => {
          const pts = ring.replace(/[()]/g, "").trim().split(",");
          return pts
            .map((pt) => {
              const [lng, lat] = pt.trim().split(/\s+/).map(Number);
              return [lng, lat] as [number, number];
            })
            .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
        });
        return { type: "Polygon", coordinates: rings };
      } else if (type === "LINESTRING") {
        const pts = coordStr.replace(/[()]/g, "").trim().split(",");
        const coords = pts
          .map((pt) => {
            const [lng, lat] = pt.trim().split(/\s+/).map(Number);
            return [lng, lat] as [number, number];
          })
          .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
        return { type: "LineString", coordinates: coords };
      } else if (type === "POINT") {
        const [lng, lat] = coordStr.replace(/[()]/g, "").trim().split(/\s+/).map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          return { type: "Point", coordinates: [lng, lat] };
        }
      }
    } catch (e) {
      console.error("WKT parse error:", e);
    }
    return null;
  };

  const ensureLatLngPair = (pt: any, sourceHint?: "geojson" | "latlngs"): [number, number] | null => {
    let lat: number;
    let lng: number;

    // 1. Explicit object format { lat, lng } or { latitude, longitude }
    if (pt && typeof pt === "object" && !Array.isArray(pt)) {
      const valLat = Number(pt.lat ?? pt.latitude);
      const valLng = Number(pt.lng ?? pt.longitude);
      if (!isNaN(valLat) && !isNaN(valLng)) {
        return [valLat, valLng];
      }
    }

    // 2. Array format
    if (Array.isArray(pt) && pt.length >= 2) {
      const v0 = Number(pt[0]);
      const v1 = Number(pt[1]);
      if (isNaN(v0) || isNaN(v1)) return null;

      // Auto-detect: if one coordinate is > 90 or < -90, it is DEFINITELY Longitude!
      if (Math.abs(v0) > 90 && Math.abs(v1) <= 90) {
        // v0 is Longitude, v1 is Latitude -> [lat, lng] = [v1, v0]
        return [v1, v0];
      }
      if (Math.abs(v1) > 90 && Math.abs(v0) <= 90) {
        // v1 is Longitude, v0 is Latitude -> [lat, lng] = [v0, v1]
        return [v0, v1];
      }

      // If both coordinates are <= 90, rely on sourceHint
      if (sourceHint === "geojson") {
        // GeoJSON specification is [lng, lat] -> convert to [lat, lng]
        return [v1, v0];
      } else {
        // Standard Leaflet format is [lat, lng]
        return [v0, v1];
      }
    }

    return null;
  };

  const parseGeoJsonCoords = (featureRecord: any): [number, number][] => {
    let rawList: any[] = [];
    let hint: "geojson" | "latlngs" = "geojson";

    // 1. Prioritize authoritative PostGIS geometry column
    const geometry = featureRecord?.geometry;
    let geom: any = null;

    if (geometry) {
      if (typeof geometry === "object" && geometry.coordinates) {
        geom = geometry;
      } else if (typeof geometry === "string") {
        const cleanStr = geometry.trim();
        if (cleanStr.startsWith("{")) {
          try {
            geom = JSON.parse(cleanStr);
          } catch (e) {
            console.error("Error parsing GeoJSON geometry string:", e);
          }
        } else if (/^(SRID=\d+;)?(POLYGON|LINESTRING|POINT|MULTIPOLYGON|MULTILINESTRING)/i.test(cleanStr)) {
          geom = parseWktString(cleanStr);
        } else {
          geom = parseEwkbHex(cleanStr);
        }
      }
    }

    if (geom && geom.type === "Feature" && geom.geometry) {
      geom = geom.geometry;
    }

    if (geom?.coordinates) {
      hint = "geojson";
      const geomTypeUpper = (geom.type || "").toString().toUpperCase();
      if (geomTypeUpper.includes("POLYGON")) {
        rawList = geomTypeUpper.includes("MULTI") ? (geom.coordinates[0]?.[0] || []) : (geom.coordinates[0] || []);
      } else if (geomTypeUpper.includes("LINE") || geomTypeUpper.includes("STRING")) {
        rawList = geomTypeUpper.includes("MULTI") ? (geom.coordinates[0] || []) : geom.coordinates;
      } else if (geomTypeUpper.includes("POINT")) {
        const pt = Array.isArray(geom.coordinates[0]) ? geom.coordinates[0] : geom.coordinates;
        rawList = [pt];
      } else if (Array.isArray(geom.coordinates)) {
        if (Array.isArray(geom.coordinates[0]) && Array.isArray(geom.coordinates[0][0])) {
          rawList = geom.coordinates[0];
        } else {
          rawList = geom.coordinates;
        }
      }
    }

    // 2. Fallback to properties.latLngs or properties.geojson if geometry column wasn't present/parsed
    if (rawList.length === 0 && Array.isArray(featureRecord?.properties?.latLngs) && featureRecord.properties.latLngs.length > 0) {
      rawList = featureRecord.properties.latLngs;
      hint = "latlngs";
    } else if (rawList.length === 0 && featureRecord?.properties?.geojson) {
      geom = featureRecord.properties.geojson;
      if (geom && geom.type === "Feature" && geom.geometry) geom = geom.geometry;
      if (geom?.coordinates) {
        hint = "geojson";
        const geomTypeUpper = (geom.type || "").toString().toUpperCase();
        if (geomTypeUpper.includes("POLYGON")) {
          rawList = geomTypeUpper.includes("MULTI") ? (geom.coordinates[0]?.[0] || []) : (geom.coordinates[0] || []);
        } else if (geomTypeUpper.includes("LINE") || geomTypeUpper.includes("STRING")) {
          rawList = geomTypeUpper.includes("MULTI") ? (geom.coordinates[0] || []) : geom.coordinates;
        } else if (geomTypeUpper.includes("POINT")) {
          const pt = Array.isArray(geom.coordinates[0]) ? geom.coordinates[0] : geom.coordinates;
          rawList = [pt];
        }
      }
    }

    const clean: [number, number][] = [];
    for (const item of rawList) {
      const pair = ensureLatLngPair(item, hint);
      if (pair) clean.push(pair);
    }

    return clean;
  };

  const handleFeaturesChanged = (updatedFeatures: MapFeatureExportData[]) => {
    setMapFeatures(updatedFeatures);
    setSaveStatus("unsaved");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounced Auto-Save to Supabase (1 second)
    autoSaveTimerRef.current = setTimeout(() => {
      saveFeaturesToCloud(updatedFeatures);
    }, 1000);
  };

  const saveFeaturesToCloud = async (featuresToSave: MapFeatureExportData[]) => {
    if (!project || projectId.startsWith("demo-proj") || loading) {
      setSaveStatus("synced");
      return;
    }

    try {
      setSaveStatus("saving");

      // 1. Delete features explicitly removed by user
      const idsToDelete = [...new Set(deletedFeatureIdsRef.current)];
      if (idsToDelete.length > 0) {
        await supabase.from("map_features").delete().in("id", idsToDelete);
        deletedFeatureIdsRef.current = [];
      }

      // 2. Upsert current active features
      if (featuresToSave.length > 0) {
        const payload = featuresToSave.map((f) => {
          let geometryObj: any;
          if (f.type === "Polygon" || f.type === "Rectangle") {
            const coords = f.latLngs.map(([lat, lng]) => [lng, lat]);
            if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
              coords.push(coords[0]);
            }
            geometryObj = { type: "Polygon", coordinates: [coords] };
          } else if (f.type === "Polyline") {
            geometryObj = { type: "LineString", coordinates: f.latLngs.map(([lat, lng]) => [lng, lat]) };
          } else {
            const pt = f.latLngs[0] || [0, 0];
            geometryObj = { type: "Point", coordinates: [pt[1], pt[0]] };
          }

          const isUuid = f.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.id);
          const validId = isUuid ? f.id : (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined);

          const item: any = {
            id: validId,
            project_id: projectId,
            layer_name: f.name,
            feature_type: f.type,
            geometry: geometryObj,
            properties: {
              areaSqm: f.areaSqm || null,
              perimeterMeters: f.perimeterMeters || null,
              latLngs: f.latLngs.map(([lat, lng]) => ({ lat, lng })),
              geojson: geometryObj,
              ...f.properties,
            },
          };

          return item;
        });

        console.log(`📤 [Cloud Auto-Save] Mengirim ${payload.length} geometri ke Supabase:`, payload);

        const { data: upsertedData, error: upsertError } = await supabase
          .from("map_features")
          .upsert(payload, { onConflict: "id" })
          .select("id, properties");

        if (upsertError) {
          console.error("❌ [Cloud Auto-Save Error] Gagal upsert ke Supabase:", upsertError);
          setSaveStatus("unsaved");
          return;
        }

        console.log(`✅ [Cloud Auto-Save Success] Data tersimpan di Supabase (${upsertedData?.length || 0} row):`, upsertedData);

        // Assign back generated UUIDs for new records
        if (upsertedData && upsertedData.length > 0) {
          setMapFeatures((prev) =>
            prev.map((f, idx) => {
              const returnedItem = upsertedData[idx];
              if (returnedItem?.id && (!f.id || f.id.startsWith("f-") || f.id.startsWith("pt-"))) {
                return { ...f, id: returnedItem.id };
              }
              return f;
            })
          );
        }
      }

      setSaveStatus("synced");
    } catch (err) {
      console.error("Cloud Auto-Save error:", err);
      setSaveStatus("unsaved");
    }
  };

  const handleInviteMember = async (email: string, role: UserRole): Promise<boolean> => {
    if (projectId.startsWith("demo-proj")) {
      setMembers([...members, { id: `mem-${Date.now()}`, email, full_name: email, role }]);
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
      fetchProjectData();
      return true;
    } catch (err) {
      console.error("Invite error:", err);
      return false;
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (projectId.startsWith("demo-proj")) {
      setMembers(members.filter((m) => m.id !== memberId));
      return;
    }

    try {
      await supabase.from("project_members").delete().eq("id", memberId);
      setMembers(members.filter((m) => m.id !== memberId));
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

  const geoJsonData: FeatureCollection = {
    type: "FeatureCollection",
    features: mapFeatures.map((f) => {
      let geometry: any;
      const typeLower = (f.type || "").toString().toLowerCase();

      if (typeLower.includes("polygon") || typeLower.includes("rect")) {
        const coords = f.latLngs.map(([lat, lng]) => [lng, lat]);
        if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push(coords[0]);
        }
        geometry = { type: "Polygon", coordinates: [coords] };
      } else if (typeLower.includes("line") || typeLower.includes("path") || typeLower.includes("string")) {
        geometry = { type: "LineString", coordinates: f.latLngs.map(([lat, lng]) => [lng, lat]) };
      } else if (f.latLngs.length >= 3) {
        // Auto-detect 3+ points as Polygon
        const coords = f.latLngs.map(([lat, lng]) => [lng, lat]);
        if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push(coords[0]);
        }
        geometry = { type: "Polygon", coordinates: [coords] };
      } else if (f.latLngs.length === 2) {
        // Auto-detect 2 points as LineString
        geometry = { type: "LineString", coordinates: f.latLngs.map(([lat, lng]) => [lng, lat]) };
      } else {
        const pt = f.latLngs[0] || [0, 0];
        geometry = { type: "Point", coordinates: [pt[1], pt[0]] };
      }

      return {
        type: "Feature",
        geometry,
        properties: {
          id: f.id,
          name: f.name,
          description: f.properties?.description || "",
          color: f.color || "#2563EB",
          ...f.properties,
        },
      };
    }),
  };

  const handleZoomToFeature = (featureId: string) => {
    setZoomToTrigger({ id: featureId, time: Date.now() });
  };

  const handleDeleteFeature = (featureId: string) => {
    if (featureId && !featureId.startsWith("f-") && !featureId.startsWith("pt-")) {
      deletedFeatureIdsRef.current.push(featureId);
    }
    const updated = mapFeatures.filter((f) => f.id !== featureId);
    handleFeaturesChanged(updated);
  };

  const handleUpdateFeatureProperties = (featureId: string, props: GisFeatureProperties) => {
    const updated = mapFeatures.map((f) => {
      if (f.id === featureId) {
        return {
          ...f,
          name: props.name || f.name,
          color: props.color || f.color,
          properties: { ...f.properties, ...props },
        };
      }
      return f;
    });
    handleFeaturesChanged(updated);
  };

  const handleAddPoint = (lat: number, lng: number, name: string, description: string, color?: string) => {
    const newPt: MapFeatureExportData = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pt-${Date.now()}`,
      type: "Marker",
      name: name || "Titik Pengukuran",
      latLngs: [[lat, lng]],
      color: color || "#2563EB",
      properties: { description },
    };
    handleFeaturesChanged([...mapFeatures, newPt]);
  };

  const handleUpdateGeoJSON = (newGeoJson: FeatureCollection) => {
    const converted: MapFeatureExportData[] = (newGeoJson.features || [])
      .filter((feat) => feat && feat.geometry)
      .map((feat, idx) => {
        const props = (feat.properties || {}) as GisFeatureProperties;
        const type = (feat.geometry?.type || "Point") as any;
        let latLngs: [number, number][] = [];

        if (type === "Polygon") {
          const ring = (feat.geometry as any).coordinates[0] || [];
          latLngs = ring.map((pt: any) => ensureLatLngPair(pt, "geojson")).filter(Boolean) as [number, number][];
        } else if (type === "LineString") {
          const coords = (feat.geometry as any).coordinates || [];
          latLngs = coords.map((pt: any) => ensureLatLngPair(pt, "geojson")).filter(Boolean) as [number, number][];
        } else if (type === "Point") {
          const pt = (feat.geometry as any).coordinates || [0, 0];
          const pair = ensureLatLngPair(pt, "geojson");
          latLngs = pair ? [pair] : [];
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

    // Detect feature deletion from map canvas
    const newIds = new Set(converted.map((c) => c.id));
    mapFeatures.forEach((oldF) => {
      if (oldF.id && !newIds.has(oldF.id)) {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oldF.id)) {
          deletedFeatureIdsRef.current.push(oldF.id);
        }
      }
    });

    handleFeaturesChanged(converted);
  };

  const isReadOnly = currentRole === "viewer";

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors" title="Kembali ke Dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-slate-800" />

          {/* Toggle Sidebar Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
            <Download className="w-3.5 h-3.5 mr-1.5" /> Ekspor PDF & Data
          </Button>
        </div>
      </header>

      {/* Main Content Body: Sidebar + Map Canvas Container */}
      <div className="flex-1 relative overflow-hidden flex flex-row">
        {/* Sidebar Panel */}
        {isSidebarOpen && (
          <Sidebar
            geoJsonData={geoJsonData}
            onUpdateGeoJSON={handleUpdateGeoJSON}
            coordinateMode={coordinateMode}
            onZoomToFeature={handleZoomToFeature}
            onDeleteFeature={handleDeleteFeature}
            onUpdateFeatureProperties={handleUpdateFeatureProperties}
            onAddPoint={handleAddPoint}
            selectedPdfFeatureId={selectedPdfFeatureId}
            onSelectPdfFeature={setSelectedPdfFeatureId}
          />
        )}

        {/* Map Canvas */}
        <div className="flex-1 relative overflow-hidden h-full">
          <DynamicMapContainer
            geoJsonData={geoJsonData}
            onGeoJsonChange={handleUpdateGeoJSON}
            coordinateMode={coordinateMode}
            onCoordinateModeChange={setCoordinateMode}
            zoomToTrigger={zoomToTrigger}
            selectedPdfFeatureId={selectedPdfFeatureId}
            onSelectPdfFeature={setSelectedPdfFeatureId}
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
    </div>
  );
}
