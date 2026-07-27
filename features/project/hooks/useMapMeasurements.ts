import L from 'leaflet';
import { useRef } from 'react';
import { getFlatLatLngs, formatSegmentDist } from '../utils/leafletHelpers';
import { formatDistance } from '@/lib/gis';

export function useMapMeasurements(
  mapInstanceRef: React.RefObject<L.Map | null>,
  measurementGroupRef: React.RefObject<L.LayerGroup | null>,
  focusedMeasurementGroupRef: React.RefObject<L.LayerGroup | null>
) {
  const drawingMeasureMarkersRef = useRef<L.Marker[]>([]);

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
        for (let i = 0; i < pts.length - 1; i++) {
          segments.push([pts[i], pts[i + 1]]);
        }
        if (pts.length >= 3) {
          segments.push([pts[pts.length - 1], pts[0]]);
        }
      } else if (isPolyline) {
        for (let i = 0; i < pts.length - 1; i++) {
          segments.push([pts[i], pts[i + 1]]);
        }
      }

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
          if (angle > 90 || angle < -90) angle += 180;
        }

        const labelIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center pointer-events-none" style="transform: translate(-50%, -50%) rotate(${angle}deg);">
              <div class="text-[11px] font-extrabold whitespace-nowrap z-1200 leading-none" style="color: #000000; text-shadow: 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff;">
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

  const updateDrawingMeasurements = (
    activeWorkingLayer: any,
    drawingType: string,
    mouseLatLng?: L.LatLng
  ) => {
    if (!activeWorkingLayer || !measurementGroupRef.current) return;

    clearDrawingMeasurements();

    try {
      const rawLatLngs = activeWorkingLayer.getLatLngs ? activeWorkingLayer.getLatLngs() : [];
      let pts = getFlatLatLngs(rawLatLngs);

      if (pts.length === 0 && mouseLatLng) {
        return;
      }

      const shape = drawingType || activeWorkingLayer.pm?.shape || activeWorkingLayer._shape || '';
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
          for (let i = 0; i < pts.length - 1; i++) {
            segments.push([pts[i], pts[i + 1]]);
          }
          if (mouseLatLng) {
            const lastPt = pts[pts.length - 1];
            const firstPt = pts[0];
            if (lastPt.distanceTo(mouseLatLng) > 0.5) {
              segments.push([lastPt, mouseLatLng]);
              if (firstPt.distanceTo(mouseLatLng) > 0.5) {
                segments.push([mouseLatLng, firstPt]);
              }
            } else if (pts.length >= 2) {
              segments.push([lastPt, firstPt]);
            }
          } else if (pts.length >= 3) {
            segments.push([pts[pts.length - 1], pts[0]]);
          }
        }
      } else {
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

      segments.forEach(([pA, pB]) => {
        const dist = pA.distanceTo(pB);
        if (dist < 0.2) return;

        const formatted = formatDistance(dist);
        const midLat = (pA.lat + pB.lat) / 2;
        const midLng = (pA.lng + pB.lng) / 2;
        const pos = L.latLng(midLat, midLng);

        let angle = 0;
        const map = mapInstanceRef.current;
        if (map) {
          const ptA = map.project(pA);
          const ptB = map.project(pB);
          angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);
          if (angle > 90 || angle < -90) angle += 180;
        }

        const labelIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center pointer-events-none" style="transform: translate(-50%, -50%) rotate(${angle}deg);">
              <div class="text-[10px] font-extrabold whitespace-nowrap z-1100 leading-none" style="color: #000000; text-shadow: 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff, 0px 0px 3px #ffffff;">
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

  return {
    clearDrawingMeasurements,
    clearFocusedMeasurements,
    updateFocusedMeasurementsForLayer,
    updateDrawingMeasurements,
  };
}
