import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  MapPin, 
  TableProperties, 
  Trash2, 
  Eye, 
  Palette, 
  AlertTriangle, 
  Check, 
  Edit3, 
  PlusCircle, 
  Calculator,
  Compass,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FeatureCollection, Feature } from 'geojson';
import { CoordinateMode, GisFeatureProperties } from '../types';
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance } from '../utils/gisCalc';
import { latLngToUtm, utmToLatLng } from '../utils/utm';

interface SidebarProps {
  geoJsonData: FeatureCollection;
  onUpdateGeoJSON: (data: FeatureCollection) => void;
  coordinateMode: CoordinateMode;
  onZoomToFeature: (featureId: string) => void;
  onDeleteFeature: (featureId: string) => void;
  onUpdateFeatureProperties: (featureId: string, properties: GisFeatureProperties) => void;
  onAddPoint: (lat: number, lng: number, name: string, description: string, color?: string) => void;
}

type ActiveTab = 'editor' | 'features' | 'calculator';

export default function Sidebar({
  geoJsonData,
  onUpdateGeoJSON,
  coordinateMode,
  onZoomToFeature,
  onDeleteFeature,
  onUpdateFeatureProperties,
  onAddPoint
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('features');
  const [rawText, setRawText] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('#3b82f6');

  // Manual Coordinates State
  // Latitude / Longitude
  const [manualLat, setManualLat] = useState<string>('-6.1754');
  const [manualLng, setManualLng] = useState<string>('106.8272');
  // UTM
  const [manualZone, setManualZone] = useState<string>('48');
  const [manualLetter, setManualLetter] = useState<string>('M');
  const [manualEasting, setManualEasting] = useState<string>('702410.5');
  const [manualNorthing, setManualNorthing] = useState<string>('9316982.1');
  const [manualName, setManualName] = useState<string>('Titik Pengukuran');
  const [manualDesc, setManualDesc] = useState<string>('Koordinat hasil kalkulasi');
  const [manualColor, setManualColor] = useState<string>('#3b82f6');

  // Load GeoJSON to text editor when updated from map
  useEffect(() => {
    setRawText(JSON.stringify(geoJsonData, null, 2));
    setIsValidJson(true);
  }, [geoJsonData]);

  const handleTextChange = (text: string) => {
    setRawText(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed && (parsed.type === 'FeatureCollection' || parsed.type === 'Feature')) {
        setIsValidJson(true);
      } else {
        setIsValidJson(false);
      }
    } catch {
      setIsValidJson(false);
    }
  };

  const handleApplyEditor = () => {
    try {
      const parsed = JSON.parse(rawText);
      onUpdateGeoJSON(parsed);
      alert('GeoJSON sukses diperbarui dan dirender ke peta!');
    } catch (err: any) {
      alert(`Gagal menerapkan GeoJSON: ${err.message}`);
    }
  };

  const handleFormatEditor = () => {
    try {
      const parsed = JSON.parse(rawText);
      setRawText(JSON.stringify(parsed, null, 2));
      setIsValidJson(true);
    } catch {
      alert('Gagal merapikan JSON. Pastikan sintaks valid dahulu.');
    }
  };

  const handleStartEditFeature = (feature: Feature) => {
    const props = (feature.properties || {}) as GisFeatureProperties;
    setEditingId(props.id);
    setEditName(props.name || 'Fitur Tanpa Nama');
    setEditDesc(props.description || '');
    setEditColor(props.color || '#3b82f6');
  };

  const handleSaveFeature = (id: string) => {
    onUpdateFeatureProperties(id, {
      id,
      name: editName,
      description: editDesc,
      color: editColor
    });
    setEditingId(null);
  };

  // Convert LatLng fields to UTM fields
  const handleLatLngToUtmCalc = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Masukkan Koordinat LatLng yang valid (Lat: -90 s/d 90, Lng: -180 s/d 180)');
      return;
    }
    const result = latLngToUtm(lat, lng);
    setManualZone(result.zoneNumber.toString());
    setManualLetter(result.zoneLetter);
    setManualEasting(result.easting.toFixed(1));
    setManualNorthing(result.northing.toFixed(1));
  };

  // Convert UTM fields to LatLng fields
  const handleUtmToLatLngCalc = () => {
    const easting = parseFloat(manualEasting);
    const northing = parseFloat(manualNorthing);
    const zone = parseInt(manualZone);
    const letter = manualLetter.trim().toUpperCase();

    if (isNaN(easting) || isNaN(northing) || isNaN(zone) || !letter) {
      alert('Masukkan parameter UTM yang lengkap dan valid!');
      return;
    }

    try {
      const result = utmToLatLng(easting, northing, zone, letter);
      if (isNaN(result.lat) || isNaN(result.lng)) {
        throw new Error('Hasil konversi bermasalah.');
      }
      setManualLat(result.lat.toFixed(6));
      setManualLng(result.lng.toFixed(6));
    } catch (e) {
      alert('Gagal mengonversi koordinat UTM ke LatLng. Mohon periksa kembali Zona, Easting, dan Northing.');
    }
  };

  // Submit Point from manual coord calculator
  const handleAddManualPoint = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Gagal: Pastikan nilai Latitude dan Longitude telah dikonversi secara valid sebelum ditambahkan.');
      return;
    }

    onAddPoint(lat, lng, manualName, manualDesc, manualColor);
    alert(`Titik "${manualName}" berhasil ditambahkan ke peta!`);
  };

  // Calculate statistics
  const totalFeatures = geoJsonData.features.length;
  const polyFeatures = geoJsonData.features.filter(f => f.geometry?.type === 'Polygon');
  const lineFeatures = geoJsonData.features.filter(f => f.geometry?.type === 'LineString');
  const pointFeatures = geoJsonData.features.filter(f => f.geometry?.type === 'Point');

  // Sum total length of all polylines
  const totalLineLength = lineFeatures.reduce((acc, f) => {
    if (f.geometry?.type === 'LineString') {
      return acc + calculateLineLength(f.geometry.coordinates);
    }
    return acc;
  }, 0);

  // Sum total area of all polygons
  const totalPolygonArea = polyFeatures.reduce((acc, f) => {
    if (f.geometry?.type === 'Polygon') {
      return acc + calculatePolygonArea(f.geometry.coordinates[0]);
    }
    return acc;
  }, 0);

  return (
    <aside id="sidebar-container" className="w-full lg:w-[480px] h-full bg-white border-r border-zinc-200 flex flex-col z-[1000] shadow-sm shrink-0">
      
      {/* Tabs list header */}
      <div className="flex bg-zinc-50 p-2 border-b border-zinc-200 gap-1.5">
        <button
          onClick={() => setActiveTab('features')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'features'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50'
          }`}
        >
          <TableProperties className="w-4 h-4" />
          <span>Fitur &amp; Statistik</span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'editor'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>GeoJSON Raw</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'calculator'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>UTM Converter</span>
        </button>
      </div>

      {/* Main Tab Content viewports */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* TAB 1: FEATURES AND MEASUREMENTS LIST */}
        {activeTab === 'features' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Quick Statistics Overview Card */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80 grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-white rounded-lg border border-zinc-150 shadow-xs">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Poligon</span>
                <span className="text-base font-extrabold text-zinc-950 mt-0.5 block">{polyFeatures.length}</span>
                <span className="text-[9px] text-zinc-500 font-medium truncate block">{formatArea(totalPolygonArea)}</span>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-zinc-150 shadow-xs">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Polyline</span>
                <span className="text-base font-extrabold text-zinc-950 mt-0.5 block">{lineFeatures.length}</span>
                <span className="text-[9px] text-zinc-500 font-medium truncate block">{formatDistance(totalLineLength)}</span>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-zinc-150 shadow-xs">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Titik</span>
                <span className="text-base font-extrabold text-zinc-950 mt-0.5 block">{pointFeatures.length}</span>
                <span className="text-[9px] text-zinc-500 font-medium truncate block">Total: {totalFeatures}</span>
              </div>
            </div>

            {/* List of Features */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Daftar Geometri ({totalFeatures})</span>
                {totalFeatures === 0 && <span className="text-[10px] text-zinc-400 lowercase font-normal italic">Gunakan toolbar peta untuk menggambar</span>}
              </h3>

              {totalFeatures === 0 ? (
                <div className="text-center py-12 px-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl space-y-2">
                  <Compass className="w-8 h-8 text-zinc-450 text-zinc-400 mx-auto stroke-[1.2]" />
                  <p className="text-xs font-bold text-zinc-700">Peta masih kosong.</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    Gunakan instrumen gambar di panel kiri atas peta untuk membuat Poligon, Garis (Polyline), atau Waypoint secara interaktif.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {geoJsonData.features.map((feature, idx) => {
                      const props = (feature.properties || {}) as GisFeatureProperties;
                      const featureId = props.id || `f-${idx}`;
                      const type = feature.geometry?.type;
                      const isEditing = editingId === featureId;

                      // Measures calculations
                      let areaStr = '';
                      let perimeterStr = '';
                      let lengthStr = '';
                      let posStr = '';

                      if (type === 'Polygon' && feature.geometry) {
                        const coords = (feature.geometry as any).coordinates[0];
                        const areaVal = calculatePolygonArea(coords);
                        const perimeterVal = calculatePolygonPerimeter(coords);
                        areaStr = formatArea(areaVal);
                        perimeterStr = formatDistance(perimeterVal);
                      } else if (type === 'LineString' && feature.geometry) {
                        const coords = (feature.geometry as any).coordinates;
                        const lenVal = calculateLineLength(coords);
                        lengthStr = formatDistance(lenVal);
                      } else if (type === 'Point' && feature.geometry) {
                        const coords = (feature.geometry as any).coordinates;
                        if (coordinateMode === 'UTM') {
                          posStr = latLngToUtm(coords[1], coords[0]).formatted;
                        } else {
                          posStr = `Lat: ${coords[1].toFixed(5)}°, Lng: ${coords[0].toFixed(5)}°`;
                        }
                      }

                      const borderTheme = type === 'Polygon' 
                        ? 'border-zinc-200 border-l-3 border-l-emerald-500' 
                        : type === 'LineString' 
                        ? 'border-zinc-200 border-l-3 border-l-blue-500' 
                        : 'border-zinc-200 border-l-3 border-l-amber-500';

                      const badgeTheme = type === 'Polygon'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                        : type === 'LineString'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/50';

                      return (
                        <motion.div
                          key={featureId}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`bg-zinc-50 border rounded-lg p-3 space-y-2.5 transition-all hover:bg-zinc-100/30 ${borderTheme}`}
                        >
                          {/* Inner properties details */}
                          {isEditing ? (
                            <div className="space-y-2.5 bg-white p-3 rounded-lg border border-zinc-200 shadow-xs">
                              <div>
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Nama Fitur</label>
                                <input 
                                  type="text" 
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-zinc-50 text-xs text-zinc-800 border border-zinc-200 rounded px-2.5 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-zinc-900 animate-none" 
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Keterangan / Deskripsi</label>
                                <textarea 
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  className="w-full bg-zinc-50 text-xs text-zinc-800 border border-zinc-200 rounded px-2.5 py-1.5 mt-1 h-14 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900" 
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Warna Geometri</span>
                                <div className="flex gap-1.5 mt-1">
                                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((hex) => (
                                    <button
                                      key={hex}
                                      onClick={() => setEditColor(hex)}
                                      className="w-4.5 h-4.5 rounded-full border border-zinc-100 flex items-center justify-center cursor-pointer"
                                      style={{ backgroundColor: hex }}
                                    >
                                      {editColor === hex && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-semibold text-[11px] rounded transition cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  onClick={() => handleSaveFeature(featureId)}
                                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 text-white text-[11px] font-bold rounded transition cursor-pointer"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {/* Header Card */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-xs text-zinc-900">
                                      {props.name || `Geometri ${idx + 1}`}
                                    </h4>
                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${badgeTheme}`}>
                                      {type === 'Polygon' ? 'Polygon' : type === 'LineString' ? 'Polyline' : 'Point/Marker'}
                                    </span>
                                  </div>
                                  {props.description && (
                                    <p className="text-[11px] text-zinc-500 line-clamp-2 italic pr-2 mt-0.5 leading-relaxed">
                                      {props.description}
                                    </p>
                                  )}
                                </div>

                                {/* Actions icons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Center Zoom View */}
                                  <button
                                    onClick={() => onZoomToFeature(featureId)}
                                    className="p-1 px-2 text-xs bg-white hover:bg-zinc-100/80 border border-zinc-200 text-zinc-700 rounded flex items-center gap-1 transition cursor-pointer font-semibold"
                                    title="Pindahkan Fokus Peta"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                    <span className="text-[10px]">Fokus</span>
                                  </button>
                                  <button
                                    onClick={() => handleStartEditFeature(feature)}
                                    className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition cursor-pointer"
                                    title="Ubah Atribut Deskripsi"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteFeature(featureId)}
                                    className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Hapus Geometri"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Measurement Details Table (Indonesian / Metric metrics) */}
                              <div className="mt-2.5 pt-2 border-t border-zinc-150 grid grid-cols-2 gap-2 text-left bg-zinc-100/50 p-2 rounded">
                                {type === 'Polygon' && (
                                  <>
                                    <div>
                                      <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wide">Luas Area</span>
                                      <span className="text-[11px] text-emerald-600 font-extrabold">{areaStr}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wide">Keliling</span>
                                      <span className="text-[11px] text-zinc-650 font-semibold">{perimeterStr}</span>
                                    </div>
                                  </>
                                )}
                                {type === 'LineString' && (
                                  <div>
                                    <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wide">Panjang Jalur (Garis)</span>
                                    <span className="text-[11px] text-blue-600 font-extrabold">{lengthStr}</span>
                                  </div>
                                )}
                                {type === 'Point' && (
                                  <div className="col-span-2">
                                    <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wide">
                                      Koordinat ({coordinateMode})
                                    </span>
                                    <span className="text-[11px] text-amber-600 font-mono font-bold leading-none">{posStr}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: RAW GEOJSON EDITOR TEXT */}
        {activeTab === 'editor' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 h-full flex flex-col"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Raw JSON Editor
              </h3>
              
              {/* Validation visual light indicator */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isValidJson ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[11px] font-semibold text-zinc-500">
                  {isValidJson ? 'GeoJSON Sintaks Valid' : 'Format Invalid, periksa kembali'}
                </span>
              </div>
            </div>

            <div className="relative flex-1">
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                className={`w-full h-[360px] bg-zinc-50 text-zinc-800 font-mono text-[11px] p-3.5 rounded-lg border focus:outline-none transition-all ${
                  isValidJson 
                    ? 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-950' 
                    : 'border-rose-300 focus:border-rose-500'
                }`}
                style={{ tabSize: 2, whiteSpace: 'pre' }}
                placeholder="{ 'type': 'FeatureCollection', 'features': [] }"
              />
              
              {!isValidJson && (
                <div className="absolute bottom-2 left-2 right-2 bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-rose-700 leading-relaxed font-semibold">
                    Sintaks bermasalah. Pastikan pembuka kurung kurawal, tanda petik ganda, dan format GeoJSON valid.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFormatEditor}
                className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-xs font-semibold cursor-pointer transition border border-zinc-200"
              >
                Format Script
              </button>
              <button
                onClick={handleApplyEditor}
                disabled={!isValidJson}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isValidJson 
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs' 
                    : 'bg-zinc-50 text-zinc-400 cursor-not-allowed border border-zinc-200'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Terapkan ke Peta</span>
              </button>
            </div>
            
            <p className="text-[10px] text-zinc-400 italic text-center max-w-sm mx-auto">
              Perubahan langsung dalam editor ini akan dikonversi menjadi geometri di atas peta setelah Anda menekan tombol "Terapkan ke Peta".
            </p>
          </motion.div>
        )}

        {/* TAB 3: UTM CONVERTER & POINT MANIPULATION */}
        {activeTab === 'calculator' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
              <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-zinc-500" />
                <span>Kalkulator &amp; Converter UTM</span>
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                Alat bantu dua arah untuk menerjemahkan koordinat WGS-84 dan sistem UTM (Universal Transverse Mercator).
              </p>
            </div>

            {/* Step 1: Coordinates Conversion Row */}
            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Metode Input Koordinat</span>
                <span className="text-[10px] bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded font-mono font-bold">WGS-84 / UTM</span>
              </div>

              {/* SECTION A: Latitude Longitude Fields */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-zinc-700 uppercase block tracking-wider">Format LatLng (Decimal Degree)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 block font-medium">Latitude (Lintang)</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="-6.1754"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-800 mt-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block font-medium">Longitude (Bujur)</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      placeholder="106.8272"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-800 mt-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic conversion arrows */}
              <div className="flex justify-center items-center py-1 gap-2">
                <button
                  type="button"
                  onClick={handleLatLngToUtmCalc}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-750 font-bold border border-zinc-200 rounded text-[11px] cursor-pointer transition shadow-xs"
                  title="Konversi LatLng menjadi UTM"
                >
                  <span>Mulai Konversi UTM</span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-650" />
                </button>
              </div>

              {/* SECTION B: UTM Fields */}
              <div className="space-y-2 border-t border-zinc-200 pt-3">
                <span className="text-[10px] font-extrabold text-zinc-700 uppercase block tracking-wider font-mono">Format UTM (Universal Transverse Mercator)</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] text-zinc-500 block font-medium truncate">Zone No</label>
                    <input
                      type="number"
                      value={manualZone}
                      onChange={(e) => setManualZone(e.target.value)}
                      placeholder="48"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-800 mt-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 block font-medium truncate">Letter</label>
                    <input
                      type="text"
                      maxLength={1}
                      value={manualLetter}
                      onChange={(e) => setManualLetter(e.target.value)}
                      placeholder="M"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-800 mt-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono text-center uppercase"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] text-zinc-500 block font-medium truncate">Easting (Meter E)</label>
                    <input
                      type="number"
                      step="any"
                      value={manualEasting}
                      onChange={(e) => setManualEasting(e.target.value)}
                      placeholder="702410.5"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-800 mt-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="col-span-2">
                    <label className="text-[9px] text-zinc-500 block font-medium truncate">Northing (Meter N)</label>
                    <input
                      type="number"
                      step="any"
                      value={manualNorthing}
                      onChange={(e) => setManualNorthing(e.target.value)}
                      placeholder="9316982.1"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-800 mt-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic conversion back */}
              <div className="flex justify-center items-center py-1 gap-2">
                <button
                  type="button"
                  onClick={handleUtmToLatLngCalc}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-750 font-bold border border-zinc-200 rounded text-[11px] cursor-pointer transition shadow-xs"
                  title="Konversi koordinat UTM kembali ke LatLng"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-650 rotate-180" />
                  <span>Konversi Balik ke LatLng</span>
                </button>
              </div>
            </div>

            {/* Properties info point */}
            <div className="bg-white border border-zinc-200 rounded-lg p-3.5 space-y-3 shadow-xs">
              <span className="text-[11px] font-bold text-zinc-700 uppercase block tracking-wider border-b border-zinc-200 pb-1.5">Atribut Waypoint Baru</span>
              
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-zinc-500 block font-medium">Nama Tempat (Marker Name)</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-800 mt-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 block font-medium">Keterangan / Catatan</label>
                  <input
                    type="text"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-800 mt-0.5 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-zinc-500">Pilih Warna Penanda</span>
                  <div className="flex gap-1.5">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setManualColor(hex)}
                        className="w-4 h-4 rounded-full border border-zinc-150 cursor-pointer"
                        style={{ backgroundColor: hex }}
                      >
                        {manualColor === hex && <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit trigger button */}
              <button
                onClick={handleAddManualPoint}
                className="w-full bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambahkan Titik ke Peta</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Bottom info footer */}
      <div className="p-3 bg-zinc-50 text-[10px] text-zinc-450 border-t border-zinc-200 flex items-center justify-between font-semibold">
        <span>Sistem Grid UTM (Universal Grid WGS-84)</span>
        <span>Client Mode Offline</span>
      </div>
    </aside>
  );
}
