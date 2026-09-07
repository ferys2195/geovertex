import type { MapFeatureExportData } from "../types/project.types";

export interface ParsedGpxResult {
  fileName: string;
  features: MapFeatureExportData[];
  waypointsCount: number;
  tracksCount: number;
  routesCount: number;
}

export function parseGpxString(xmlContent: string, fileName = "Imported GPX"): ParsedGpxResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error("File GPX tidak valid atau memiliki format XML rusak.");
  }

  const features: MapFeatureExportData[] = [];
  let waypointsCount = 0;
  let tracksCount = 0;
  let routesCount = 0;

  const defaultNameBase = fileName.replace(/\.[^/.]+$/, "");

  // 1. Parse Waypoints (<wpt>)
  const waypoints = xmlDoc.getElementsByTagName("wpt");
  for (let i = 0; i < waypoints.length; i++) {
    const wpt = waypoints[i];
    const latStr = wpt.getAttribute("lat");
    const lonStr = wpt.getAttribute("lon");

    if (!latStr || !lonStr) continue;

    const lat = parseFloat(latStr);
    const lng = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lng)) continue;

    const nameNode = wpt.getElementsByTagName("name")[0];
    const descNode = wpt.getElementsByTagName("desc")[0];
    const eleNode = wpt.getElementsByTagName("ele")[0];

    const wptName = nameNode?.textContent?.trim() || `Waypoint ${waypointsCount + 1}`;
    const desc = descNode?.textContent?.trim() || "";
    const ele = eleNode?.textContent ? parseFloat(eleNode.textContent) : undefined;

    const id = `temp-gpx-wpt-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;

    features.push({
      id,
      type: "Marker",
      name: wptName,
      latLngs: [[lat, lng]],
      color: "#ef4444", // Red marker for GPX Waypoint
      isTemporary: true,
      sourceFormat: "gpx",
      properties: {
        id,
        name: wptName,
        description: desc,
        elevation: ele,
        gpxType: "waypoint",
        color: "#ef4444",
      },
    });
    waypointsCount++;
  }

  // 2. Parse Tracks (<trk>)
  const tracks = xmlDoc.getElementsByTagName("trk");
  for (let i = 0; i < tracks.length; i++) {
    const trk = tracks[i];
    const nameNode = trk.getElementsByTagName("name")[0];
    const trkName = nameNode?.textContent?.trim() || `${defaultNameBase} - Track ${tracksCount + 1}`;

    const trksegs = trk.getElementsByTagName("trkseg");
    for (let s = 0; s < trksegs.length; s++) {
      const trkseg = trksegs[s];
      const trkpts = trkseg.getElementsByTagName("trkpt");

      const latLngs: [number, number][] = [];
      for (let p = 0; p < trkpts.length; p++) {
        const pt = trkpts[p];
        const latStr = pt.getAttribute("lat");
        const lonStr = pt.getAttribute("lon");
        if (!latStr || !lonStr) continue;

        const lat = parseFloat(latStr);
        const lng = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lng)) {
          latLngs.push([lat, lng]);
        }
      }

      if (latLngs.length > 0) {
        const id = `temp-gpx-trk-${Date.now()}-${i}-${s}-${Math.random().toString(36).substring(2, 9)}`;
        features.push({
          id,
          type: "Polyline",
          name: trksegs.length > 1 ? `${trkName} (Seg ${s + 1})` : trkName,
          latLngs,
          color: "#3b82f6", // Blue polyline for GPX Track
          isTemporary: true,
          sourceFormat: "gpx",
          properties: {
            id,
            name: trkName,
            gpxType: "track",
            pointsCount: latLngs.length,
            color: "#3b82f6",
          },
        });
        tracksCount++;
      }
    }
  }

  // 3. Parse Routes (<rte>)
  const routes = xmlDoc.getElementsByTagName("rte");
  for (let i = 0; i < routes.length; i++) {
    const rte = routes[i];
    const nameNode = rte.getElementsByTagName("name")[0];
    const rteName = nameNode?.textContent?.trim() || `${defaultNameBase} - Route ${routesCount + 1}`;

    const rtepts = rte.getElementsByTagName("rtept");
    const latLngs: [number, number][] = [];

    for (let p = 0; p < rtepts.length; p++) {
      const pt = rtepts[p];
      const latStr = pt.getAttribute("lat");
      const lonStr = pt.getAttribute("lon");
      if (!latStr || !lonStr) continue;

      const lat = parseFloat(latStr);
      const lng = parseFloat(lonStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        latLngs.push([lat, lng]);
      }
    }

    if (latLngs.length > 0) {
      const id = `temp-gpx-rte-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;
      features.push({
        id,
        type: "Polyline",
        name: rteName,
        latLngs,
        color: "#ec4899", // Pink polyline for GPX Route
        isTemporary: true,
        sourceFormat: "gpx",
        properties: {
          id,
          name: rteName,
          gpxType: "route",
          pointsCount: latLngs.length,
          color: "#ec4899",
        },
      });
      routesCount++;
    }
  }

  if (features.length === 0) {
    throw new Error("File GPX tidak berisi data waypoint (<wpt>), track (<trk>), maupun rute (<rte>).");
  }

  return {
    fileName,
    features,
    waypointsCount,
    tracksCount,
    routesCount,
  };
}
