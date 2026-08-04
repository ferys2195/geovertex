"use client";

import { motion, type Variants } from "motion/react";
import { Crosshair, FileText, Users, Download } from "lucide-react";

const features = [
  {
    icon: Crosshair,
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/40",
    title: "Precision Vertex Inspector",
    description: "Tabel inspeksi titik sudut (*vertex*) interaktif. Edit koordinat angka secara langsung untuk menggeser posisi titik dengan presisi milimeter.",
  },
  {
    icon: FileText,
    colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40",
    title: "Cartographic PDF Generator",
    description: "Cetak laporan peta berskala kartografi dengan UTM Grid Border (X/Y), Jarum Arah Utara, Legenda, dan Halaman Tabel Koordinat resmi.",
  },
  {
    icon: Users,
    colorClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40",
    title: "Team Collaboration & RBAC",
    description: "Bagikan proyek ke anggota tim dengan hak akses Owner, Editor (bisa edit vertex), atau Viewer (read-only untuk klien).",
  },
  {
    icon: Download,
    colorClass: "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:border-purple-500/40",
    title: "Multi-Format Converter",
    description: "Impor dan ekspor berkas data spasial beragam format secara fleksibel: GeoJSON, GPX Garmin, KML Google Earth, dan CSV Vertex Table.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FeaturesSection() {
  return (
    <motion.section
      id="features"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={containerVariants}
      className="py-20 px-6 max-w-7xl mx-auto space-y-12 z-10 relative"
    >
      <motion.div variants={itemVariants} className="text-center space-y-3 max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Fitur Unggulan GeoVertex SaaS</h2>
        <p className="text-sm text-slate-400">Dirancang khusus untuk GIS Specialist, Drafter Pemetaan, dan Tim Lapangan Surveyor.</p>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 transition-all ${item.colorClass}`}
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold ${item.colorClass}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
