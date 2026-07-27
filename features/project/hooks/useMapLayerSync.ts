import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FeatureCollection } from 'geojson';
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance } from '@/lib/gis';
import { getFlatLatLngs, createCustomPinIcon } from '../utils/leafletHelpers';

interface UseMapLayerSyncOptions {
  mapInstanceRef: React.RefObject<L.Map | null>;
  geojsonGroupRef: React.RefObject<L.FeatureGroup | null>;
  isMapReady: boolean;
  geoJsonData?: FeatureCollection;
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
}

export function useMapLayerSync({
  mapInstanceRef,
  geojsonGroupRef,
  isMapReady,
  geoJsonData = { type: 'FeatureCollection', features: [] },
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
        <div class="p-2.5 text-xs font-sans min-w-[210px] space-y-2">
          <div class="flex items-center justify-between border-b border-zinc-200 pb-1.5 gap-2">
            <p class="font-bold text-zinc-900 text-sm truncate max-w-[130px] m-0">${name}</p>
            <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300 shrink-0">
              ${geomTypeBadge}
            </span>
          </div>
          ${desc ? `<p class="text-[11px] text-zinc-500 italic line-clamp-2 m-0">${desc}</p>` : ''}
          
          ${bodyHtml}

          <div class="pt-2 border-t border-zinc-200 grid grid-cols-3 gap-1">
            <button
              id="popup-pdf-${featureId}"
              type="button"
              title="Ekspor Laporan PDF Kartografi"
              class="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[10px] py-1.5 px-1 rounded shadow-xs transition-colors cursor-pointer"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span>PDF</span>
            </button>
            <button
              id="popup-edit-${featureId}"
              type="button"
              title="Ubah Atribut Bidang"
              class="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[10px] py-1.5 px-1 rounded shadow-xs transition-colors cursor-pointer"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              <span>Edit</span>
            </button>
            <button
              id="popup-del-${featureId}"
              type="button"
              title="Hapus Geometri Bidang"
              class="flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-[10px] py-1.5 px-1 rounded shadow-xs transition-colors cursor-pointer"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              <span>Hapus</span>
            </button>
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

    layer.on('popupopen', () => {
      const featureId = layer._pm_temp_id;
      setTimeout(() => {
        const btnPdf = document.getElementById(`popup-pdf-${featureId}`);
        if (btnPdf) {
          btnPdf.onclick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectPdfFeature(featureId);
            onOpenExportModal?.();
            layer.closePopup();
          };
        }

        const btnEdit = document.getElementById(`popup-edit-${featureId}`);
        if (btnEdit) {
          btnEdit.onclick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectPdfFeature(featureId);
            onEditFeature?.(featureId);
            layer.closePopup();
          };
        }

        const btnDel = document.getElementById(`popup-del-${featureId}`);
        if (btnDel) {
          btnDel.onclick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            layer.closePopup();
            if (window.confirm("Apakah Anda yakin ingin menghapus geometri bidang ini?")) {
              geojsonGroupRef.current?.removeLayer(layer);
              onDeleteFeature?.(featureId);
              syncMapToStateRef.current?.();
            }
          };
        }
      }, 50);
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
