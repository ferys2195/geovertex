"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sparkles, MousePointerClick, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center space-y-8 z-10"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold"
      >
        <Sparkles className="w-4 h-4" /> Collaborative GIS Digitizing & Map Reporting Platform
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-5xl mx-auto leading-[1.1]"
      >
        Digitasi Peta Lahan & Edit Vertex Presisi{" "}
        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-emerald-400 to-indigo-400">
          di Cloud
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed"
      >
        Olah data spasial lahan, konversi koordinat Lat/Lng ↔ UTM real-time, berkolaborasi dengan tim surveyor & drafter, serta cetak laporan peta PDF kartografi resmi secara instan.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
      >
        <Link href="/login">
          <Button size="lg" className="w-full sm:w-auto h-13 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 rounded-xl">
            Mulai Gratis dengan Google
          </Button>
        </Link>
        <a href="#sandbox">
          <Button size="lg" className="w-full sm:w-auto h-13 px-8 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-base rounded-xl">
            <MousePointerClick className="w-5 h-5 mr-2 text-emerald-400" /> Coba Demo Interaktif
          </Button>
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="pt-6 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tanpa Perlu Instalasi Software
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-Save ke Supabase PostGIS
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ekspor GeoJSON, GPX, KML & PDF
        </div>
      </motion.div>
    </motion.section>
  );
}
