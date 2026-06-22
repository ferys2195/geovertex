import React, { useRef } from 'react';
import { 
  Map, 
  Download, 
  Upload, 
  Trash2, 
  FileJson, 
  Globe, 
  Compass,
  Database
} from 'lucide-react';
import { CoordinateMode } from '../types';
import { INDONESIA_SAMPLES } from '../data/samples';
import { FeatureCollection } from 'geojson';
import { gpxToGeoJSON } from '../utils/gpx';

interface NavbarProps {
  coordinateMode: CoordinateMode;
  setCoordinateMode: (mode: CoordinateMode) => void;
  onImportGeoJSON: (data: FeatureCollection) => void;
  onExportGeoJSON: () => void;
  onExportGPX: () => void;
  onLoadSample: (sampleIndex: number) => void;
  onClearMap: () => void;
  hasData: boolean;
}

export default function Navbar({
  coordinateMode,
  setCoordinateMode,
  onImportGeoJSON,
  onExportGeoJSON,
  onExportGPX,
  onLoadSample,
  onClearMap,
  hasData
}: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        if (fileName.endsWith('.gpx')) {
          // Convert GPX track/waypoint/route to GeoJSON
          const geoJsonData = gpxToGeoJSON(content);
          onImportGeoJSON(geoJsonData);
          alert('GPX berhasil diimpor dan dikonversi ke format GeoJSON!');
        } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
          // Standard GeoJSON
          const parsed = JSON.parse(content) as FeatureCollection;
          if (parsed && (parsed.type === 'FeatureCollection' || parsed.type === 'Feature')) {
            onImportGeoJSON(parsed);
          } else {
            alert('Format GeoJSON tidak valid secara struktural. Harus merupakan FeatureCollection atau Feature.');
          }
        } else {
          alert('Format file tidak didukung. Silakan gunakan .geojson, .json, atau .gpx');
        }
      } catch (err: any) {
        console.error('Error importing file:', err);
        alert(`Gagal mengimpor file: ${err.message || 'Error tidak dikenal'}`);
      }
    };

    reader.readAsText(file);
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <header id="navbar-container" className="bg-white border-b border-zinc-200 text-zinc-800 flex flex-col md:flex-row items-center justify-between px-6 py-3.5 shadow-xs z-[1001]">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3 mb-3 md:mb-0">
        <div className="bg-zinc-900 p-2 rounded-lg text-white shadow-xs flex items-center justify-center">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-zinc-900 tracking-tight flex items-center gap-2">
            INDO-GIS <span className="text-[10px] bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded border border-zinc-200">V1.5</span>
          </h1>
          <p className="text-[11px] text-zinc-500 font-medium">geojson.io clone &amp; UTM coordinate toolkit</p>
        </div>
      </div>

      {/* Control Actions & Switches */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        
        {/* Sample Loader */}
        <div className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-1.5 border border-zinc-200 max-w-xs transition-all hover:bg-zinc-100/50">
          <Database className="w-4 h-4 text-zinc-500" />
          <select 
            onChange={(e) => {
              if (e.target.value !== "") {
                onLoadSample(Number(e.target.value));
              }
            }} 
            className="bg-transparent text-xs text-zinc-700 outline-none pr-1 cursor-pointer font-medium focus:text-zinc-900"
            defaultValue=""
          >
            <option value="" disabled className="text-zinc-400">Pilih Data Sampel...</option>
            {INDONESIA_SAMPLES.map((sample, idx) => (
              <option key={idx} value={idx} className="text-zinc-800 bg-white">
                {sample.name}
              </option>
            ))}
          </select>
        </div>

        {/* Input Format Switcher: UTM vs LatLng */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200/80">
          <button
            onClick={() => setCoordinateMode('UTM')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
              coordinateMode === 'UTM' 
                ? 'bg-zinc-900 text-white shadow-xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            UTM
          </button>
          <button
            onClick={() => setCoordinateMode('LatLng')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
              coordinateMode === 'LatLng' 
                ? 'bg-zinc-900 text-white shadow-xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Lat/Lng
          </button>
        </div>

        {/* Import Action */}
        <button
          onClick={triggerFileInput}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
          title="Import GeoJSON, JSON atau GPX"
        >
          <Upload className="w-4 h-4 text-zinc-500" />
          <span>Upload File</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".geojson,.json,.gpx" 
          className="hidden" 
        />

        {/* Export Dropdown Group */}
        {hasData && (
          <div className="flex items-center gap-px">
            <button
              onClick={onExportGeoJSON}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-l-lg transition-all shadow-xs cursor-pointer"
              title="Download sebagai GeoJSON"
            >
              <Download className="w-4 h-4" />
              <span>Unduh GeoJSON</span>
            </button>
            <button
              onClick={onExportGPX}
              className="flex items-center justify-center px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white border-l border-zinc-700 text-xs font-semibold rounded-r-lg transition-all shadow-xs cursor-pointer"
              title="Download sebagai GPX"
            >
              <FileJson className="w-4 h-4 text-zinc-300" />
              <span className="sr-only">GPX</span>
              <span className="text-[10px] ml-1.5 uppercase font-bold text-zinc-300">GPX</span>
            </button>
          </div>
        )}

        {/* Clear/Reset Action */}
        <button
          onClick={() => {
            if (window.confirm('Apakah Anda yakin ingin menghapus semua fitur dari peta? Tindakan ini tidak dapat dibatalkan.')) {
              onClearMap();
            }
          }}
          className="flex items-center justify-center p-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
          title="Hapus Semua Fitur"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
