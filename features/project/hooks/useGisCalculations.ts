import { useCallback } from "react";
import {
  calculatePolygonArea,
  calculatePolygonPerimeter,
  calculateLineLength,
} from "@/lib/gis/gisCalc";
import { latLngToUtm, utmToLatLng } from "@/lib/gis/utm";

export function useGisCalculations() {
  const getUtmFromLatLng = useCallback((lat: number, lng: number) => {
    return latLngToUtm(lat, lng);
  }, []);

  const getLatLngFromUtm = useCallback(
    (easting: number, northing: number, zoneNumber: number, hemisphere: "north" | "south") => {
      return utmToLatLng(easting, northing, zoneNumber, hemisphere);
    },
    []
  );

  const computeAreaAndPerimeter = useCallback((latLngs: [number, number][]) => {
    if (!latLngs || latLngs.length < 3) {
      return { areaSqm: 0, perimeterMeters: 0 };
    }

    // Convert [lat, lng] to [lng, lat] for GIS calculations
    const coords = latLngs.map(([lat, lng]) => [lng, lat]);
    const areaSqm = calculatePolygonArea(coords);
    const perimeterMeters = calculatePolygonPerimeter(coords);

    return { areaSqm, perimeterMeters };
  }, []);

  const computeLineLength = useCallback((latLngs: [number, number][]) => {
    if (!latLngs || latLngs.length < 2) {
      return 0;
    }
    const coords = latLngs.map(([lat, lng]) => [lng, lat]);
    return calculateLineLength(coords);
  }, []);

  const formatArea = useCallback((areaSqm?: number) => {
    if (!areaSqm || areaSqm <= 0) return "-";
    if (areaSqm >= 10000) {
      return `${(areaSqm / 10000).toFixed(2)} Ha (${areaSqm.toLocaleString("id-ID")} m²)`;
    }
    return `${areaSqm.toLocaleString("id-ID")} m²`;
  }, []);

  const formatLength = useCallback((lengthMeters?: number) => {
    if (!lengthMeters || lengthMeters <= 0) return "-";
    if (lengthMeters >= 1000) {
      return `${(lengthMeters / 1000).toFixed(2)} km (${lengthMeters.toLocaleString("id-ID")} m)`;
    }
    return `${lengthMeters.toLocaleString("id-ID")} m`;
  }, []);

  return {
    getUtmFromLatLng,
    getLatLngFromUtm,
    computeAreaAndPerimeter,
    computeLineLength,
    formatArea,
    formatLength,
  };
}
