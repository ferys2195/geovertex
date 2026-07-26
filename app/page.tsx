"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Layers,
  MapPin,
  Sparkles,
  Shield,
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  Globe,
  Zap,
  MousePointerClick,
  ChevronRight,
  Lock,
  Download,
  Crosshair,
  ExternalLink,
} from "lucide-react";

import { FeatureCollection } from "geojson";

// Dynamically load MapContainer for Sandbox Demo
const DynamicMapContainer = dynamic(() => import("@/components/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="h-120 w-full rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-400 text-xs">
      Loading Live Interactive GIS Sandbox...
    </div>
  ),
});

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"demo" | "features">("demo");
  const [sandboxGeoJson, setSandboxGeoJson] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Gradients & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-linear-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-96 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl text-white tracking-tight">GeoVertex</span>
              <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                SaaS V1.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#sandbox" className="hover:text-white transition-colors">
              Interactive Sandbox
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Fitur Unggulan
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              GeoVertex vs QGIS
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Harga & Paket
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900 text-sm">
                Masuk
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25">
                Mulai Gratis <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" /> Collaborative GIS Digitizing & Map Reporting Platform
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-5xl mx-auto leading-[1.1]">
          Digitasi Peta Lahan & Edit Vertex Presisi <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-emerald-400 to-indigo-400">di Cloud</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
          Olah data spasial lahan, konversi koordinat Lat/Lng ↔ UTM real-time, berkolaborasi dengan tim surveyor & drafter, serta cetak laporan peta PDF kartografi resmi secara instan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto h-13 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 rounded-xl">
              Mulai Gratis dengan Google
            </Button>
          </Link>
          <a href="#sandbox">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-200 font-semibold text-base rounded-xl">
              <MousePointerClick className="w-5 h-5 mr-2 text-emerald-400" /> Coba Demo Interaktif
            </Button>
          </a>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tanpa Perlu Instalasi Software
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-Save ke Supabase PostGIS
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ekspor GeoJSON, GPX, KML & PDF
          </div>
        </div>
      </section>

      {/* Live Interactive Sandbox Section */}
      <section id="sandbox" className="py-12 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Live Interactive Sandbox <span className="text-xs text-slate-400 font-normal">(Tanpa Login)</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Uji coba menggambar polygon/garis lahan dan lihat pengukuran luas real-time di bawah.
            </p>
          </div>

          <div className="h-130 rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner relative">
            <DynamicMapContainer
              geoJsonData={sandboxGeoJson}
              onGeoJsonChange={setSandboxGeoJson}
            />
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12 z-10 relative">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Fitur Unggulan GeoVertex SaaS</h2>
          <p className="text-sm text-slate-400">Dirancang khusus untuk GIS Specialist, Drafter Pemetaan, dan Tim Lapangan Surveyor.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Crosshair className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Precision Vertex Inspector</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tabel inspeksi titik sudut (*vertex*) interaktif. Edit koordinat angka secara langsung untuk menggeser posisi titik dengan presisi milimeter.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Cartographic PDF Generator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cetak laporan peta berskala kartografi dengan **UTM Grid Border ($X/Y$)**, Jarum Arah Utara, Legenda, dan Halaman Tabel Koordinat resmi.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Team Collaboration & RBAC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bagikan proyek ke anggota tim dengan hak akses **Owner**, **Editor** (bisa edit vertex), atau **Viewer** (read-only untuk klien).
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Format Converter</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Impor dan ekspor berkas data spasial beragam format secara fleksibel: GeoJSON, GPX Garmin, KML Google Earth, dan CSV Vertex Table.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Matrix Section */}
      <section id="comparison" className="py-16 px-6 max-w-7xl mx-auto space-y-10 z-10 relative">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white">GeoVertex SaaS vs GIS Desktop Tradisional</h2>
          <p className="text-xs text-slate-400">Mengapa tim pemetaan modern beralih ke platform GIS berbasis cloud.</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-200 uppercase text-[11px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Fitur / Kapabilitas</th>
                  <th className="p-4 text-blue-400">GeoVertex SaaS</th>
                  <th className="p-4 text-slate-400">QGIS / AutoCAD Desktop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="p-4 font-semibold text-white">Aksesibilitas Platform</td>
                  <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Web Browser (Tanpa Instalasi)
                  </td>
                  <td className="p-4 text-slate-400">Instalasi Software Berat (~2GB)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Penyimpanan & Auto-Save</td>
                  <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Cloud Auto-Save (Supabase PostGIS)
                  </td>
                  <td className="p-4 text-slate-400">File Lokal (.qgz/.dwg) Rawan Corrupt</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Kolaborasi Tim</td>
                  <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Akses Tim Real-time via Link & Email
                  </td>
                  <td className="p-4 text-slate-400">Manual Kirim File via Flashdisk/Email</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Konversi Lat/Lng ↔ UTM</td>
                  <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Toggle Instan Real-time
                  </td>
                  <td className="p-4 text-slate-400">Perlu Setting CRS Proyek Manual</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Ekspor Laporan PDF Kartografi</td>
                  <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Generator Otomatis + Grid UTM & Legend
                  </td>
                  <td className="p-4 text-slate-400">Design Print Layout Manual yang Rumit</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto space-y-12 z-10 relative">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Pilihan Paket Layanan Transparan</h2>
          <p className="text-sm text-slate-400">Mulai gratis untuk kebutuhan dasar atau tingkatkan ke Pro Tier untuk proyek tanpa batas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">Free Tier</span>
              <div>
                <span className="text-4xl font-extrabold text-white">Rp 0</span>
                <span className="text-xs text-slate-400 ml-2">/ selamanya</span>
              </div>
              <p className="text-xs text-slate-400">Sangat cocok untuk surveyor independen dan pemetaan skala kecil.</p>
              <ul className="space-y-3 pt-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Maksimal <strong>3 Proyek Aktif</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Maksimal <strong>2 Anggota Tim</strong> per proyek
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Ekspor GeoJSON, GPX, KML & CSV
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Ekspor PDF Kartografi (dengan watermark)
                </li>
              </ul>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full h-12 border-slate-800 hover:bg-slate-800 text-white font-semibold">
                Daftar Gratis Now
              </Button>
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-linear-to-b from-blue-900/40 to-slate-900 border-2 border-blue-500/50 rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3.5 right-8 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-md">
              Direkomendasikan
            </div>
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Pro Tier
              </span>
              <div>
                <span className="text-4xl font-extrabold text-white">Rp 149.000</span>
                <span className="text-xs text-slate-400 ml-2">/ bulan</span>
              </div>
              <p className="text-xs text-slate-300">Untuk perusahaan konsultan GIS, tim pemetaan, dan kontraktor lahan.</p>
              <ul className="space-y-3 pt-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Proyek Cloud <strong>Tanpa Batas</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Anggota Tim Kolaborasi <strong>Tanpa Batas</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Cetak PDF Kartografi <strong>Tanpa Watermark</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Prioritas Penyimpanan Cloud & Support
                </li>
              </ul>
            </div>
            <Link href="/login">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30">
                Upgrade ke Pro Tier
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">GeoVertex SaaS Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com/ferys2195/gpx-tool" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              Hanya butuh olah file GPX instan? Gunakan GPX Tool <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p>&copy; {new Date().getFullYear()} GeoVertex SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
