import L from 'leaflet';

export const getFlatLatLngs = (latlngs: any): L.LatLng[] => {
  if (!latlngs) return [];
  
  if (latlngs instanceof L.LatLng) {
    return [latlngs];
  }
  
  if (typeof latlngs === 'object' && latlngs !== null && 'lat' in latlngs && 'lng' in latlngs) {
    return [L.latLng(latlngs.lat, latlngs.lng)];
  }
  
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

export const formatSegmentDist = (meters: number): string => {
  if (meters < 1000) {
    return `${meters.toFixed(2)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

export const createCustomPinIcon = (color: string = '#3b82f6'): L.DivIcon => {
  const pinSvgHtml = `
    <svg class="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" 
        fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
    </svg>
  `;
  
  return L.divIcon({
    html: pinSvgHtml,
    className: 'custom-pin-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};
