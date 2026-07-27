import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BASE_LAYERS } from '../constants/mapLayers.config';

export function useMapCanvasInit(mapContainerRef: React.RefObject<HTMLDivElement | null>) {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonGroupRef = useRef<L.FeatureGroup | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const measurementGroupRef = useRef<L.LayerGroup | null>(null);
  const focusedMeasurementGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeLayerId, setActiveLayerId] = useState<string>('carto-light');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-2.5, 118.0],
      zoom: 5,
      zoomControl: false,
      maxZoom: 24,
    });

    mapInstanceRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const group = L.featureGroup().addTo(map);
    geojsonGroupRef.current = group;

    const measurementGroup = L.layerGroup().addTo(map);
    measurementGroupRef.current = measurementGroup;

    const focusedGroup = L.layerGroup().addTo(map);
    focusedMeasurementGroupRef.current = focusedGroup;

    const defaultLayer = BASE_LAYERS.find(l => l.id === activeLayerId) || BASE_LAYERS[0];
    const tileLayer = L.tileLayer(defaultLayer.url, {
      attribution: defaultLayer.attribution,
      maxZoom: defaultLayer.maxZoom || 24,
      maxNativeZoom: defaultLayer.maxNativeZoom || 19,
    }).addTo(map);
    activeTileLayerRef.current = tileLayer;

    setIsMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      geojsonGroupRef.current = null;
      measurementGroupRef.current = null;
      focusedMeasurementGroupRef.current = null;
      activeTileLayerRef.current = null;
      setIsMapReady(false);
    };
  }, []);

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

  return {
    mapInstanceRef,
    geojsonGroupRef,
    measurementGroupRef,
    focusedMeasurementGroupRef,
    activeTileLayerRef,
    activeLayerId,
    showLayerMenu,
    setShowLayerMenu,
    isMapReady,
    handleBaseLayerSelect,
  };
}
