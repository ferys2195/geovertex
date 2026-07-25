"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Project, Profile } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Layers, Plus, Map, Calendar, Users, Trash2, Edit3, ExternalLink, Copy, Search, LogOut, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isDevModeAllowed } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLat, setNewLat] = useState("-6.200000");
  const [newLng, setNewLng] = useState("106.816666");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Project Modal
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

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

      setUser(session.user);

      // Fetch Profile
      const { data: profData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (profData) setProfile(profData);

      // Fetch Owned Projects
      const { data: ownedData } = await supabase
        .from("projects")
        .select("*, project_members(count)")
        .eq("owner_id", session.user.id)
        .order("updated_at", { ascending: false });

      const ownedMapped: Project[] = (ownedData || []).map((p: any) => ({
        ...p,
        members_count: p.project_members?.[0]?.count || 1,
        my_role: "owner",
      }));

      setProjects(ownedMapped);
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
          center_lat: parseFloat(newLat) || -6.2,
          center_lng: parseFloat(newLng) || 106.816666,
          zoom_level: 13,
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
          owner_id: user.id,
          title: newTitle.trim(),
          description: newDesc.trim(),
          center_lat: parseFloat(newLat) || -6.2,
          center_lng: parseFloat(newLng) || 106.816666,
          zoom_level: 13,
        })
        .select()
        .single();

      if (error) throw error;

      setIsCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      router.push(`/project/${data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal membuat proyek baru.");
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-emerald-900/30 border border-slate-800 shadow-xl gap-4">
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
            <Map className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-300">Belum Ada Proyek Pemetaan</h3>
              <p className="text-xs text-slate-500">Mulai dengan membuat proyek pemetaan berbasis cloud pertama Anda.</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Buat Proyek Pertama
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/project/${project.id}`)}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-blue-500/10"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      <Map className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        title="Hapus Proyek"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
                      {project.description || "Tidak ada deskripsi proyek."}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {project.members_count || 1} Tim
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(project.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  <span className="text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Buka Editor <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px] bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Plus className="w-5 h-5 text-blue-400" /> Buat Proyek Pemetaan Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Isi parameter proyek untuk membuka kanvas pemetaan spasial kolaboratif.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Proyek *</label>
              <Input
                placeholder="Misal: Digitasi Sertifikat Lahan Sukamaju"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Proyek</label>
              <Input
                placeholder="Misal: Pemetaan batas area dan konversi titik UTM"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pusat Latitude</label>
                <Input
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pusat Longitude</label>
                <Input
                  value={newLng}
                  onChange={(e) => setNewLng(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-800 text-xs">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                {isSubmitting ? "Membuat..." : "Buat & Buka Canvas"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
