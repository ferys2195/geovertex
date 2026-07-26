import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight } from "lucide-react";

export function HomeHeader() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-xl text-white tracking-tight">GeoVertex</span>
            <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              BETA V1.0
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
  );
}
