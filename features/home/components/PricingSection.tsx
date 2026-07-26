import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function PricingSection() {
  return (
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
            <Button className="w-full h-12 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-100 font-semibold rounded-xl">
              Daftar Gratis Sekarang
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
  );
}
