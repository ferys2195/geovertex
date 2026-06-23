"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { CoordinateMode, GisFeatureProperties } from '@/lib/types';
import { FeatureCollection } from 'geojson';
import { INDONESIA_SAMPLES } from '@/lib/data/samples';
import { geojsonToGPX } from '@/lib/gpx';

// Dynamic import of MapContainer with SSR disabled to prevent Leaflet "window is not defined" error
const MapContainer = dynamic(() => import('@/components/MapContainer'), { 
  ssr: false,
  loading: () => <div className="flex-1 bg-zinc-100 animate-pulse flex items-center justify-center text-zinc-400">Loading Map...</div>
});

const EMPTY_COLLECTION: FeatureCollection = {
  type: 'FeatureCollection',
  features: []
};

export default function Page() {
  const [coordinateMode, setCoordinateMode] = useState<CoordinateMode>('UTM');
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection>(INDONESIA_SAMPLES[0].data); // Load monas by default!
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomToTrigger, setZoomToTrigger] = useState<{ id: string; time: number } | null>(null);

  // Download Handler Helper
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export GeoJSON Handler
  const handleExportGeoJSON = () => {
    const stringified = JSON.stringify(geoJsonData, null, 2);
    triggerDownload(stringified, 'peta-gis-export.geojson', 'application/json');
  };

  // Export GPX Handler
  const handleExportGPX = () => {
    try {
      const gpxContent = geojsonToGPX(geoJsonData);
      triggerDownload(gpxContent, 'peta-gis-gpx-export.gpx', 'application/gpx+xml');
    } catch (err: any) {
      alert(`Gagal mengekspor GPX: ${err.message}`);
    }
  };

  // Apply imported/uploaded GeoJSON dataset
  const handleImportGeoJSON = (data: FeatureCollection) => {
    setGeoJsonData(data);
  };

  // Load a dynamic Landmark pre-selection
  const handleLoadSample = (index: number) => {
    if (index >= 0 && index < INDONESIA_SAMPLES.length) {
      setGeoJsonData(INDONESIA_SAMPLES[index].data);
    }
  };

  // Clear Map Canvas
  const handleClearMap = () => {
    setGeoJsonData(EMPTY_COLLECTION);
  };

  // Zoom map viewport to target shape
  const handleZoomToFeature = (featureId: string) => {
    setZoomToTrigger({ id: featureId, time: Date.now() });
  };

  // Delete a specific drawn layer feature
  const handleDeleteFeature = (featureId: string) => {
    const nextFeatures = geoJsonData.features.filter((f, idx) => {
      const id = f.properties?.id || `f-${idx}`;
      return id !== featureId;
    });
    setGeoJsonData({
      ...geoJsonData,
      features: nextFeatures,
    });
  };

  // Update properties name, descriptions or drawing colors
  const handleUpdateFeatureProperties = (featureId: string, updatedProps: GisFeatureProperties) => {
    const nextFeatures = geoJsonData.features.map((f, idx) => {
      const id = f.properties?.id || `f-${idx}`;
      if (id === featureId) {
        return {
          ...f,
          properties: {
            ...f.properties,
            ...updatedProps,
          }
        };
      }
      return f;
    });

    setGeoJsonData({
      ...geoJsonData,
      features: nextFeatures
    });
  };

  // Inject a manual coordinates waypoint
  const handleAddManualPoint = (lat: number, lng: number, name: string, description: string, color?: string) => {
    const newPointFeature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [lng, lat]
      },
      properties: {
        id: `pt-${Math.random().toString(36).substring(2, 11)}`,
        name: name || 'Titik Kustom',
        description: description || '',
        color: color || '#3b82f6'
      }
    };

    setGeoJsonData({
      ...geoJsonData,
      features: [newPointFeature, ...geoJsonData.features]
    });
  };

  const hasData = geoJsonData.features.length > 0;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-800">
      {/* HEADER CONTROL BAR */}
      <Navbar
        coordinateMode={coordinateMode}
        setCoordinateMode={setCoordinateMode}
        onImportGeoJSON={handleImportGeoJSON}
        onExportGeoJSON={handleExportGeoJSON}
        onExportGPX={handleExportGPX}
        onLoadSample={handleLoadSample}
        onClearMap={handleClearMap}
        hasData={hasData}
      />

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative select-none">
        
        {/* SIDEBAR EDIT PANEL */}
        <Sidebar
          geoJsonData={geoJsonData}
          onUpdateGeoJSON={handleImportGeoJSON}
          coordinateMode={coordinateMode}
          onZoomToFeature={handleZoomToFeature}
          onDeleteFeature={handleDeleteFeature}
          onUpdateFeatureProperties={handleUpdateFeatureProperties}
          onAddPoint={handleAddManualPoint}
        />

        {/* INTERACTIVE MAP COMPONENT VIEW */}
        <MapContainer
          geoJsonData={geoJsonData}
          onGeoJsonChange={setGeoJsonData}
          coordinateMode={coordinateMode}
          hoverCoords={hoverCoords}
          setHoverCoords={setHoverCoords}
          zoomToTrigger={zoomToTrigger}
        />
      </div>
    </div>
  );
}
