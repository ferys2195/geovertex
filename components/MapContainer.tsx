"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { CoordinateMode } from '@/lib/types';
import { FeatureCollection } from 'geojson';
import { latLngToUtm } from '@/lib/utm';
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance } from '@/lib/gisCalc';
import { Layers, Crosshair, MapPin, Maximize2, Copy, Calculator, ArrowRightLeft } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { UtmConverterDialog } from "@/components/UtmConverterDialog";

interface MapContainerProps {
  geoJsonData?: FeatureCollection;
  onGeoJsonChange?: (data: FeatureCollection) => void;
  coordinateMode?: CoordinateMode;
  onCoordinateModeChange?: (mode: CoordinateMode) => void;
  hoverCoords?: { lat: number; lng: number } | null;
  setHoverCoords?: (coords: { lat: number; lng: number } | null) => void;
  zoomToTrigger?: { id: string; time: number } | null;
  readOnly?: boolean;
  selectedPdfFeatureId?: string | null;
  onSelectPdfFeature?: (id: string | null) => void;
}

// Map Base Layers configurations
const BASE_LAYERS = [
  {
    id: 'osm',
    name: 'Standard OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19,
    maxZoom: 24,
  },
  {
    id: 'satellite',
    name: 'Esri Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxNativeZoom: 18,
    maxZoom: 24,
  },
  {
    id: 'carto-dark',
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 20,
    maxZoom: 24,
  },
  {
    id: 'carto-light',
    name: 'CartoDB Positron (Minimal)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 20,
    maxZoom: 24,
  },
  {
    id: 'topo',
    name: 'OpenTopoMap (Kontur)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Kartendaten: &copy; OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: &copy; OpenTopoMap (CC-BY-SA)',
    maxNativeZoom: 17,
    maxZoom: 24,
  }
];

export default function MapContainer({
  geoJsonData = { type: 'FeatureCollection', features: [] },
  onGeoJsonChange = () => {},
  coordinateMode = 'UTM',
  onCoordinateModeChange = () => {},
  hoverCoords = null,
  setHoverCoords = () => {},
  zoomToTrigger = null,
  readOnly = false,
  selectedPdfFeatureId = null,
  onSelectPdfFeature = () => {}
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonGroupRef = useRef<L.FeatureGroup | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>('carto-light');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [rightClickCoords, setRightClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isUtmDialogOpen, setIsUtmDialogOpen] = useState<boolean>(false);
  const [internalHoverCoords, setInternalHoverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeCoordMode, setActiveCoordMode] = useState<CoordinateMode>(coordinateMode);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  useEffect(() => {
    setActiveCoordMode(coordinateMode);
  }, [coordinateMode]);

  // Drawing mode measurement and tracking refs
  const isDrawingRef = useRef<boolean>(false);
  const drawingTypeRef = useRef<string>('');
  const activeWorkingLayerRef = useRef<any>(null);
  const measurementGroupRef = useRef<L.LayerGroup | null>(null);
  const drawingMeasureMarkersRef = useRef<L.Marker[]>([]);

  // Focused geometry selection state & refs for segment measurement labels
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const selectedFeatureIdRef = useRef<string | null>(null);
  const focusedMeasurementGroupRef = useRef<L.LayerGroup | null>(null);

  // Sync ref with selected state to resolve stale closure issues in Leaflet events
  useEffect(() => {
    selectedFeatureIdRef.current = selectedFeatureId;
  }, [selectedFeatureId]);

  // Ref to track current serialized GeoJSON on the map.
  // This avoids re-drawing loops during user interaction on the canvas.
  const mapGeoJsonStrRef = useRef<string>('');
  const isInternalUserActionRef = useRef<boolean>(false);
  const hasInitialAutoFitRef = useRef<boolean>(false);
  const syncMapToStateRef = useRef<() => void>(() => {});
  const bindLayerInteractiveListenersRef = useRef<(layer: any, props?: any) => void>(() => {});

  // Helper to extract a flat array of L.LatLng from leaflet geometries
  const getFlatLatLngs = (latlngs: any): L.LatLng[] => {
    if (!latlngs) return [];
    
    // If it's a LatLng instance
    if (latlngs instanceof L.LatLng) {
      return [latlngs];
    }
    
    // If it's a simple LatLng literal object
    if (typeof latlngs === 'object' && latlngs !== null && 'lat' in latlngs && 'lng' in latlngs) {
      return [L.latLng(latlngs.lat, latlngs.lng)];
    }
    
    // If it's an array
    if (Array.isArray(latlngs)) {
      let flat: L.LatLng[] = [];
      for (const item of latlngs) {
        if (Array.isArray(item)) {
          flat = flat.concat(getFlatLatLngs(item));
        } else if (item instanceof L.LatLng) {
          flat.push(item);
        } else if (typeof item === 'object' && item !== null && 'lat' in item && 'lng' in item) {
          flat.push(L.latLng((item as any).lat, (item as any).lng));
        }
      }
      return flat;
    }
    
    return [];
  };

  const clearDrawingMeasurements = () => {
    if (measurementGroupRef.current) {
      measurementGroupRef.current.clearLayers();
    }
    drawingMeasureMarkersRef.current = [];
  };

  const clearFocusedMeasurements = () => {
    if (focusedMeasurementGroupRef.current) {
      focusedMeasurementGroupRef.current.clearLayers();
    }
  };

  const updateFocusedMeasurementsForLayer = (layer: any) => {
    clearFocusedMeasurements();
    if (!layer || !focusedMeasurementGroupRef.current) return;

    try {
      // Extract coordinates based on layer structure
      const rawLatLngs = layer.getLatLngs ? layer.getLatLngs() : [];
      let pts = getFlatLatLngs(rawLatLngs);
      if (pts.length < 2) return;

      const isRectangle = layer.pm?.shape === 'Rectangle' || layer._shape === 'Rectangle';
      const isPolygon = layer instanceof L.Polygon;
      const isPolyline = layer instanceof L.Polyline && !isPolygon;

      let segments: Array<[L.LatLng, L.LatLng]> = [];

      if (isRectangle) {
        if (pts.length === 4) {
          segments.push([pts[0], pts[1]]);
          segments.push([pts[1], pts[2]]);
          segments.push([pts[2], pts[3]]);
          segments.push([pts[3], pts[0]]);
        }
      } else if (isPolygon) {
        // Closed loop segments
        for (let i = 0; i < pts.length - 1; i++) {
          segments.push([pts[i], pts[i + 1]]);
        }
        if (pts.length >= 3) {
          segments.push([pts[pts.length - 1], pts[0]]);
        }
      } else if (isPolyline) {
        // Open polyline segments
        for (let i = 0; i < pts.length - 1; i++) {
          segments.push([pts[i], pts[i + 1]]);
        }
      }

      // Exact 2 decimal places formatter as shown in user's image screen capture
      const formatSegmentDist = (meters: number): string => {
        if (meters < 1000) {
          return `${meters.toFixed(2)} m`;
        }
        return `${(meters / 1000).toFixed(2)} km`;
      };

      segments.forEach(([pA, pB]) => {
        const dist = pA.distanceTo(pB);
        if (dist < 0.2) return;

        const formatted = formatSegmentDist(dist);
        const midLat = (pA.lat + pB.lat) / 2;
        const midLng = (pA.lng + pB.lng) / 2;
        const pos = L.latLng(midLat, midLng);

        let angle = 0;
        const map = mapInstanceRef.current;
        if (map) {
          const ptA = map.project(pA);
          const ptB = map.project(pB);
          angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);
          // keep text upright
          if (angle > 90 || angle < -90) angle += 180;
        }

        const labelIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center pointer-events-none" style="transform: translate(-50%, -50%) rotate(${angle}deg);">
              <div class="text-[11px] font-extrabold whitespace-nowrap z-[1200] leading-none" style="color: #000000; text-shadow: 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff;">
                ${formatted}
              </div>
            </div>
          `,
          className: 'focused-distance-tag',
          iconSize: [0, 0]
        });

        const labelMarker = L.marker(pos, {
          icon: labelIcon,
          interactive: false
        });

        if (focusedMeasurementGroupRef.current) {
          labelMarker.addTo(focusedMeasurementGroupRef.current);
        }
      });
    } catch (err) {
      console.error('Error drawing focused measurements:', err);
    }
  };

  const updateDrawingMeasurements = (mouseLatLng?: L.LatLng) => {
    const workingLayer = activeWorkingLayerRef.current;
    if (!workingLayer || !measurementGroupRef.current) return;

    // Clear previous ones first
    clearDrawingMeasurements();

    try {
      // Get raw latlngs from working layer
      const rawLatLngs = workingLayer.getLatLngs ? workingLayer.getLatLngs() : [];
      let pts = getFlatLatLngs(rawLatLngs);

      if (pts.length === 0 && mouseLatLng) {
        return;
      }

      // Check shape type
      const shape = drawingTypeRef.current || workingLayer.pm?.shape || workingLayer._shape || '';
      let segments: Array<[L.LatLng, L.LatLng]> = [];

      if (shape === 'Rectangle') {
        if (pts.length === 4) {
          segments.push([pts[0], pts[1]]);
          segments.push([pts[1], pts[2]]);
          segments.push([pts[2], pts[3]]);
          segments.push([pts[3], pts[0]]);
        } else if (pts.length >= 1 && mouseLatLng) {
          const p1 = pts[0];
          const p3 = mouseLatLng;
          const p2 = L.latLng(p1.lat, p3.lng);
          const p4 = L.latLng(p3.lat, p1.lng);
          segments.push([p1, p2]);
          segments.push([p2, p3]);
          segments.push([p3, p4]);
          segments.push([p4, p1]);
        }
      } else if (shape === 'Polygon') {
        if (pts.length >= 1) {
          // Add segments between existing points
          for (let i = 0; i < pts.length - 1; i++) {
            segments.push([pts[i], pts[i + 1]]);
          }
          // Add segment to mouse cursor if moving
          if (mouseLatLng) {
            const lastPt = pts[pts.length - 1];
            const firstPt = pts[0];
            // Only add if mouse is not already the last point
            if (lastPt.distanceTo(mouseLatLng) > 0.5) {
              segments.push([lastPt, mouseLatLng]);
              // Also add dashed line back to start for a closed polygon feel
              if (firstPt.distanceTo(mouseLatLng) > 0.5) {
                segments.push([mouseLatLng, firstPt]);
              }
            } else if (pts.length >= 2) {
              // Mouse is already the last element of pts, so add segment back to first to close the polygon
              segments.push([lastPt, firstPt]);
            }
          } else if (pts.length >= 3) {
            // Close polygon
            segments.push([pts[pts.length - 1], pts[0]]);
          }
        }
      } else {
        // Default: Polyline / line drawing
        if (pts.length >= 1) {
          for (let i = 0; i < pts.length - 1; i++) {
            segments.push([pts[i], pts[i + 1]]);
          }
          if (mouseLatLng) {
            const lastPt = pts[pts.length - 1];
            if (lastPt.distanceTo(mouseLatLng) > 0.5) {
              segments.push([lastPt, mouseLatLng]);
            }
          }
        }
      }

      // Render tags
      segments.forEach(([pA, pB]) => {
        const dist = pA.distanceTo(pB);
        // Skip microscopic distances to avoid overlap & division by zero
        if (dist < 0.2) return;

        const formatted = formatDistance(dist);
        
        // Find midpoint
        const midLat = (pA.lat + pB.lat) / 2;
        const midLng = (pA.lng + pB.lng) / 2;
        const pos = L.latLng(midLat, midLng);

        let angle = 0;
        const map = mapInstanceRef.current;
        if (map) {
          const ptA = map.project(pA);
          const ptB = map.project(pB);
          angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);
          // keep text upright
          if (angle > 90 || angle < -90) angle += 180;
        }

        // Render as a divIcon label marker
        const labelIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center pointer-events-none" style="transform: translate(-50%, -50%) rotate(${angle}deg);">
              <div class="text-[10px] font-extrabold whitespace-nowrap z-[1100] leading-none" style="color: #000000; text-shadow: 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff;">
                ${formatted}
              </div>
            </div>
          `,
          className: 'measurement-distance-tag',
          iconSize: [0, 0]
        });

        const labelMarker = L.marker(pos, { 
          icon: labelIcon,
          interactive: false
        });

        if (measurementGroupRef.current) {
          labelMarker.addTo(measurementGroupRef.current);
          drawingMeasureMarkersRef.current.push(labelMarker);
        }
      });
    } catch (e) {
      console.error('Error drawing measurements:', e);
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-6.1754, 106.8272], // Central Monas, Jakarta
      zoom: 13,
      zoomControl: false, // Customize position of controls
      maxZoom: 24,
    });

    mapInstanceRef.current = map;

    // Zoom control to bottom-right (for sleeker UI)
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Add designated Feature Group for drawn/parsed geometries
    const group = L.featureGroup().addTo(map);
    geojsonGroupRef.current = group;

    // Add designated Layer Group for active drawing measurements
    const measurementGroup = L.layerGroup().addTo(map);
    measurementGroupRef.current = measurementGroup;

    // Add designated Layer Group for editing/focused segment length measurements
    const focusedGroup = L.layerGroup().addTo(map);
    focusedMeasurementGroupRef.current = focusedGroup;

    // Initialize Tile Layer
    const defaultLayer = BASE_LAYERS.find(l => l.id === activeLayerId) || BASE_LAYERS[0];
    const tileLayer = L.tileLayer(defaultLayer.url, {
      attribution: defaultLayer.attribution,
      maxZoom: defaultLayer.maxZoom || 24,
      maxNativeZoom: defaultLayer.maxNativeZoom || 19,
    }).addTo(map);
    activeTileLayerRef.current = tileLayer;

    // 2. Setup Geoman Controls
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
      oneBlock: true, // Group controls into one block style
    });

    // Custom text translations for Geoman (Bahasa Indonesia)
    map.pm.setLang('en'); // Defaults, we can write custom tooltips or stick to standard English icons which are highly understood.

    setIsMapReady(true);

    // 3. Event Listeners for Map Drawing
    const syncMapToState = () => {
      if (!geojsonGroupRef.current) return;
      
      isInternalUserActionRef.current = true;

      const features: any[] = [];
      const layers = geojsonGroupRef.current.getLayers();

      layers.forEach((layer: any) => {
        let geojson: any = null;

        // Leaflet GeoJSON classes exports
        if (typeof layer.toGeoJSON === 'function') {
          try {
            geojson = layer.toGeoJSON();
          } catch (err) {
            console.error('Error translating layer to GeoJSON:', err);
          }
        }

        if (geojson) {
          // Skip outer FeatureCollection wrapper layers if any group layer responds to toGeoJSON()
          if (geojson.type === 'FeatureCollection') {
            return;
          }

          geojson.properties = geojson.properties || {};
          
          // Re-embed ID
          if (layer._pm_temp_id) {
            geojson.properties.id = layer._pm_temp_id;
          } else {
            layer._pm_temp_id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
            geojson.properties.id = layer._pm_temp_id;
          }

          // Transfer other properties if already there from original data
          if (layer.feature && layer.feature.properties) {
            geojson.properties = {
              ...layer.feature.properties,
              ...geojson.properties, // Keep the ID
            };
          }

          features.push(geojson);
        }
      });

      const updatedCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features,
      };

      console.log(`✏️ [Geoman Canvas Sync] Total ${features.length} geometri aktif di peta:`, updatedCollection);

      const serialized = JSON.stringify(updatedCollection);
      mapGeoJsonStrRef.current = serialized;
      onGeoJsonChange(updatedCollection);
    };

    syncMapToStateRef.current = syncMapToState;

    const bindLayerInteractiveListeners = (layer: any, props: any = {}) => {
      if (!layer) return;

      if (!layer._pm_temp_id) {
        layer._pm_temp_id = props.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11));
      }

      const updatePopupContent = () => {
        let tooltipHtml = '';
        let currentGeo: any = null;
        if (typeof layer.toGeoJSON === 'function') {
          try {
            currentGeo = layer.toGeoJSON();
          } catch {
            currentGeo = null;
          }
        }

        const name = props.name || layer.feature?.properties?.name || 'Geometri Lahan';
        const desc = props.description || layer.feature?.properties?.description || '';

        if (layer instanceof L.Polygon || currentGeo?.geometry?.type === 'Polygon') {
          const latlngs = layer.getLatLngs ? layer.getLatLngs() : [];
          const pts = getFlatLatLngs(latlngs);
          const coords = pts.map((p) => [p.lng, p.lat]);
          if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push(coords[0]);
          }
          const area = calculatePolygonArea(coords);
          const perimeter = calculatePolygonPerimeter(coords);
          tooltipHtml = `
            <div class="p-2 text-xs font-sans min-w-[160px]">
              <p class="font-bold text-zinc-900 text-sm mb-0.5">${name}</p>
              ${desc ? `<p class="text-[10px] text-zinc-500 mb-1">${desc}</p>` : ''}
              <hr class="my-1.5 border-zinc-200" />
              <p class="text-xs text-emerald-600 font-extrabold">Luas: ${formatArea(area)}</p>
              <p class="text-[11px] text-zinc-600 font-medium">Keliling: ${formatDistance(perimeter)}</p>
            </div>
          `;
        } else if (layer instanceof L.Polyline || currentGeo?.geometry?.type === 'LineString') {
          const latlngs = layer.getLatLngs ? layer.getLatLngs() : [];
          const pts = getFlatLatLngs(latlngs);
          const coords = pts.map((p) => [p.lng, p.lat]);
          const length = calculateLineLength(coords);
          tooltipHtml = `
            <div class="p-2 text-xs font-sans min-w-[160px]">
              <p class="font-bold text-zinc-900 text-sm mb-0.5">${name}</p>
              ${desc ? `<p class="text-[10px] text-zinc-500 mb-1">${desc}</p>` : ''}
              <hr class="my-1.5 border-zinc-200" />
              <p class="text-xs text-blue-600 font-extrabold font-mono">Panjang: ${formatDistance(length)}</p>
            </div>
          `;
        } else if (layer instanceof L.Marker || currentGeo?.geometry?.type === 'Point') {
          const pt = layer.getLatLng ? layer.getLatLng() : L.latLng(0, 0);
          tooltipHtml = `
            <div class="p-2 text-xs font-sans min-w-[160px]">
              <p class="font-bold text-zinc-900 text-sm mb-0.5">${name}</p>
              ${desc ? `<p class="text-[10px] text-zinc-500 mb-1">${desc}</p>` : ''}
              <hr class="my-1.5 border-zinc-200" />
              <p class="text-[11px] text-zinc-700 font-mono">Lat: ${pt.lat.toFixed(6)}°</p>
              <p class="text-[11px] text-zinc-700 font-mono">Lng: ${pt.lng.toFixed(6)}°</p>
            </div>
          `;
        }

        if (tooltipHtml) {
          const popup = layer.getPopup();
          if (popup) {
            layer.setPopupContent(tooltipHtml);
          } else {
            layer.bindPopup(tooltipHtml, { autoPan: true });
          }
        }
      };

      updatePopupContent();

      layer.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setSelectedFeatureId(layer._pm_temp_id);
        updatePopupContent();
      });

      const handleLayerGeomChange = () => {
        if (layer._pm_temp_id === selectedFeatureIdRef.current) {
          updateFocusedMeasurementsForLayer(layer);
        }
        updatePopupContent();
        syncMapToState();
      };

      layer.on('pm:edit', handleLayerGeomChange);
      layer.on('pm:drag', handleLayerGeomChange);
      layer.on('pm:markerdrag', handleLayerGeomChange);
      layer.on('pm:dragend', handleLayerGeomChange);
    };

    bindLayerInteractiveListenersRef.current = bindLayerInteractiveListeners;

    // Callback on shape creation
    map.on('pm:create', (e: any) => {
      const layer = e.layer;
      
      // Auto assign unique Geoman temp ID (UUID format)
      layer._pm_temp_id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
      
      console.log(`🎨 [Geoman Drawing Finish] Bentuk: ${e.shape}, Layer ID: ${layer._pm_temp_id}`, layer.toGeoJSON ? layer.toGeoJSON() : layer);
      
      // Setup initial styles if any
      if (layer instanceof L.Path) {
        layer.setStyle({
          color: '#34d399', // Emerald hue outline
          fillColor: '#34d399',
          fillOpacity: 0.35,
          weight: 3
        });
      }

      // Bind interactive click & popup listeners!
      bindLayerInteractiveListeners(layer, {
        id: layer._pm_temp_id,
        name: 'Geometri Baru',
      });

      // Add to main feature group
      geojsonGroupRef.current?.addLayer(layer);

      // Setup event listeners for editing on this newly created layer
      layer.on('pm:edit', syncMapToState);
      layer.on('pm:dragend', syncMapToState);
      layer.on('pm:remove', () => {
        geojsonGroupRef.current?.removeLayer(layer);
        syncMapToState();
      });

      setSelectedFeatureId(layer._pm_temp_id);
      syncMapToState();
    });

    // Remove layer events on map
    map.on('pm:remove', (e: any) => {
      syncMapToState();
    });

    // 4. Geoman Drawing listeners and Event registration
    map.on('pm:drawstart', (e: any) => {
      isDrawingRef.current = true;
      drawingTypeRef.current = e.shape;
      if (e.workingLayer) {
        activeWorkingLayerRef.current = e.workingLayer;
      }
      clearDrawingMeasurements();
    });

    map.on('pm:drawend', () => {
      isDrawingRef.current = false;
      activeWorkingLayerRef.current = null;
      clearDrawingMeasurements();
    });

    map.on('pm:workinglayercreated', (e: any) => {
      const workingLayer = e.workingLayer;
      activeWorkingLayerRef.current = workingLayer;
      
      // Update measurements immediately
      updateDrawingMeasurements();

      workingLayer.on('pm:vertexadded', () => {
        updateDrawingMeasurements();
      });

      workingLayer.on('pm:vertexremoved', () => {
        updateDrawingMeasurements();
      });

      workingLayer.on('pm:snap', () => {
        updateDrawingMeasurements();
      });

      workingLayer.on('pm:unsnap', () => {
        updateDrawingMeasurements();
      });
    });

    // Map-wide drawing assist listeners
    map.on('pm:vertexadded', (e: any) => {
      if (e.workingLayer) {
        activeWorkingLayerRef.current = e.workingLayer;
      }
      updateDrawingMeasurements();
    });

    map.on('pm:vertexremoved', (e: any) => {
      if (e.workingLayer) {
        activeWorkingLayerRef.current = e.workingLayer;
      }
      updateDrawingMeasurements();
    });

    // 5. Cursor Hover & Live Measurement Update Listener
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setInternalHoverCoords(coords);
      setHoverCoords(coords);
      if (activeWorkingLayerRef.current) {
        updateDrawingMeasurements(e.latlng);
      }
    });

    map.on('mouseout', () => {
      setInternalHoverCoords(null);
      setHoverCoords(null);
    });

    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      setRightClickCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('click', () => {
      if (!isDrawingRef.current) {
        setSelectedFeatureId(null);
      }
    });

    // Clean up
    return () => {
      map.remove();
    };
  }, []);

  // 1. Respond to outside changes in GeoJSON state (Sample loaded, file imported, edit applied)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = geojsonGroupRef.current;

    if (!isMapReady) return;
    if (!map || !group) return;

    const currentExternalStr = JSON.stringify(geoJsonData);

    // If change was triggered internally by user drawing/editing on canvas, skip clearing layers!
    if (isInternalUserActionRef.current) {
      isInternalUserActionRef.current = false;
      mapGeoJsonStrRef.current = currentExternalStr;
      return;
    }

    // Skip if identical to what's already on the map to prevent focus loss & infinite loops
    if (currentExternalStr === mapGeoJsonStrRef.current) {
      return;
    }

    const featureCount = geoJsonData?.features?.length ?? 0;
    console.log(`🗺️ [MapContainer Render] geoJsonData berubah, ${featureCount} fitur akan di-render ke canvas:`, geoJsonData);

    // Update track reference
    mapGeoJsonStrRef.current = currentExternalStr;

    // Clear and Redraw
    group.clearLayers();

    if (geoJsonData && geoJsonData.features && featureCount > 0) {
      try {
        const geojsonLayer = L.geoJSON(geoJsonData, {
          style: (feature: any) => {
            const color = feature.properties?.color || '#3b82f6'; // default blue
            return {
              color: color,
              fillColor: color,
              fillOpacity: 0.3,
              weight: 3,
            };
          },
          pointToLayer: (feature: any, latlng: L.LatLng) => {
            const color = feature.properties?.color || '#3b82f6';
            
            const pinSvgHtml = `
              <svg class="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" 
                  fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
              </svg>
            `;
            
            const icon = L.divIcon({
              html: pinSvgHtml,
              className: 'custom-pin-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            });

            return L.marker(latlng, { icon });
          },
          onEachFeature: (feature: any, layer: any) => {
            bindLayerInteractiveListenersRef.current(layer, feature.properties || {});

            layer.on('pm:edit', () => syncMapToStateRef.current());
            layer.on('pm:dragend', () => syncMapToStateRef.current());
            layer.on('pm:remove', () => {
              geojsonGroupRef.current?.removeLayer(layer);
              syncMapToStateRef.current();
            });
          }
        });

        let layerCount = 0;
        geojsonLayer.eachLayer((layer: any) => {
          if (!group.hasLayer(layer)) {
            group.addLayer(layer);
            layerCount++;
          }
        });

        console.log(`✅ [MapContainer Render] Berhasil menambahkan ${layerCount} layer ke canvas map.`);

        // Force Leaflet to recalculate container dimensions immediately
        map.invalidateSize();

        // AUTO-FIT BOUNDS on data load from cloud / Supabase
        if (group.getLayers().length > 0) {
          try {
            const bounds = group.getBounds();
            if (bounds && bounds.isValid()) {
              map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
              console.log(`🔍 [MapContainer] fitBounds applied:`, bounds.toBBoxString());
            } else {
              console.warn('⚠️ [MapContainer] bounds tidak valid, tidak bisa fitBounds');
            }
          } catch (err) {
            console.error("Auto fit bounds error:", err);
          }
        }
      } catch (err) {
        console.error('❌ [MapContainer Render Error] L.geoJSON gagal:', err, geoJsonData);
      }
    }
  }, [geoJsonData, isMapReady]);

  // 2. Respond to sidebar center zoom trigger (Eye icon / Sidebar click)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !zoomToTrigger) return;

    // Find the layer with that target ID
    const layers = geojsonGroupRef.current?.getLayers() || [];
    let targetLayer: any = null;

    layers.forEach((layer: any) => {
      // Standard Leaflet GeoJSON layer acts as a layer tree container
      if (layer.getLayers) {
        layer.getLayers().forEach((subLayer: any) => {
          if (subLayer._pm_temp_id === zoomToTrigger.id) {
            targetLayer = subLayer;
          }
        });
      } else if (layer._pm_temp_id === zoomToTrigger.id) {
        targetLayer = layer;
      }
    });

    if (targetLayer) {
      setSelectedFeatureId(zoomToTrigger.id);
      if (typeof targetLayer.getLatLng === 'function' && !(targetLayer instanceof L.Polygon || targetLayer instanceof L.Polyline)) {
        map.setView(targetLayer.getLatLng(), 16, { animate: true });
        targetLayer.openPopup?.();
      } else if (typeof targetLayer.getBounds === 'function') {
        const bounds = targetLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
          targetLayer.openPopup?.();
        }
      }
    }
  }, [zoomToTrigger]);

  // React to selection changes of a geometry feature to draw segment lengths
  useEffect(() => {
    const group = geojsonGroupRef.current;
    if (!group) return;

    if (!selectedFeatureId) {
      clearFocusedMeasurements();
      return;
    }

    // Find the correct layer
    let foundLayer: any = null;
    const layers = group.getLayers();
    
    layers.forEach((layer: any) => {
      // Standard Leaflet GeoJSON layer acts as a layer tree container
      if (layer.getLayers) {
        layer.getLayers().forEach((sub: any) => {
          if (sub._pm_temp_id === selectedFeatureId) {
            foundLayer = sub;
          }
        });
      } else if (layer._pm_temp_id === selectedFeatureId) {
        foundLayer = layer;
      }
    });

    if (foundLayer) {
      updateFocusedMeasurementsForLayer(foundLayer);
    } else {
      clearFocusedMeasurements();
    }
  }, [selectedFeatureId, geoJsonData]);

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

  // Handle Base Map change
  const handleBaseLayerSelect = (layerId: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const selectedLayer = BASE_LAYERS.find(l => l.id === layerId);
    if (!selectedLayer) return;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    const nextTileLayer = L.tileLayer(selectedLayer.url, {
      attribution: selectedLayer.attribution,
      maxZoom: selectedLayer.maxZoom || 24,
      maxNativeZoom: selectedLayer.maxNativeZoom || 19,
    }).addTo(map);

    activeTileLayerRef.current = nextTileLayer;
    setActiveLayerId(layerId);
    setShowLayerMenu(false);
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
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full block relative">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full z-10 font-sans"
          style={{ cursor: readOnly ? 'default' : 'crosshair' }} 
        />

        {/* BASEMAP LAYER SWITCHER FLOATING CONTROL */}
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="bg-white/95 backdrop-blur-xs hover:bg-white text-zinc-800 p-2 rounded-lg border border-zinc-200/80 shadow-md transition-all flex items-center gap-2 cursor-pointer text-xs font-semibold"
              title="Pilih Tampilan Peta Dasar"
            >
              <Layers className="w-4 h-4 text-zinc-650" />
              <span className="hidden sm:inline">Peta Dasar</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white/98 backdrop-blur-md rounded-xl border border-zinc-200/90 shadow-xl p-1.5 z-[1001] space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  Pilih Tile Layer
                </div>
                {BASE_LAYERS.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => handleBaseLayerSelect(layer.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      activeLayerId === layer.id
                        ? 'bg-zinc-900 text-white font-bold'
                        : 'hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <span>{layer.name}</span>
                    {activeLayerId === layer.id && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* UTM CONVERTER TOOLBAR BUTTON */}
        <div className="absolute top-4 left-14 z-[1000] flex items-center gap-2">
          <button
            onClick={() => setIsUtmDialogOpen(true)}
            className="bg-white/95 backdrop-blur-xs hover:bg-white text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 shadow-md font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Buka UTM Converter & Input Koordinat"
          >
            <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-900 font-extrabold">UTM Converter</span>
          </button>

          {/* QUICK INSTRUCTIONS BANNER */}
          <div className="hidden md:block bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-900 shadow-xs">
            <span className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 text-slate-800">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
              </span>
              Double-Klik jika selesai menggambar jalur/area. Drag titik untuk mengubah geometri.
            </span>
          </div>
        </div>

        {/* MOUSE HOVER COORDINATES METRIC DISPLAY (UTM OR LAT/LNG STATUS BAR) */}
        {(() => {
          const currentHover = hoverCoords || internalHoverCoords;
          return (
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-xs text-slate-900 py-1.5 px-3.5 rounded-lg border border-slate-200 shadow-md flex items-center gap-2 font-mono text-[11px]">
              <Crosshair className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="text-slate-500 border-r border-slate-200 pr-2 font-bold uppercase tracking-wider text-[9px]">Kursor:</span>
              {currentHover ? (
                activeCoordMode === 'UTM' ? (
                  <span className="text-slate-900 font-extrabold">
                    {latLngToUtm(currentHover.lat, currentHover.lng).formatted}
                  </span>
                ) : (
                  <span className="text-slate-900 font-extrabold">
                    Lat: <span>{currentHover.lat.toFixed(6)}°</span>, Lng: <span>{currentHover.lng.toFixed(6)}°</span>
                  </span>
                )
              ) : (
                <span className="text-slate-500 font-medium italic">Pindahkan kursor di atas peta</span>
              )}

              <div className="h-3 w-px bg-slate-200 mx-1" />

              {/* TOGGLE COORDINATE MODE SWITCH BUTTON */}
              <button
                onClick={() => {
                  const nextMode: CoordinateMode = activeCoordMode === 'UTM' ? 'LatLng' : 'UTM';
                  setActiveCoordMode(nextMode);
                  onCoordinateModeChange?.(nextMode);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="Klik untuk Ganti Format Koordinat (UTM ↔ Lat/Lng)"
              >
                <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                <span>{activeCoordMode === 'UTM' ? 'UTM' : 'Lat/Lng'}</span>
              </button>
            </div>
          );
        })()}

        {/* UTM CONVERTER DIALOG */}
        <UtmConverterDialog
          isOpen={isUtmDialogOpen}
          onClose={() => setIsUtmDialogOpen(false)}
          onAddPoint={handleAddUtmPoint}
        />
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48 z-[9999]">
        <ContextMenuItem onClick={handleCopyCoordinates} className="cursor-pointer flex items-center gap-2">
          <Copy className="w-4 h-4 text-zinc-500" />
          <span className="font-medium">Salin Koordinat</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
