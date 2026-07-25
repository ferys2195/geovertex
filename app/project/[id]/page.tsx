"use client";

import { useEffect, useState, useRef, use } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Project, UserRole, MapFeatureRecord } from "@/lib/supabase/types";
import { ExportModal } from "@/components/ExportModal";
import { ShareModal, TeamMemberItem } from "@/components/ShareModal";
import { MapFeatureExportData } from "@/lib/export/pdfExporter";
import { Button } from "@/components/ui/button";
import { Layers, Share2, Download, Cloud, CloudOff, Loader2, ArrowLeft, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isDevModeAllowed } from "@/lib/utils";

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

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

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
      const { data: featData } = await supabase
        .from("map_features")
        .select("*")
        .eq("project_id", projectId);

      if (featData) {
        const mappedFeats: MapFeatureExportData[] = featData.map((f: MapFeatureRecord) => ({
          id: f.id,
          type: f.feature_type,
          name: f.layer_name || "Feature",
          latLngs: f.geometry?.coordinates ? parseGeoJsonCoords(f.geometry) : [],
          properties: f.properties || {},
          areaSqm: f.properties?.areaSqm,
          perimeterMeters: f.properties?.perimeterMeters,
        }));
        setMapFeatures(mappedFeats);
      }
    } catch (err) {
      console.error("Error loading project:", err);
    } finally {
      setLoading(false);
    }
  };

  const parseGeoJsonCoords = (geometry: any): [number, number][] => {
    if (!geometry?.coordinates) return [];
    if (geometry.type === "Polygon") {
      const ring = geometry.coordinates[0] || [];
      return ring.map((pt: [number, number]) => [pt[1], pt[0]]);
    } else if (geometry.type === "LineString") {
      return geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
    } else if (geometry.type === "Point") {
      return [[geometry.coordinates[1], geometry.coordinates[0]]];
    }
    return [];
  };

  const handleFeaturesChanged = (updatedFeatures: MapFeatureExportData[]) => {
    setMapFeatures(updatedFeatures);
    setSaveStatus("unsaved");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounced Auto-Save to Supabase (3 seconds)
    autoSaveTimerRef.current = setTimeout(() => {
      saveFeaturesToCloud(updatedFeatures);
    }, 3000);
  };

  const saveFeaturesToCloud = async (featuresToSave: MapFeatureExportData[]) => {
    if (!project || projectId.startsWith("demo-proj")) {
      setSaveStatus("synced");
      return;
    }

    try {
      setSaveStatus("saving");
      // Clean existing features & bulk insert updated features
      await supabase.from("map_features").delete().eq("project_id", projectId);

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

          return {
            project_id: projectId,
            layer_name: f.name,
            feature_type: f.type,
            geometry: geometryObj,
            properties: {
              areaSqm: f.areaSqm || null,
              perimeterMeters: f.perimeterMeters || null,
              ...f.properties,
            },
          };
        });

        await supabase.from("map_features").insert(payload);
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

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <DynamicMapContainer />
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectTitle={project?.title || "GeoVertex_Map"}
        features={mapFeatures}
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
