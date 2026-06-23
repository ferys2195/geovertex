import { FeatureCollection } from 'geojson';
import { MapSample } from '../types';

export const INDONESIA_SAMPLES: MapSample[] = [
  {
    name: "Kawasan Monas (Jakarta)",
    description: "Kawasan Monumen Nasional Jakarta. Contoh fitur Polygon untuk area dan Point untuk tugu.",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [106.8250, -6.1735],
                [106.8295, -6.1735],
                [106.8295, -6.1775],
                [106.8250, -6.1775],
                [106.8250, -6.1735]
              ]
            ]
          },
          properties: {
            id: "monas-park",
            name: "Pelataran Taman Monas",
            description: "Area ruang terbuka hijau di pusat Jakarta",
            color: "#16a34a"
          }
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [106.8272, -6.1754]
          },
          properties: {
            id: "monas-obelisk",
            name: "Tugu Monumen Nasional",
            description: "Tugu monumen bersejarah setinggi 132 meter",
            color: "#dc2626"
          }
        }
      ]
    }
  },
  {
    name: "Candi Borobudur (Magelang)",
    description: "Kompleks pusat candi Buddha terbesar di dunia. Struktur pelataran persegi.",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [110.2028, -7.6070],
                [110.2048, -7.6070],
                [110.2048, -7.6088],
                [110.2028, -7.6088],
                [110.2028, -7.6070]
              ]
            ]
          },
          properties: {
            id: "borobudur-main",
            name: "Pelataran Utama Borobudur",
            description: "Struktur candi pelataran bujur sangkar di tengah bukit",
            color: "#0891b2"
          }
        }
      ]
    }
  },
  {
    name: "Jalur Trekking Gunung Batur (Bali)",
    description: "Jalur pendakian fiktif/sampel dari lereng bawah hingga kawah Gunung Batur, Bali.",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [115.3850, -8.2520],
              [115.3820, -8.2480],
              [115.3780, -8.2450],
              [115.3750, -8.2420],
              [115.3730, -8.2400],
              [115.3735, -8.2380]
            ]
          },
          properties: {
            id: "batur-hike",
            name: "Jalur Trekking Batur",
            description: "Jalur pendakian reguler menuju kawah aktif utama",
            color: "#ea580c"
          }
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [115.3735, -8.2380]
          },
          properties: {
            id: "batur-peak",
            name: "Puncak Gunung Batur",
            description: "Ketinggian 1.717 mdpl",
            color: "#ca8a04"
          }
        }
      ]
    }
  }
];
