"use client";

import React, { useRef } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  FileJson, 
  Globe
} from 'lucide-react';
import { CoordinateMode } from '@/lib/types';
import { FeatureCollection } from 'geojson';
import { gpxToGeoJSON } from '@/lib/gis/gpx';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HeaderProps {
  coordinateMode: CoordinateMode;
  setCoordinateMode: (mode: CoordinateMode) => void;
  onImportGeoJSON: (data: FeatureCollection) => void;
  onExportGeoJSON: () => void;
  onExportGPX: () => void;
  onClearMap: () => void;
  hasData: boolean;
}

export function Header({
  coordinateMode,
  setCoordinateMode,
  onImportGeoJSON,
  onExportGeoJSON,
  onExportGPX,
  onClearMap,
  hasData
}: HeaderProps) {
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
          const geoJsonData = gpxToGeoJSON(content);
          onImportGeoJSON(geoJsonData);
          alert('GPX berhasil diimpor dan dikonversi ke format GeoJSON!');
        } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
          const parsed = JSON.parse(content) as FeatureCollection;
          if (parsed && (parsed.type === 'FeatureCollection' || parsed.type === 'Feature')) {
            onImportGeoJSON(parsed);
          } else {
            alert('Format GeoJSON tidak valid secara struktural. Harus merupakan FeatureCollection atau Feature.');
          }
        } else {
          alert('Format file tidak didukung. Silakan gunakan .geojson, .json, atau .gpx');
        }
      } catch (err: unknown) {
        console.error('Error importing file:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error tidak dikenal';
        alert(`Gagal mengimpor file: ${errorMessage}`);
      }
    };

    reader.readAsText(file);
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <header id="navbar-container" className="bg-background border-b text-foreground flex flex-col md:flex-row items-center justify-between px-6 py-3.5 shadow-sm z-40 relative">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3 mb-3 md:mb-0">
        <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-sm flex items-center justify-center">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
            Geovertex <span className="text-[10px] bg-muted text-muted-foreground font-bold px-1.5 py-0.5 rounded border">V1.5</span>
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium">Sistem Grid UTM (WGS 84)</p>
        </div>
      </div>

      {/* Control Actions & Switches */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        
        {/* Input Format Switcher: UTM vs LatLng */}
        <div className="flex items-center bg-muted p-1 rounded-md border">
          <Button
            variant={coordinateMode === 'UTM' ? "default" : "ghost"}
            size="sm"
            onClick={() => setCoordinateMode('UTM')}
            className="h-7 px-3 text-xs font-semibold rounded-sm"
          >
            UTM
          </Button>
          <Button
            variant={coordinateMode === 'LatLng' ? "default" : "ghost"}
            size="sm"
            onClick={() => setCoordinateMode('LatLng')}
            className="h-7 px-3 text-xs font-semibold rounded-sm"
          >
            Lat/Lng
          </Button>
        </div>

        {/* Import Action */}
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              className="h-9"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Upload File
            </Button>
          } />
          <TooltipContent>Import GeoJSON, JSON atau GPX</TooltipContent>
        </Tooltip>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".geojson,.json,.gpx" 
          className="hidden" 
        />

        {/* Export Dropdown Group */}
        {hasData && (
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="default"
                  size="sm"
                  onClick={onExportGeoJSON}
                  className="rounded-r-none h-9"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Unduh GeoJSON
                </Button>
              } />
              <TooltipContent>Download sebagai GeoJSON</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="default"
                  size="sm"
                  onClick={onExportGPX}
                  className="rounded-l-none border-l border-primary-foreground/20 h-9 px-3"
                >
                  <FileJson className="w-4 h-4" />
                  <span className="sr-only">GPX</span>
                  <span className="text-[10px] ml-1.5 uppercase font-bold">GPX</span>
                </Button>
              } />
              <TooltipContent>Download sebagai GPX</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Clear/Reset Action */}
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin menghapus semua fitur dari peta? Tindakan ini tidak dapat dibatalkan.')) {
                  onClearMap();
                }
              }}
              className="h-9 w-9"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </Button>
          } />
          <TooltipContent>Hapus Semua Fitur</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
export default Header;
