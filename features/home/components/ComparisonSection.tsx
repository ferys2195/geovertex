import { CheckCircle2 } from "lucide-react";

export function ComparisonSection() {
  return (
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
  );
}
