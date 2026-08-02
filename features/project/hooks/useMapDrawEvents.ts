import { useEffect, useRef } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';

interface UseMapDrawEventsOptions {
  mapInstanceRef: React.RefObject<L.Map | null>;
  geojsonGroupRef: React.RefObject<L.FeatureGroup | null>;
  isMapReady: boolean;
  syncMapToState: () => void;
  bindLayerInteractiveListeners: (layer: any, props?: any) => void;
  updateDrawingMeasurements: (workingLayer: any, drawingType: string, mouseLatLng?: L.LatLng) => void;
  clearDrawingMeasurements: () => void;
  setSelectedFeatureId: (id: string | null) => void;
  setInternalHoverCoords: (coords: { lat: number; lng: number } | null) => void;
  setHoverCoords?: (coords: { lat: number; lng: number } | null) => void;
  setRightClickCoords: (coords: { lat: number; lng: number } | null) => void;
  readOnly?: boolean;
}

export function useMapDrawEvents({
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
  readOnly = false,
}: UseMapDrawEventsOptions) {
  const isDrawingRef = useRef<boolean>(false);
  const drawingTypeRef = useRef<string>('');
  const activeWorkingLayerRef = useRef<any>(null);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map) return;

    if (readOnly) {
      map.pm.removeControls();
      if (typeof (map.pm as any).disableDraw === 'function') {
        (map.pm as any).disableDraw();
      }
      if (typeof (map.pm as any).disableGlobalEditMode === 'function') {
        (map.pm as any).disableGlobalEditMode();
      }
      if (typeof (map.pm as any).disableGlobalRemovalMode === 'function') {
        (map.pm as any).disableGlobalRemovalMode();
      }
    } else {
      map.pm.addControls({
        position: 'topleft',
        drawMarker: true,
        drawCircleMarker: false,
        drawPolyline: true,
        drawRectangle: true,
        drawPolygon: true,
        drawCircle: false,
        editMode: true,
        dragMode: true,
        cutPolygon: false,
        removalMode: true,
        oneBlock: true,
      });

      map.pm.setLang('en');
    }

    const handlePmCreate = (e: any) => {
      const layer = e.layer;
      layer._pm_temp_id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 11);

      console.log(`🎨 [Geoman Drawing Finish] Bentuk: ${e.shape}, Layer ID: ${layer._pm_temp_id}`, layer.toGeoJSON ? layer.toGeoJSON() : layer);

      if (layer instanceof L.Path) {
        layer.setStyle({
          color: '#34d399',
          fillColor: '#34d399',
          fillOpacity: 0.35,
          weight: 3,
        });
      }

      bindLayerInteractiveListeners(layer, {
        id: layer._pm_temp_id,
        name: 'Geometri Baru',
      });

      geojsonGroupRef.current?.addLayer(layer);

      layer.on('pm:edit', syncMapToState);
      layer.on('pm:dragend', syncMapToState);
      layer.on('pm:remove', () => {
        geojsonGroupRef.current?.removeLayer(layer);
        syncMapToState();
      });

      setSelectedFeatureId(layer._pm_temp_id);
      syncMapToState();
    };

    const handlePmRemove = () => {
      syncMapToState();
    };

    const handleDrawStart = (e: any) => {
      isDrawingRef.current = true;
      drawingTypeRef.current = e.shape;
      if (e.workingLayer) {
        activeWorkingLayerRef.current = e.workingLayer;
      }
      clearDrawingMeasurements();
    };

    const handleDrawEnd = () => {
      isDrawingRef.current = false;
      activeWorkingLayerRef.current = null;
      clearDrawingMeasurements();
    };

    const handleWorkingLayerCreated = (e: any) => {
      const workingLayer = e.workingLayer;
      activeWorkingLayerRef.current = workingLayer;

      updateDrawingMeasurements(workingLayer, drawingTypeRef.current);

      workingLayer.on('pm:vertexadded', () => {
        updateDrawingMeasurements(workingLayer, drawingTypeRef.current);
      });

      workingLayer.on('pm:vertexremoved', () => {
        updateDrawingMeasurements(workingLayer, drawingTypeRef.current);
      });

      workingLayer.on('pm:snap', () => {
        updateDrawingMeasurements(workingLayer, drawingTypeRef.current);
      });

      workingLayer.on('pm:unsnap', () => {
        updateDrawingMeasurements(workingLayer, drawingTypeRef.current);
      });
    };

    const handleVertexAdded = (e: any) => {
      if (e.workingLayer) {
        activeWorkingLayerRef.current = e.workingLayer;
      }
      updateDrawingMeasurements(activeWorkingLayerRef.current, drawingTypeRef.current);
    };

    const handleVertexRemoved = (e: any) => {
      if (e.workingLayer) {
        activeWorkingLayerRef.current = e.workingLayer;
      }
      updateDrawingMeasurements(activeWorkingLayerRef.current, drawingTypeRef.current);
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setInternalHoverCoords(coords);
      setHoverCoords?.(coords);
      if (activeWorkingLayerRef.current) {
        updateDrawingMeasurements(activeWorkingLayerRef.current, drawingTypeRef.current, e.latlng);
      }
    };

    const handleMouseOut = () => {
      setInternalHoverCoords(null);
      setHoverCoords?.(null);
    };

    const handleContextMenu = (e: L.LeafletMouseEvent) => {
      setRightClickCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    const handleMapClick = () => {
      if (!isDrawingRef.current) {
        setSelectedFeatureId(null);
      }
    };

    map.on('pm:create', handlePmCreate);
    map.on('pm:remove', handlePmRemove);
    map.on('pm:drawstart', handleDrawStart);
    map.on('pm:drawend', handleDrawEnd);
    map.on('pm:workinglayercreated', handleWorkingLayerCreated);
    map.on('pm:vertexadded', handleVertexAdded);
    map.on('pm:vertexremoved', handleVertexRemoved);
    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);
    map.on('contextmenu', handleContextMenu);
    map.on('click', handleMapClick);

    return () => {
      map.off('pm:create', handlePmCreate);
      map.off('pm:remove', handlePmRemove);
      map.off('pm:drawstart', handleDrawStart);
      map.off('pm:drawend', handleDrawEnd);
      map.off('pm:workinglayercreated', handleWorkingLayerCreated);
      map.off('pm:vertexadded', handleVertexAdded);
      map.off('pm:vertexremoved', handleVertexRemoved);
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseOut);
      map.off('contextmenu', handleContextMenu);
      map.off('click', handleMapClick);
    };
  }, [isMapReady, readOnly]);

  return {
    isDrawingRef,
    drawingTypeRef,
    activeWorkingLayerRef,
  };
}
