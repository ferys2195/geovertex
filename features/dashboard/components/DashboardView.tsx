"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Project, Profile } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Plus, Search, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isDevModeAllowed } from "@/lib/utils";
import { ProjectGrid } from "./ProjectGrid";
import { CreateProjectModal } from "./CreateProjectModal";

interface SupabaseProjectRow extends Project {
  project_members?: { count: number }[];
}

export function DashboardView() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchUserDataAndProjects();
  }, []);

  const fetchUserDataAndProjects = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        if (!isDevModeAllowed()) {
          router.push("/login");
          return;
        }
        // Fallback for offline demo mode if no session
        setUser({ id: "demo-user-1", email: "demo@geovertex.com" });
        setProfile({
          id: "demo-user-1",
          email: "demo@geovertex.com",
          full_name: "Demo Surveyor",
          avatar_url: "",
          subscription_tier: "free",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setProjects([
          {
            id: "demo-proj-1",
            owner_id: "demo-user-1",
            title: "Proyek Pemetaan Lahan Perkebunan Blok A",
            description: "Survei kadastral dan digitasi vertex lahan sawit 12.5 Hektar",
            center_lat: -6.2,
            center_lng: 106.816666,
            zoom_level: 14,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            members_count: 2,
            my_role: "owner",
          },
          {
            id: "demo-proj-2",
            owner_id: "demo-user-1",
            title: "Batas Kawasan Industri Cikarang",
            description: "Digitasi batas luar area pabrik dan jalur pipa gas",
            center_lat: -6.3,
            center_lng: 107.15,
            zoom_level: 13,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            members_count: 1,
            my_role: "owner",
          },
        ]);
        setLoading(false);
        return;
      }

      setUser({ id: session.user.id, email: session.user.email });

      // Fetch Profile
      const { data: profData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (profData) setProfile(profData as Profile);

      // Fetch Owned Projects
      const { data: ownedData } = await supabase
        .from("projects")
        .select("*, project_members(count)")
        .eq("owner_id", session.user.id)
        .order("updated_at", { ascending: false });

      const ownedMapped: Project[] = ((ownedData as unknown as SupabaseProjectRow[]) || []).map((p) => ({
        ...p,
        members_count: p.project_members?.[0]?.count || 1,
        my_role: "owner",
      }));

      // Fetch Shared Projects (where user is a collaborator)
      const { data: sharedMemberData } = await supabase
        .from("project_members")
        .select("role, project_id")
        .eq("user_id", session.user.id)
        .neq("role", "owner");

      const ownedIds = new Set(ownedMapped.map((p) => p.id));
      const sharedMapped: Project[] = [];

      if (sharedMemberData && sharedMemberData.length > 0) {
        const roleMap = new Map<string, "owner" | "editor" | "viewer">();
        const sharedProjectIds: string[] = [];

        for (const m of sharedMemberData) {
          if (!ownedIds.has(m.project_id)) {
            sharedProjectIds.push(m.project_id);
            roleMap.set(m.project_id, m.role as "editor" | "viewer");
          }
        }

        if (sharedProjectIds.length > 0) {
          const { data: sharedProjData } = await supabase
            .from("projects")
            .select("*, project_members(count)")
            .in("id", sharedProjectIds);

          if (sharedProjData) {
            for (const p of sharedProjData as unknown as SupabaseProjectRow[]) {
              sharedMapped.push({
                ...p,
                members_count: p.project_members?.[0]?.count || 1,
                my_role: roleMap.get(p.id) || "editor",
              });
            }
          }
        }
      }

      const allProjects = [...ownedMapped, ...sharedMapped].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setProjects(allProjects);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Check Free Tier Limit (Max 3 Projects)
    const isPro = profile?.subscription_tier === "pro";
    if (!isPro && projects.length >= 3) {
      setErrorMessage("Batas kuota Free Tier tercapai (Maksimal 3 Proyek Aktif). Upgrade ke Pro Tier untuk membuat proyek tanpa batas!");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (user?.id === "demo-user-1") {
        // Mock add for demo
        const mockProj: Project = {
          id: `demo-proj-${Date.now()}`,
          owner_id: user.id,
          title: newTitle,
          description: newDesc,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          members_count: 1,
          my_role: "owner",
        };
        setProjects([mockProj, ...projects]);
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDesc("");
        router.push(`/project/${mockProj.id}`);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          owner_id: user?.id,
          title: newTitle.trim(),
          description: newDesc.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setIsCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      router.push(`/project/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat proyek baru.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus proyek pemetaan ini?")) return;

    try {
      if (user?.id !== "demo-user-1") {
        await supabase.from("projects").delete().eq("id", id);
      }
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const filteredProjects = projects.filter(
    (p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPro = profile?.subscription_tier === "pro";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">GeoVertex SaaS</span>
            </Link>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Workspace Cloud
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{profile?.full_name || user?.email || "Surveyor User"}</p>
                <p className="text-[10px] text-slate-400 font-mono capitalize">{profile?.subscription_tier || "free"} Tier</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Keluar / Logout" className="text-slate-400 hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Banner Tier */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-linear-to-r from-blue-900/40 via-slate-900 to-emerald-900/30 border border-slate-800 shadow-xl gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">Dashboard Proyek Pemetaan Spasial</span>
              {!isPro ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Free Tier (Maks. 3 Proyek)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Pro Tier (Unlimited)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Kelola proyek GIS, undang tim kolaborasi, dan simpan geometri vertex otomatis di Supabase PostGIS Cloud.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Proyek Pemetaan Baru
          </Button>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Cari nama proyek atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-4 w-full sm:w-auto justify-end">
            <span>Total Proyek: <strong className="text-white">{projects.length}</strong></span>
            <span>Kuota Terpakai: <strong className="text-white">{projects.length} / {isPro ? "∞" : "3"}</strong></span>
          </div>
        </div>

        {/* Projects Grid */}
        <ProjectGrid
          projects={filteredProjects}
          loading={loading}
          onOpenProject={(id) => router.push(`/project/${id}`)}
          onDeleteProject={handleDeleteProject}
          onCreateOpen={() => setIsCreateOpen(true)}
        />
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title={newTitle}
        setTitle={setNewTitle}
        description={newDesc}
        setDescription={setNewDesc}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
