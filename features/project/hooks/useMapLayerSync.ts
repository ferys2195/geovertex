import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import L from 'leaflet';
import { FeatureCollection } from 'geojson';
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance, latLngToUtm } from '@/lib/gis';
import { CoordinateMode } from '@/lib/types';
import { getFlatLatLngs, createCustomPinIcon } from '../utils/leafletHelpers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FeatureActionButtons } from '../components/FeatureActionButtons';

interface UseMapLayerSyncOptions {
  mapInstanceRef: React.RefObject<L.Map | null>;
  geojsonGroupRef: React.RefObject<L.FeatureGroup | null>;
  isMapReady: boolean;
  geoJsonData?: FeatureCollection;
  coordinateMode?: CoordinateMode;
  onGeoJsonChange?: (data: FeatureCollection) => void;
  selectedFeatureId: string | null;
  setSelectedFeatureId: (id: string | null) => void;
  selectedFeatureIdRef: React.MutableRefObject<string | null>;
  zoomToTrigger?: { id: string; time: number } | null;
  onSelectPdfFeature?: (id: string | null) => void;
  onOpenExportModal?: () => void;
  onDeleteFeature?: (id: string) => void;
  onEditFeature?: (id: string) => void;
  updateFocusedMeasurementsForLayer: (layer: any) => void;
  clearFocusedMeasurements: () => void;
  readOnly?: boolean;
}

export function useMapLayerSync({
  mapInstanceRef,
  geojsonGroupRef,
  isMapReady,
  geoJsonData = { type: 'FeatureCollection', features: [] },
  coordinateMode = 'UTM',
  onGeoJsonChange = () => {},
  selectedFeatureId,
  setSelectedFeatureId,
  selectedFeatureIdRef,
  zoomToTrigger,
  onSelectPdfFeature = () => {},
  onOpenExportModal,
  onDeleteFeature,
  onEditFeature,
  updateFocusedMeasurementsForLayer,
  clearFocusedMeasurements,
  readOnly = false,
}: UseMapLayerSyncOptions) {
  const mapGeoJsonStrRef = useRef<string>('');
  const isInternalUserActionRef = useRef<boolean>(false);
  const syncMapToStateRef = useRef<() => void>(() => {});

  const syncMapToState = () => {
    if (!geojsonGroupRef.current) return;

    isInternalUserActionRef.current = true;

    const features: any[] = [];
    const layers = geojsonGroupRef.current.getLayers();

    layers.forEach((layer: any) => {
      let geojson: any = null;

      if (typeof layer.toGeoJSON === 'function') {
        try {
          geojson = layer.toGeoJSON();
        } catch (err) {
          console.error('Error translating layer to GeoJSON:', err);
        }
      }

      if (geojson) {
        if (geojson.type === 'FeatureCollection') {
          return;
        }

        geojson.properties = geojson.properties || {};

        if (layer._pm_temp_id) {
          geojson.properties.id = layer._pm_temp_id;
        } else {
          layer._pm_temp_id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 11);
          geojson.properties.id = layer._pm_temp_id;
        }

        if (layer.feature && layer.feature.properties) {
          geojson.properties = {
            ...layer.feature.properties,
            ...geojson.properties,
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
      layer._pm_temp_id = props.id || (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 11));
    }

    const updatePopupContent = () => {
      let currentGeo: any = null;
      if (typeof layer.toGeoJSON === 'function') {
        try {
          currentGeo = layer.toGeoJSON();
        } catch {
          currentGeo = null;
        }
      }

      const featureId = layer._pm_temp_id;
      const name = props.name || layer.feature?.properties?.name || 'Geometri Lahan';
      const desc = props.description || layer.feature?.properties?.description || '';

      let geomTypeBadge = 'POLYGON';
      let bodyHtml = '';

      if (layer instanceof L.Polygon || currentGeo?.geometry?.type === 'Polygon') {
        geomTypeBadge = 'POLYGON';
        let latLngs: [number, number][] = [];
        if (currentGeo?.geometry?.coordinates?.[0]) {
          latLngs = (currentGeo.geometry.coordinates[0] as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
        } else {
          const pts = getFlatLatLngs(layer.getLatLngs ? layer.getLatLngs() : []);
          latLngs = pts.map((p) => [p.lat, p.lng] as [number, number]);
        }
        const area = calculatePolygonArea(latLngs);
        const perimeter = calculatePolygonPerimeter(latLngs);
        bodyHtml = `
          <div class="bg-emerald-50/80 p-2 rounded border border-emerald-200 text-xs font-mono space-y-0.5">
            <p class="text-emerald-700 font-extrabold text-xs m-0">Luas: ${formatArea(area)}</p>
            <p class="text-zinc-600 font-medium text-[11px] m-0">Keliling: ${formatDistance(perimeter)}</p>
          </div>
        `;
      } else if (layer instanceof L.Polyline || currentGeo?.geometry?.type === 'LineString') {
        geomTypeBadge = 'POLYLINE';
        let latLngs: [number, number][] = [];
        if (currentGeo?.geometry?.coordinates) {
          latLngs = (currentGeo.geometry.coordinates as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
        } else {
          const pts = getFlatLatLngs(layer.getLatLngs ? layer.getLatLngs() : []);
          latLngs = pts.map((p) => [p.lat, p.lng] as [number, number]);
        }
        const length = calculateLineLength(latLngs);
        bodyHtml = `
          <div class="bg-blue-50/80 p-2 rounded border border-blue-200 text-xs font-mono">
            <p class="text-blue-700 font-extrabold text-xs m-0">Panjang: ${formatDistance(length)}</p>
          </div>
        `;
      } else if (layer instanceof L.Marker || currentGeo?.geometry?.type === 'Point') {
        geomTypeBadge = 'MARKER';
        const pt = layer.getLatLng ? layer.getLatLng() : L.latLng(0, 0);
        bodyHtml = `
          <div class="bg-purple-50/80 p-2 rounded border border-purple-200 text-[11px] font-mono space-y-0.5 text-zinc-700">
            <p class="m-0">Lat: ${pt.lat.toFixed(6)}°</p>
            <p class="m-0">Lng: ${pt.lng.toFixed(6)}°</p>
          </div>
        `;
      }

      const tooltipHtml = `
        <div class="p-2.5 text-xs font-sans min-w-52.5 space-y-2">
          <div class="flex items-center justify-between border-b border-zinc-200 pb-1.5 gap-2">
            <p class="font-bold text-zinc-900 text-sm truncate max-w-32.5 m-0">${name}</p>
            <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300 shrink-0">
              ${geomTypeBadge}
            </span>
          </div>
          ${desc ? `<p class="text-[11px] text-zinc-500 italic line-clamp-2 m-0">${desc}</p>` : ''}
          
          ${bodyHtml}

          <div class="pt-2 border-t border-zinc-200 flex items-center justify-end">
            <div id="popup-actions-${featureId}"></div>
          </div>
        </div>
      `;

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

    let activeRoot: Root | null = null;

    layer.on('popupopen', () => {
      const featureId = layer._pm_temp_id;
      setTimeout(() => {
        const container = document.getElementById(`popup-actions-${featureId}`);
        if (container) {
          let currentGeo: any = null;
          if (typeof layer.toGeoJSON === 'function') {
            try {
              currentGeo = layer.toGeoJSON();
            } catch {
              currentGeo = null;
            }
          }
          const geom = currentGeo?.geometry || layer.feature?.geometry;

          activeRoot = createRoot(container);
          activeRoot.render(
            React.createElement(
              TooltipProvider,
              null,
              React.createElement(FeatureActionButtons, {
                featureId,
                geom,
                coordinateMode,
                onSelectPdfFeature: (id: string | null) => onSelectPdfFeature(id),
                onOpenExportModal,
                showZoom: false,
                onEditFeature: (id: string) => {
                  layer.closePopup();
                  onSelectPdfFeature(id);
                  onEditFeature?.(id);
                },
                onDeleteFeature: (id: string) => {
                  layer.closePopup();
                  geojsonGroupRef.current?.removeLayer(layer);
                  onDeleteFeature?.(id);
                  syncMapToStateRef.current?.();
                },
                isReadOnly: readOnly,
              })
            )
          );
        }
      }, 50);
    });

    layer.on('popupclose', () => {
      if (activeRoot) {
        try {
          activeRoot.unmount();
        } catch {}
        activeRoot = null;
      }
    });

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

    const handleLayerDragActive = () => {
      if (layer._pm_temp_id === selectedFeatureIdRef.current) {
        updateFocusedMeasurementsForLayer(layer);
      }
      updatePopupContent();
    };

    layer.on('pm:edit', handleLayerGeomChange);
    layer.on('pm:drag', handleLayerDragActive);
    layer.on('pm:markerdrag', handleLayerDragActive);
    layer.on('pm:dragend', handleLayerGeomChange);
    layer.on('pm:markerdragend', handleLayerGeomChange);
  };

  // Sync external geoJsonData to Leaflet map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = geojsonGroupRef.current;

    if (!isMapReady || !map || !group) return;

    const currentExternalStr = JSON.stringify(geoJsonData);

    if (isInternalUserActionRef.current) {
      isInternalUserActionRef.current = false;
      mapGeoJsonStrRef.current = currentExternalStr;
      return;
    }

    if (currentExternalStr === mapGeoJsonStrRef.current) {
      return;
    }

    const featureCount = geoJsonData?.features?.length ?? 0;
    console.log(`🗺️ [MapContainer Render] geoJsonData berubah, ${featureCount} fitur akan di-render ke canvas:`, geoJsonData);

    mapGeoJsonStrRef.current = currentExternalStr;
    group.clearLayers();

    if (geoJsonData && geoJsonData.features && featureCount > 0) {
      try {
        const geojsonLayer = L.geoJSON(geoJsonData, {
          style: (feature: any) => {
            const color = feature.properties?.color || '#3b82f6';
            return {
              color: color,
              fillColor: color,
              fillOpacity: 0.3,
              weight: 3,
            };
          },
          pointToLayer: (feature: any, latlng: L.LatLng) => {
            const color = feature.properties?.color || '#3b82f6';
            const icon = createCustomPinIcon(color);
            return L.marker(latlng, { icon });
          },
          onEachFeature: (feature: any, layer: any) => {
            bindLayerInteractiveListeners(layer, feature.properties || {});

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

        map.invalidateSize();

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

  // Handle zoomToTrigger from sidebar
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !zoomToTrigger) return;

    const layers = geojsonGroupRef.current?.getLayers() || [];
    let targetLayer: any = null;

    layers.forEach((layer: any) => {
      if (layer.getLayers) {
        layer.getLayers().forEach((subLayer: any) => {
          if (
            subLayer._pm_temp_id === zoomToTrigger.id ||
            subLayer.feature?.properties?.id === zoomToTrigger.id
          ) {
            targetLayer = subLayer;
          }
        });
      } else if (
        layer._pm_temp_id === zoomToTrigger.id ||
        layer.feature?.properties?.id === zoomToTrigger.id
      ) {
        targetLayer = layer;
      }
    });

    if (targetLayer) {
      setSelectedFeatureId(zoomToTrigger.id);
      if (typeof targetLayer.getLatLng === 'function' && !(targetLayer instanceof L.Polygon || targetLayer instanceof L.Polyline)) {
        map.flyTo(targetLayer.getLatLng(), 16, { animate: true, duration: 1.2 });
        targetLayer.openPopup?.();
      } else if (typeof targetLayer.getBounds === 'function') {
        const bounds = targetLayer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1.2 });
          targetLayer.openPopup?.();
        }
      }
    }
  }, [zoomToTrigger]);

  // Update focused segment measurements when selectedFeatureId changes
  useEffect(() => {
    const group = geojsonGroupRef.current;
    if (!group) return;

    if (!selectedFeatureId) {
      clearFocusedMeasurements();
      return;
    }

    let foundLayer: any = null;
    const layers = group.getLayers();

    layers.forEach((layer: any) => {
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

  return {
    syncMapToState,
    bindLayerInteractiveListeners,
  };
}
