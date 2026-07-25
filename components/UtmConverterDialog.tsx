"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, ArrowRightLeft, MapPin, Check, Plus } from "lucide-react";
import { latLngToUtm, utmToLatLng } from "@/lib/utm";

interface UtmConverterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoint: (lat: number, lng: number, name: string, description: string, color?: string) => void;
}

export function UtmConverterDialog({ isOpen, onClose, onAddPoint }: UtmConverterDialogProps) {
  // Latitude / Longitude
  const [lat, setLat] = useState<string>("-6.1754");
  const [lng, setLng] = useState<string>("106.8272");

  // UTM
  const [zone, setZone] = useState<string>("48");
  const [letter, setLetter] = useState<string>("M");
  const [easting, setEasting] = useState<string>("702410.5");
  const [northing, setNorthing] = useState<string>("9316982.1");

  // Point Attributes
  const [name, setName] = useState<string>("Titik Pengukuran");
  const [description, setDescription] = useState<string>("Koordinat hasil kalkulasi UTM");
  const [color, setColor] = useState<string>("#3b82f6");

  // Convert LatLng -> UTM
  const handleConvertLatLngToUtm = () => {
    const latVal = parseFloat(lat);
    const lngVal = parseFloat(lng);

    if (isNaN(latVal) || isNaN(lngVal) || latVal < -90 || latVal > 90 || lngVal < -180 || lngVal > 180) {
      alert("Masukkan koordinat Latitude [-90..90] dan Longitude [-180..180] yang valid!");
      return;
    }

    try {
      const result = latLngToUtm(latVal, lngVal);
      setEasting(result.easting.toString());
      setNorthing(result.northing.toString());
      setZone(result.zoneNumber.toString());
      setLetter(result.zoneLetter);
    } catch (e) {
      alert("Gagal mengonversi LatLng ke UTM.");
    }
  };

  // Convert UTM -> LatLng
  const handleConvertUtmToLatLng = () => {
    const eVal = parseFloat(easting);
    const nVal = parseFloat(northing);
    const zVal = parseInt(zone);
    const lVal = letter.trim().toUpperCase();

    if (isNaN(eVal) || isNaN(nVal) || isNaN(zVal) || !lVal) {
      alert("Masukkan parameter UTM (Zone, Letter, Easting, Northing) yang lengkap!");
      return;
    }

    try {
      const result = utmToLatLng(eVal, nVal, zVal, lVal);
      if (isNaN(result.lat) || isNaN(result.lng)) {
        throw new Error("Hasil konversi tidak valid.");
      }
      setLat(result.lat.toFixed(6));
      setLng(result.lng.toFixed(6));
    } catch (e) {
      alert("Gagal mengonversi UTM ke LatLng. Mohon periksa kembali Zona, Easting, dan Northing.");
    }
  };

  // Add Point to Map
  const handleAddPointToMap = () => {
    const latVal = parseFloat(lat);
    const lngVal = parseFloat(lng);

    if (isNaN(latVal) || isNaN(lngVal) || latVal < -90 || latVal > 90 || lngVal < -180 || lngVal > 180) {
      alert("Gagal: Konversi koordinat ke Lat/Lng terlebih dahulu sebelum menambahkan ke peta.");
      return;
    }

    onAddPoint(latVal, lngVal, name, description, color);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Calculator className="w-5 h-5 text-blue-400" />
            UTM Converter &amp; Input Koordinat
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Konversi real-time antara Latitude/Longitude (WGS84) dan UTM (Easting/Northing).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Lat / Lng Section */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Koordinat Geografis (Lat / Lng)</span>
              <Button variant="outline" size="sm" onClick={handleConvertLatLngToUtm} className="h-6 text-[10px] border-slate-700 bg-slate-900 text-blue-400 hover:text-white">
                <ArrowRightLeft className="w-3 h-3 mr-1" /> Ke UTM
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Latitude (Y)</label>
                <Input value={lat} onChange={(e) => setLat(e.target.value)} className="h-7 text-xs bg-slate-900 border-slate-800 font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Longitude (X)</label>
                <Input value={lng} onChange={(e) => setLng(e.target.value)} className="h-7 text-xs bg-slate-900 border-slate-800 font-mono" />
              </div>
            </div>
          </div>

          {/* UTM Section */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Koordinat UTM (Proyeksi)</span>
              <Button variant="outline" size="sm" onClick={handleConvertUtmToLatLng} className="h-6 text-[10px] border-slate-700 bg-slate-900 text-emerald-400 hover:text-white">
                <ArrowRightLeft className="w-3 h-3 mr-1" /> Ke LatLng
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Zona</label>
                <Input value={zone} onChange={(e) => setZone(e.target.value)} className="h-7 text-xs bg-slate-900 border-slate-800 font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Band/Letter</label>
                <Input value={letter} onChange={(e) => setLetter(e.target.value)} className="h-7 text-xs bg-slate-900 border-slate-800 font-mono uppercase" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Easting (X)</label>
                <Input value={easting} onChange={(e) => setEasting(e.target.value)} className="h-7 text-xs bg-slate-900 border-slate-800 font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Northing (Y)</label>
                <Input value={northing} onChange={(e) => setNorthing(e.target.value)} className="h-7 text-xs bg-slate-900 border-slate-800 font-mono" />
              </div>
            </div>
          </div>

          {/* Point Attr */}
          <div className="space-y-2 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nama Titik / Marker</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs bg-slate-950 border-slate-800" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Deskripsi Titik</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 text-xs bg-slate-950 border-slate-800" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">Warna Marker</label>
              <div className="flex gap-1.5">
                {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: hex }}
                  >
                    {color === hex && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="border-slate-800 text-xs">
            Batal
          </Button>
          <Button onClick={handleAddPointToMap} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Titik ke Peta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
