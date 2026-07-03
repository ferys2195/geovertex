"use client";

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { CoordinateMode } from '@/lib/types';
import { FeatureCollection } from 'geojson';
import { latLngToUtm } from '@/lib/utm';
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance } from '@/lib/gisCalc';
import { Layers, Crosshair, MapPin, Maximize2, Copy } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MapContainerProps {
  geoJsonData: FeatureCollection;
  onGeoJsonChange: (data: FeatureCollection) => void;
  coordinateMode: CoordinateMode;
  hoverCoords: { lat: number; lng: number } | null;
  setHoverCoords: (coords: { lat: number; lng: number } | null) => void;
  zoomToTrigger: { id: string; time: number } | null;
}

// Map Base Layers configurations
const BASE_LAYERS = [
  {
    id: 'osm',
    name: 'Standard OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  {
    id: 'satellite',
    name: 'Esri Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  {
    id: 'carto-dark',
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: 'carto-light',
    name: 'CartoDB Positron (Minimal)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: 'topo',
    name: 'OpenTopoMap (Kontur)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Kartendaten: &copy; OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: &copy; OpenTopoMap (CC-BY-SA)',
  }
];

export default function MapContainer({
  geoJsonData,
  onGeoJsonChange,
  coordinateMode,
  hoverCoords,
  setHoverCoords,
  zoomToTrigger
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonGroupRef = useRef<L.FeatureGroup | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>('carto-light');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [rightClickCoords, setRightClickCoords] = useState<{ lat: number; lng: number } | null>(null);

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
      maxZoom: 24,
      maxNativeZoom: 19
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

    // 3. Event Listeners for Map Drawing
    const syncMapToState = () => {
      if (!geojsonGroupRef.current) return;
      
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
          geojson.properties = geojson.properties || {};
          
          // Re-embed ID
          if (layer._pm_temp_id) {
            geojson.properties.id = layer._pm_temp_id;
          } else {
            layer._pm_temp_id = Math.random().toString(36).substring(2, 11);
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

      const serialized = JSON.stringify(updatedCollection);
      mapGeoJsonStrRef.current = serialized;
      onGeoJsonChange(updatedCollection);
    };

    // Callback on shape creation
    map.on('pm:create', (e: any) => {
      const layer = e.layer;
      
      // Auto assign unique Geoman temp ID
      layer._pm_temp_id = Math.random().toString(36).substring(2, 11);
      
      // Setup initial styles if any
      if (layer instanceof L.Path) {
        layer.setStyle({
          color: '#34d399', // Emerald hue outline
          fillColor: '#34d399',
          fillOpacity: 0.35,
          weight: 3
        });
      }

      // Add to main feature group
      geojsonGroupRef.current?.addLayer(layer);

      // Setup event listeners for editing on this newly created layer
      layer.on('pm:edit', syncMapToState);
      layer.on('pm:dragend', syncMapToState);
      layer.on('pm:remove', () => {
        geojsonGroupRef.current?.removeLayer(layer);
        syncMapToState();
      });

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
      setHoverCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      if (activeWorkingLayerRef.current) {
        updateDrawingMeasurements(e.latlng);
      }
    });

    map.on('mouseout', () => {
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
    if (!map || !group) return;

    const currentExternalStr = JSON.stringify(geoJsonData);
    
    // Skip if identical to what's already on the map to prevent focus loss & infinite loops
    if (currentExternalStr === mapGeoJsonStrRef.current) {
      return;
    }

    // Update track reference
    mapGeoJsonStrRef.current = currentExternalStr;

    // Clear and Redraw
    group.clearLayers();

    if (geoJsonData && geoJsonData.features) {
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
          
          // Generate a beautifully styled SVG marker wrapper
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
          // Sync internal Geoman ID
          layer._pm_temp_id = feature.properties?.id || Math.random().toString(36).substring(2, 11);

          // Calculate measurement tooltips and bind them
          const updatePopupContent = () => {
            let tooltipHtml = '';
            let currentGeo: any = null;
            if (typeof layer.toGeoJSON === 'function') {
              currentGeo = layer.toGeoJSON();
            } else {
              currentGeo = feature;
            }

            const geomType = currentGeo.geometry?.type;
            const name = feature.properties?.name || 'Titik Tanpa Nama';
            const desc = feature.properties?.description || '';

            if (geomType === 'Polygon') {
              const coords = currentGeo.geometry.coordinates[0];
              const area = calculatePolygonArea(coords);
              const perimeter = calculatePolygonPerimeter(coords);
              tooltipHtml = `
                <div class="p-1.5 text-xs font-sans">
                  <p class="font-bold text-zinc-800">${name}</p>
                  ${desc ? `<p class="text-[10px] text-zinc-500 mb-1">${desc}</p>` : ''}
                  <hr class="my-1 border-zinc-200" />
                  <p class="text-[11px] text-emerald-600 font-bold">Luas: ${formatArea(area)}</p>
                  <p class="text-[10px] text-zinc-600">Keliling: ${formatDistance(perimeter)}</p>
                </div>
              `;
            } else if (geomType === 'LineString') {
              const coords = currentGeo.geometry.coordinates;
              const length = calculateLineLength(coords);
              tooltipHtml = `
                <div class="p-1.5 text-xs font-sans">
                  <p class="font-bold text-zinc-800">${name}</p>
                  ${desc ? `<p class="text-[10px] text-zinc-500 mb-1">${desc}</p>` : ''}
                  <hr class="my-1 border-zinc-200" />
                  <p class="text-[11px] text-blue-600 font-bold font-mono">Panjang: ${formatDistance(length)}</p>
                </div>
              `;
            } else if (geomType === 'Point') {
              const coords = currentGeo.geometry.coordinates;
              tooltipHtml = `
                <div class="p-1.5 text-xs font-sans">
                  <p class="font-bold text-zinc-800">${name}</p>
                  ${desc ? `<p class="text-[10px] text-zinc-500 mb-1">${desc}</p>` : ''}
                  <hr class="my-1 border-zinc-200" />
                  <p class="text-[10px] text-zinc-650 font-mono">Lat: ${coords[1].toFixed(5)}</p>
                  <p class="text-[10px] text-zinc-650 font-mono">Lng: ${coords[0].toFixed(5)}</p>
                </div>
              `;
            }

            if (tooltipHtml) {
              const popup = layer.getPopup();
              if (popup) {
                layer.setPopupContent(tooltipHtml);
              } else {
                layer.bindPopup(tooltipHtml);
              }
            }
          };

          // Initial setup
          updatePopupContent();

          // Layer click focus listener
          layer.on('click', (e: L.LeafletMouseEvent) => {
            // Prevent map-wide click de-selection from firing instantly
            L.DomEvent.stopPropagation(e);
            setSelectedFeatureId(layer._pm_temp_id);
          });

          // Interactive updates on shape changes (marker drag, drag, vertex adjustments)
          const handleLayerGeomChange = () => {
            if (layer._pm_temp_id === selectedFeatureIdRef.current) {
              updateFocusedMeasurementsForLayer(layer);
            }
            updatePopupContent();
          };
          layer.on('pm:edit', handleLayerGeomChange);
          layer.on('pm:drag', handleLayerGeomChange);
          layer.on('pm:markerdrag', handleLayerGeomChange);
          layer.on('pm:dragend', handleLayerGeomChange);

          // Attach Geoman listeners back to manually imported layers
          layer.on('pm:edit', () => {
            const currentFeatures: any[] = [];
            group.getLayers().forEach((l: any) => {
              if (typeof l.toGeoJSON === 'function') {
                const geo = l.toGeoJSON();
                geo.properties = geo.properties || {};
                geo.properties.id = l._pm_temp_id;
                
                if (l.feature && l.feature.properties) {
                  geo.properties = { ...l.feature.properties, ...geo.properties };
                }
                currentFeatures.push(geo);
              }
            });
            const updated: FeatureCollection = { type: 'FeatureCollection', features: currentFeatures };
            mapGeoJsonStrRef.current = JSON.stringify(updated);
            onGeoJsonChange(updated);
          });

          layer.on('pm:dragend', () => {
            const currentFeatures: any[] = [];
            group.getLayers().forEach((l: any) => {
              if (typeof l.toGeoJSON === 'function') {
                const geo = l.toGeoJSON();
                geo.properties = geo.properties || {};
                geo.properties.id = l._pm_temp_id;
                if (l.feature && l.feature.properties) {
                  geo.properties = { ...l.feature.properties, ...geo.properties };
                }
                currentFeatures.push(geo);
              }
            });
            const updated: FeatureCollection = { type: 'FeatureCollection', features: currentFeatures };
            mapGeoJsonStrRef.current = JSON.stringify(updated);
            onGeoJsonChange(updated);
          });

          layer.on('pm:remove', () => {
            group.removeLayer(layer);
            
            const currentFeatures: any[] = [];
            group.getLayers().forEach((l: any) => {
              if (typeof l.toGeoJSON === 'function') {
                const geo = l.toGeoJSON();
                geo.properties = geo.properties || {};
                geo.properties.id = l._pm_temp_id;
                if (l.feature && l.feature.properties) {
                  geo.properties = { ...l.feature.properties, ...geo.properties };
                }
                currentFeatures.push(geo);
              }
            });
            const updated: FeatureCollection = { type: 'FeatureCollection', features: currentFeatures };
            mapGeoJsonStrRef.current = JSON.stringify(updated);
            onGeoJsonChange(updated);
          });
        }
      });

      // Add to map viewport as flat layers to prevent Geoman nesting issues
      geojsonLayer.eachLayer((layer: any) => {
        group.addLayer(layer);
      });
    }
  }, [geoJsonData]);

  // 2. Respond to sidebar center zoom trigger (Eye icon klik)
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
      if (targetLayer instanceof L.Marker) {
        map.setView(targetLayer.getLatLng(), 15, { animate: true });
        targetLayer.openPopup();
      } else if (targetLayer instanceof L.Polyline || targetLayer instanceof L.Polygon) {
        map.fitBounds(targetLayer.getBounds(), { padding: [50, 50], maxZoom: 15, animate: true });
        targetLayer.openPopup();
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
      maxZoom: 24,
      maxNativeZoom: 19
    }).addTo(map);

    activeTileLayerRef.current = nextTileLayer;
    setActiveLayerId(layerId);
    setShowLayerMenu(false);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex-1 relative h-full block">
        {/* MAP MOUNT ELEMENT CONTAINER */}
          <div 
            ref={mapContainerRef} 
            id="map" 
            className="w-full h-full text-zinc-900 border-none select-none z-[1]"
          />

      {/* CUSTOM FLOATING BASELAYERS SWITCHER CARD BUTTON */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-2 p-2.5 bg-white hover:bg-zinc-50 text-zinc-850 rounded-lg shadow-sm border border-zinc-200/90 transition font-semibold text-xs cursor-pointer focus:outline-none"
            title="Ubah Peta Dasar"
          >
            <Layers className="w-4 h-4 text-zinc-600" />
            <span>Peta Dasar</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-md p-2.5 space-y-1 z-[1010]">
              <div className="px-2 py-1 border-b border-zinc-100 mb-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Daftar Peta Dasar</span>
              </div>
              
              {BASE_LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => handleBaseLayerSelect(layer.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                    activeLayerId === layer.id
                      ? 'bg-zinc-100 text-zinc-950 font-bold shadow-xs'
                      : 'hover:bg-zinc-50 text-zinc-600'
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

      {/* QUICK INSTRUCTIONS BANNER */}
      <div className="absolute top-4 left-16 z-[1000] hidden sm:block">
        <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-md border border-zinc-200/80 flex items-center gap-2 text-zinc-800 shadow-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-950"></span>
          </span>
          <span className="text-[10px] font-bold tracking-wide">
            Double-Klik jika selesai menggambar jalur/area. Drag titik untuk mengubah geometri.
          </span>
        </div>
      </div>

      {/* MOUSE HOVER COORDINATES METRIC DISPLAY (UTM OR LAT/LNG STATUS BAR) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-xs text-zinc-850 py-1.5 px-3.5 rounded-lg border border-zinc-200/80 shadow-md flex items-center gap-2 font-mono text-[11px]">
        <Crosshair className="w-3.5 h-3.5 text-zinc-650 animate-pulse" />
        <span className="text-zinc-400 border-r border-zinc-150 pr-2 font-bold uppercase tracking-wider text-[9px]">Kursor:</span>
        {hoverCoords ? (
          coordinateMode === 'UTM' ? (
            <span className="text-zinc-900 font-extrabold">
              {latLngToUtm(hoverCoords.lat, hoverCoords.lng).formatted}
            </span>
          ) : (
            <span className="text-zinc-900 font-extrabold">
              Lat: <span>{hoverCoords.lat.toFixed(6)}°</span>, Lng: <span>{hoverCoords.lng.toFixed(6)}°</span>
            </span>
          )
        ) : (
          <span className="text-zinc-400 italic">Pindahkan kursor di atas peta</span>
        )}
      </div>
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
