"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { FeatureCollection } from "geojson";

const DynamicMapContainer = dynamic(() => import("@/components/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="h-120 w-full rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-400 text-xs">
      Loading Live Interactive GIS Sandbox...
    </div>
  ),
});

export function SandboxSection() {
  const [sandboxGeoJson, setSandboxGeoJson] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  return (
    <motion.section
      id="sandbox"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-12 px-6 max-w-7xl mx-auto z-10 relative"
    >
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
    </motion.section>
  );
}
