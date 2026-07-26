import { Crosshair, FileText, Users, Download } from "lucide-react";

export function FeaturesSection() {
  return (
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
  );
}
