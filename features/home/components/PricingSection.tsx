"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Heart, Coffee, Gift, Sparkles, ShieldCheck } from "lucide-react";

export function PricingSection() {
  const trakteerUrl = process.env.NEXT_PUBLIC_TRAKTEER_URL || "https://trakteer.id";
  const saweriaUrl = process.env.NEXT_PUBLIC_SAWERIA_URL || "https://saweria.co";

  return (
    <motion.section
      id="pricing"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-20 px-6 max-w-7xl mx-auto space-y-12 z-10 relative"
    >
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
          Monetisasi Transparan & Sukarela
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">100% Gratis Tanpa Batasan</h2>
        <p className="text-sm text-slate-400">
          GeoVertex dapat digunakan sepenuhnya secara gratis tanpa paywall. Bantu kami menjaga platform ini tetap tumbuh melalui dukungan Anda!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Full Free Access Card */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Akses Penuh Bebas
            </span>
            <div>
              <span className="text-4xl font-extrabold text-white">Rp 0</span>
              <span className="text-xs text-slate-400 ml-2">/ selamanya</span>
            </div>
            <p className="text-xs text-slate-400">Seluruh fitur pemetaan profesional dibuka penuh untuk individu dan tim.</p>
            <ul className="space-y-3 pt-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Proyek Cloud <strong>Tanpa Batas</strong>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Anggota Tim Kolaborasi <strong>Tanpa Batas</strong>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Ekspor GeoJSON, GPX, KML & CSV
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Ekspor PDF Kartografi <strong>Tanpa Watermark</strong>
              </li>
            </ul>
          </div>
          <Link href="/login">
            <Button className="w-full h-12 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-100 font-semibold rounded-xl">
              Mulai Gunakan Sekarang
            </Button>
          </Link>
        </motion.div>

        {/* Support Development Card */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-gradient-to-b from-amber-950/40 via-orange-950/20 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-2xl relative"
        >
          <div className="absolute -top-3.5 right-8 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 shadow-md">
            Dukung Developer ☕
          </div>
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Platform Dukungan
            </span>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-white">Sukarela</span>
              <span className="text-xs text-slate-400 ml-2">via Trakteer / Saweria</span>
            </div>
            <p className="text-xs text-slate-300">Dukungan Anda membantu biaya operasional server cloud dan pengembangan fitur baru.</p>
            <ul className="space-y-3 pt-2 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400 shrink-0" /> Trakteer.id (QRIS & E-Wallet)
              </li>
              <li className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400 shrink-0" /> Saweria.co (All Payment Instant)
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 shrink-0" /> Menjaga GeoVertex Bebas & Bebas Iklan
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Prioritas Pembaruan Fitur Komunitas
              </li>
            </ul>
          </div>
          <div className="flex gap-2">
            <a href={trakteerUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 text-xs">
                <Heart className="w-4 h-4 mr-1.5 fill-rose-300" /> Trakteer
              </Button>
            </a>
            <a href={saweriaUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-600/20 text-xs">
                <Coffee className="w-4 h-4 mr-1.5" /> Saweria
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
