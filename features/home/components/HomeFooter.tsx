import { Layers, ExternalLink } from "lucide-react";

export function HomeFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white">GeoVertex SaaS Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="https://gpx-tool.mazafathi.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
            Hanya butuh olah file GPX instan? Gunakan GPX Tool <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p>&copy; {new Date().getFullYear()} GeoVertex SaaS. All rights reserved.</p>
      </div>
    </footer>
  );
}
