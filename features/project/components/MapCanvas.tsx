"use client";

import React, { useEffect, useRef, useState } from 'react';
import { latLngToUtm } from '@/lib/gis';
import { CoordinateMode } from '@/lib/types';
import { FeatureCollection } from 'geojson';

import { MapContainerProps, LatLngCoords } from '../types/mapCanvas.types';
import { UtmConverterDialog } from './modals/UtmConverterDialog';

import { useMapCanvasInit } from '../hooks/useMapCanvasInit';
import { useMapMeasurements } from '../hooks/useMapMeasurements';
import { useMapLayerSync } from '../hooks/useMapLayerSync';
import { useMapDrawEvents } from '../hooks/useMapDrawEvents';

import { MapBaseLayerSwitcher } from './MapCanvas/MapBaseLayerSwitcher';
import { MapUtmToolbar } from './MapCanvas/MapUtmToolbar';
import { MapCoordinateBar } from './MapCanvas/MapCoordinateBar';
import { MapContextMenu } from './MapCanvas/MapContextMenu';

export function MapCanvas({
  geoJsonData = { type: 'FeatureCollection', features: [] },
  onGeoJsonChange = () => {},
  coordinateMode = 'UTM',
  onCoordinateModeChange = () => {},
  hoverCoords = null,
  setHoverCoords = () => {},
  zoomToTrigger = null,
  readOnly = false,
  isSidebarOpen = false,
  selectedPdfFeatureId = null,
  onSelectPdfFeature = () => {},
  onOpenExportModal,
  onDeleteFeature,
  onEditFeature,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [rightClickCoords, setRightClickCoords] = useState<LatLngCoords | null>(null);
  const [isUtmDialogOpen, setIsUtmDialogOpen] = useState<boolean>(false);
  const [internalHoverCoords, setInternalHoverCoords] = useState<LatLngCoords | null>(null);
  const [activeCoordMode, setActiveCoordMode] = useState<CoordinateMode>(coordinateMode);

  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const selectedFeatureIdRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveCoordMode(coordinateMode);
  }, [coordinateMode]);

  useEffect(() => {
    selectedFeatureIdRef.current = selectedFeatureId;
  }, [selectedFeatureId]);

  // 1. Initialize Map instance & Tile layers
  const {
    mapInstanceRef,
    geojsonGroupRef,
    measurementGroupRef,
    focusedMeasurementGroupRef,
    activeLayerId,
    showLayerMenu,
    setShowLayerMenu,
    isMapReady,
    handleBaseLayerSelect,
  } = useMapCanvasInit(mapContainerRef);

  // 2. GIS Segment Measurement Labels engine
  const {
    clearDrawingMeasurements,
    clearFocusedMeasurements,
    updateFocusedMeasurementsForLayer,
    updateDrawingMeasurements,
  } = useMapMeasurements(
    mapInstanceRef,
    measurementGroupRef,
    focusedMeasurementGroupRef
  );

  // 3. External GeoJSON Data sync & Popup binding engine
  const { syncMapToState, bindLayerInteractiveListeners } = useMapLayerSync({
    mapInstanceRef,
    geojsonGroupRef,
    isMapReady,
    geoJsonData,
    coordinateMode: activeCoordMode,
    onGeoJsonChange,
    selectedFeatureId,
    setSelectedFeatureId,
    selectedFeatureIdRef,
    zoomToTrigger,
    onSelectPdfFeature,
    onOpenExportModal,
    onDeleteFeature,
    onEditFeature,
    updateFocusedMeasurementsForLayer,
    clearFocusedMeasurements,
    readOnly,
  });

  // 4. Geoman Drawing controls & Canvas mouse event listeners
  useMapDrawEvents({
    mapInstanceRef,
    geojsonGroupRef,
    isMapReady,
    syncMapToState,
    bindLayerInteractiveListeners,
    updateDrawingMeasurements,
    clearDrawingMeasurements,
    setSelectedFeatureId,
    setInternalHoverCoords,
    setHoverCoords,
    setRightClickCoords,
    readOnly,
  });

  // 5. Trigger Leaflet invalidateSize & shift Geoman controls smoothly when sidebar toggles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Shift Geoman controls & Leaflet left controls (.leaflet-left)
    const leftControls = mapContainerRef.current.querySelectorAll('.leaflet-left');
    leftControls.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.transition = 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      htmlEl.style.left = isSidebarOpen ? '400px' : '16px';
    });

    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    const interval = setInterval(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      mapInstanceRef.current?.invalidateSize();
    }, 350);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSidebarOpen, isMapReady]);

  const handleCopyCoordinates = () => {
    const coordsToCopy = rightClickCoords || hoverCoords;
    if (!coordsToCopy) return;

    let textToCopy = '';
    if (coordinateMode === 'UTM') {
      textToCopy = latLngToUtm(coordsToCopy.lat, coordsToCopy.lng).formatted;
    } else {
      textToCopy = `${coordsToCopy.lat.toFixed(6)}, ${coordsToCopy.lng.toFixed(6)}`;
    }

    navigator.clipboard.writeText(textToCopy);
  };

  const handleAddUtmPoint = (lat: number, lng: number, name: string, description: string, color?: string) => {
    const newFeature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
      properties: {
        id: `pt-${Date.now()}`,
        name: name || "Titik Pengukuran",
        description: description || "",
        color: color || "#3b82f6",
      },
    };

    const updatedGeoJson: FeatureCollection = {
      type: "FeatureCollection",
      features: [...(geoJsonData?.features || []), newFeature as any],
    };

    onGeoJsonChange?.(updatedGeoJson);
  };

  return (
    <MapContextMenu onCopyCoordinates={handleCopyCoordinates}>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-10 font-sans"
        style={{ cursor: readOnly ? 'default' : 'crosshair' }} 
      />

      {/* BASEMAP LAYER SWITCHER FLOATING CONTROL */}
      <MapBaseLayerSwitcher
        activeLayerId={activeLayerId}
        showLayerMenu={showLayerMenu}
        setShowLayerMenu={setShowLayerMenu}
        onBaseLayerSelect={handleBaseLayerSelect}
      />

      {/* UTM CONVERTER TOOLBAR BUTTON & INSTRUCTIONS */}
      <MapUtmToolbar
        onOpenUtmDialog={() => setIsUtmDialogOpen(true)}
        isSidebarOpen={isSidebarOpen}
        readOnly={readOnly}
      />

      {/* MOUSE HOVER COORDINATES METRIC DISPLAY & TOGGLE */}
      <MapCoordinateBar
        hoverCoords={hoverCoords}
        internalHoverCoords={internalHoverCoords}
        activeCoordMode={activeCoordMode}
        onToggleCoordinateMode={() => {
          const nextMode: CoordinateMode = activeCoordMode === 'UTM' ? 'LatLng' : 'UTM';
          setActiveCoordMode(nextMode);
          onCoordinateModeChange?.(nextMode);
        }}
        isSidebarOpen={isSidebarOpen}
      />

      {/* UTM CONVERTER DIALOG */}
      <UtmConverterDialog
        isOpen={isUtmDialogOpen}
        onClose={() => setIsUtmDialogOpen(false)}
        onAddPoint={handleAddUtmPoint}
      />
    </MapContextMenu>
  );
}

export default MapCanvas;
