"use client";

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
  ArrowRightLeft,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FeatureCollection, Feature } from 'geojson';
import { CoordinateMode, GisFeatureProperties } from '@/lib/types';
import { calculatePolygonArea, calculatePolygonPerimeter, calculateLineLength, formatArea, formatDistance } from '@/lib/gisCalc';
import { latLngToUtm, utmToLatLng } from '@/lib/utm';
import { TEMPLATES } from '@/lib/templates';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  geoJsonData: FeatureCollection;
  onUpdateGeoJSON: (data: FeatureCollection) => void;
  coordinateMode: CoordinateMode;
  onZoomToFeature: (featureId: string) => void;
  onDeleteFeature: (featureId: string) => void;
  onUpdateFeatureProperties: (featureId: string, properties: GisFeatureProperties) => void;
  onAddPoint: (lat: number, lng: number, name: string, description: string, color?: string) => void;
  selectedPdfFeatureId?: string | null;
  onSelectPdfFeature?: (id: string | null) => void;
}

export default function Sidebar({
  geoJsonData,
  onUpdateGeoJSON,
  coordinateMode,
  onZoomToFeature,
  onDeleteFeature,
  onUpdateFeatureProperties,
  onAddPoint,
  selectedPdfFeatureId = null,
  onSelectPdfFeature = () => {}
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<string>('features');
  const [rawText, setRawText] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('#3b82f6');
  const [editCustomProps, setEditCustomProps] = useState<Record<string, string>>({});

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
    
    const standardKeys = ['id', 'name', 'description', 'color', 'gpxType'];
    const customProps: Record<string, string> = {};
    Object.keys(props).forEach(key => {
      if (!standardKeys.includes(key)) {
        customProps[key] = String(props[key] ?? '');
      }
    });
    setEditCustomProps(customProps);
  };

  const handleSaveFeature = (id: string) => {
    onUpdateFeatureProperties(id, {
      id,
      name: editName,
      description: editDesc,
      color: editColor,
      ...editCustomProps
    });
    setEditingId(null);
  };

  const handleCustomPropChange = (key: string, value: string) => {
    setEditCustomProps(prev => ({ ...prev, [key]: value }));
  };

  const handleAddCustomProp = () => {
    const newKey = `prop_${Object.keys(editCustomProps).length + 1}`;
    setEditCustomProps(prev => ({ ...prev, [newKey]: '' }));
  };

  const handleRemoveCustomProp = (key: string) => {
    setEditCustomProps(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleRenameCustomPropKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey.trim()) return;
    setEditCustomProps(prev => {
      const copy = { ...prev };
      const value = copy[oldKey];
      delete copy[oldKey];
      copy[newKey] = value;
      return copy;
    });
  };

  const handleApplyTemplate = (templateId: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateId];
    if (!template) return;
    setEditCustomProps(prev => ({
      ...prev,
      ...template.data
    }));
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
    <aside id="sidebar-container" className="w-full lg:w-[480px] h-full bg-background border-r flex flex-col z-40 shrink-0 relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full" >
        {/* Tabs list header */}
        <div className="bg-muted/50 p-2 border-b">
          <TabsList className="grid w-full grid-cols-3 bg-muted border rounded-md">
            <TabsTrigger value="features" className=" text-[11px] lg:text-xs font-semibold rounded-sm whitespace-normal text-center">
              <TableProperties className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 shrink-0" />
              <span>Fitur &amp; Statistik</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className=" text-[11px] lg:text-xs font-semibold rounded-sm whitespace-normal text-center">
              <FileCode className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 shrink-0" />
              <span>GeoJSON Raw</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className=" text-[11px] lg:text-xs font-semibold rounded-sm whitespace-normal text-center">
              <Calculator className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 shrink-0" />
              <span>UTM Converter</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Tab Content viewports */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: FEATURES AND MEASUREMENTS LIST */}
          <TabsContent value="features" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Quick Statistics Overview Card */}
              <div className="bg-muted/30 p-3.5 rounded-xl border grid grid-cols-3 gap-2">
                <Card className="shadow-none border-border bg-background p-2 text-center">
                  <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Poligon</span>
                  <span className="text-base font-extrabold text-foreground mt-0.5 block">{polyFeatures.length}</span>
                  <span className="text-[9px] text-muted-foreground font-medium truncate block">{formatArea(totalPolygonArea)}</span>
                </Card>
                <Card className="shadow-none border-border bg-background p-2 text-center">
                  <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Polyline</span>
                  <span className="text-base font-extrabold text-foreground mt-0.5 block">{lineFeatures.length}</span>
                  <span className="text-[9px] text-muted-foreground font-medium truncate block">{formatDistance(totalLineLength)}</span>
                </Card>
                <Card className="shadow-none border-border bg-background p-2 text-center">
                  <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Titik</span>
                  <span className="text-base font-extrabold text-foreground mt-0.5 block">{pointFeatures.length}</span>
                  <span className="text-[9px] text-muted-foreground font-medium truncate block">Total: {totalFeatures}</span>
                </Card>
              </div>

              {/* List of Features */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Daftar Geometri ({totalFeatures})</span>
                  {totalFeatures === 0 && <span className="text-[10px] text-muted-foreground lowercase font-normal italic">Gunakan toolbar peta untuk menggambar</span>}
                </h3>

                {totalFeatures === 0 ? (
                  <div className="text-center py-12 px-6 bg-muted/30 border border-dashed rounded-xl space-y-2">
                    <Compass className="w-8 h-8 text-muted-foreground mx-auto stroke-[1.2]" />
                    <p className="text-xs font-bold text-foreground">Peta masih kosong.</p>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      Gunakan instrumen gambar di panel kiri atas peta untuk membuat Poligon, Garis (Polyline), atau Waypoint secara interaktif.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 pr-1">
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
                          ? 'border-l-3 border-l-emerald-500' 
                          : type === 'LineString' 
                          ? 'border-l-3 border-l-blue-500' 
                          : 'border-l-3 border-l-amber-500';

                        const badgeTheme = type === 'Polygon'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                          : type === 'LineString'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/50'
                          : 'bg-amber-50 text-amber-700 border-amber-200/50';

                        return (
                          <motion.div
                            key={featureId}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`bg-muted/30 border rounded-lg p-3 space-y-2.5 transition-all hover:bg-muted/50 ${borderTheme}`}
                          >
                            {/* Inner properties details */}
                            {isEditing ? (
                              <Card className="p-3 shadow-sm border space-y-2.5">
                                <div>
                                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Nama Fitur</label>
                                  <Input 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-7 text-xs mt-1 bg-background" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Keterangan / Deskripsi</label>
                                  <textarea 
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full bg-background text-xs border rounded-md px-2.5 py-1.5 mt-1 h-14 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Warna Geometri</span>
                                  <div className="flex gap-1.5 mt-1">
                                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((hex) => (
                                      <button
                                        key={hex}
                                        onClick={() => setEditColor(hex)}
                                        className="w-4.5 h-4.5 rounded-full border border-border flex items-center justify-center cursor-pointer"
                                        style={{ backgroundColor: hex }}
                                      >
                                        {editColor === hex && <Check className="w-3 h-3 text-white" />}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Custom Properties Section */}
                                <div className="pt-2 border-t border-border mt-2 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Custom Properties</span>
                                    <div className="flex gap-1">
                                      <Button variant="outline" size="sm" className="h-6 text-[9px] px-2" onClick={() => handleApplyTemplate('surat_tanah')}>
                                        + Surat Tanah
                                      </Button>
                                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={handleAddCustomProp}>
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {Object.entries(editCustomProps).map(([key, val], i) => (
                                      <div key={i} className="flex items-center gap-1.5">
                                        <Input
                                          defaultValue={key}
                                          onBlur={(e) => handleRenameCustomPropKey(key, e.target.value)}
                                          className="h-6 text-[10px] w-1/3 bg-muted/50"
                                          placeholder="Key"
                                        />
                                        <Input
                                          value={val}
                                          onChange={(e) => handleCustomPropChange(key, e.target.value)}
                                          className="h-6 text-[10px] flex-1 bg-background"
                                          placeholder="Value"
                                        />
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => handleRemoveCustomProp(key)}>
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                    {Object.keys(editCustomProps).length === 0 && (
                                      <p className="text-[10px] text-muted-foreground italic text-center py-1">Belum ada custom properties.</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingId(null)}
                                    className="h-7 text-[11px]"
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveFeature(featureId)}
                                    className="h-7 text-[11px]"
                                  >
                                    Simpan
                                  </Button>
                                </div>
                              </Card>
                            ) : (
                              <div>
                                {/* Header Card */}
                                <div className="flex items-start justify-between">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-xs">
                                        {props.name || `Geometri ${idx + 1}`}
                                      </h4>
                                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badgeTheme}`}>
                                        {type === 'Polygon' ? 'Polygon' : type === 'LineString' ? 'Polyline' : 'Point/Marker'}
                                      </span>
                                    </div>
                                    {props.description && (
                                      <p className="text-[11px] text-muted-foreground line-clamp-2 italic pr-2 mt-0.5 leading-relaxed">
                                        {props.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Actions icons */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Tooltip>
                                      <TooltipTrigger render={
                                        <Button
                                          variant={selectedPdfFeatureId === featureId ? "default" : "outline"}
                                          size="icon"
                                          onClick={() => onSelectPdfFeature(selectedPdfFeatureId === featureId ? null : featureId)}
                                          className={`w-7 h-7 ${selectedPdfFeatureId === featureId ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}`}
                                        >
                                          <FileCode className="w-3.5 h-3.5" />
                                        </Button>
                                      } />
                                      <TooltipContent>{selectedPdfFeatureId === featureId ? "Terpilih untuk PDF" : "Pilih untuk PDF"}</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger render={
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => onZoomToFeature(featureId)}
                                          className="w-7 h-7"
                                        >
                                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                        </Button>
                                      } />
                                      <TooltipContent>Fokus Peta</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger render={
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleStartEditFeature(feature)}
                                          className="w-7 h-7 text-muted-foreground hover:text-foreground"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </Button>
                                      } />
                                      <TooltipContent>Ubah Atribut</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger render={
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => onDeleteFeature(featureId)}
                                          className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      } />
                                      <TooltipContent>Hapus Geometri</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>

                                {/* Measurement Details Table */}
                                <div className="mt-2.5 pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-left bg-muted/40 p-2 rounded">
                                  {type === 'Polygon' && (
                                    <>
                                      <div>
                                        <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wide">Luas Area</span>
                                        <span className="text-[11px] text-emerald-600 font-extrabold">{areaStr}</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wide">Keliling</span>
                                        <span className="text-[11px] font-semibold">{perimeterStr}</span>
                                      </div>
                                    </>
                                  )}
                                  {type === 'LineString' && (
                                    <div>
                                      <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wide">Panjang Jalur (Garis)</span>
                                      <span className="text-[11px] text-blue-600 font-extrabold">{lengthStr}</span>
                                    </div>
                                  )}
                                  {type === 'Point' && (
                                    <div className="col-span-2">
                                      <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wide">
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
          </TabsContent>

          {/* TAB 2: RAW GEOJSON EDITOR TEXT */}
          <TabsContent value="editor" className="h-full flex flex-col m-0 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 h-full flex flex-col pb-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Raw JSON Editor
                </h3>
                
                {/* Validation visual light indicator */}
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isValidJson ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {isValidJson ? 'GeoJSON Sintaks Valid' : 'Format Invalid, periksa kembali'}
                  </span>
                </div>
              </div>

              <div className="relative flex-1">
                <textarea
                  value={rawText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className={`w-full h-full min-h-[300px] bg-muted/30 text-foreground font-mono text-[11px] p-3.5 rounded-lg border focus-visible:outline-none transition-all ${
                    isValidJson 
                      ? 'border-border focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring' 
                      : 'border-destructive/50 focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive'
                  }`}
                  style={{ tabSize: 2, whiteSpace: 'pre' }}
                  placeholder="{ 'type': 'FeatureCollection', 'features': [] }"
                />
                
                {!isValidJson && (
                  <div className="absolute bottom-2 left-2 right-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-[10px] text-destructive leading-relaxed font-semibold">
                      Sintaks bermasalah. Pastikan pembuka kurung kurawal, tanda petik ganda, dan format GeoJSON valid.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={handleFormatEditor}
                  className="flex-1 h-8 text-xs font-semibold"
                >
                  Format Script
                </Button>
                <Button
                  onClick={handleApplyEditor}
                  disabled={!isValidJson}
                  className="flex-1 h-8 text-xs font-bold"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Terapkan ke Peta
                </Button>
              </div>
              
              <p className="text-[10px] text-muted-foreground italic text-center max-w-sm mx-auto shrink-0">
                Perubahan langsung dalam editor ini akan dikonversi menjadi geometri di atas peta setelah Anda menekan tombol "Terapkan ke Peta".
              </p>
            </motion.div>
          </TabsContent>

          {/* TAB 3: UTM CONVERTER & POINT MANIPULATION */}
          <TabsContent value="calculator" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 pb-4"
            >
              <div className="bg-muted/30 p-3 rounded-lg border space-y-1">
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-muted-foreground" />
                  <span>Kalkulator &amp; Converter UTM</span>
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Alat bantu dua arah untuk menerjemahkan koordinat WGS-84 dan sistem UTM (Universal Transverse Mercator).
                </p>
              </div>

              {/* Step 1: Coordinates Conversion Row */}
              <Card className="p-3.5 space-y-3 shadow-sm border-border">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Metode Input Koordinat</span>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono font-bold">WGS-84 / UTM</span>
                </div>

                {/* SECTION A: Latitude Longitude Fields */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase block tracking-wider">Format LatLng (Decimal Degree)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block font-medium">Latitude (Lintang)</label>
                      <Input
                        type="number"
                        step="any"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        placeholder="-6.1754"
                        className="h-8 text-xs mt-0.5 font-mono bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block font-medium">Longitude (Bujur)</label>
                      <Input
                        type="number"
                        step="any"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        placeholder="106.8272"
                        className="h-8 text-xs mt-0.5 font-mono bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic conversion arrows */}
                <div className="flex justify-center items-center py-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLatLngToUtmCalc}
                    className="h-8 text-[11px] font-bold shadow-xs"
                  >
                    <span>Mulai Konversi UTM</span>
                    <ArrowRightLeft className="w-3.5 h-3.5 ml-1.5 text-muted-foreground" />
                  </Button>
                </div>

                {/* SECTION B: UTM Fields */}
                <div className="space-y-2 border-t border-border pt-3">
                  <span className="text-[10px] font-extrabold uppercase block tracking-wider font-mono">Format UTM</span>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[9px] text-muted-foreground block font-medium truncate">Zone No</label>
                      <Input
                        type="number"
                        value={manualZone}
                        onChange={(e) => setManualZone(e.target.value)}
                        placeholder="48"
                        className="h-8 text-xs mt-0.5 font-mono text-center bg-background px-1"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground block font-medium truncate">Letter</label>
                      <Input
                        type="text"
                        maxLength={1}
                        value={manualLetter}
                        onChange={(e) => setManualLetter(e.target.value)}
                        placeholder="M"
                        className="h-8 text-xs mt-0.5 font-mono text-center uppercase bg-background px-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] text-muted-foreground block font-medium truncate">Easting (Meter E)</label>
                      <Input
                        type="number"
                        step="any"
                        value={manualEasting}
                        onChange={(e) => setManualEasting(e.target.value)}
                        placeholder="702410.5"
                        className="h-8 text-xs mt-0.5 font-mono bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="col-span-2">
                      <label className="text-[9px] text-muted-foreground block font-medium truncate">Northing (Meter N)</label>
                      <Input
                        type="number"
                        step="any"
                        value={manualNorthing}
                        onChange={(e) => setManualNorthing(e.target.value)}
                        placeholder="9316982.1"
                        className="h-8 text-xs mt-0.5 font-mono bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic conversion back */}
                <div className="flex justify-center items-center py-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUtmToLatLngCalc}
                    className="h-8 text-[11px] font-bold shadow-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-muted-foreground rotate-180" />
                    <span>Konversi Balik ke LatLng</span>
                  </Button>
                </div>
              </Card>

              {/* Properties info point */}
              <Card className="p-3.5 space-y-3 shadow-sm border-border">
                <span className="text-[11px] font-bold uppercase block tracking-wider border-b border-border pb-1.5">Atribut Waypoint Baru</span>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block font-medium">Nama Tempat (Marker Name)</label>
                    <Input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="h-8 text-xs mt-0.5 bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground block font-medium">Keterangan / Catatan</label>
                    <Input
                      type="text"
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="h-8 text-xs mt-0.5 bg-background"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">Pilih Warna Penanda</span>
                    <div className="flex gap-1.5">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((hex) => (
                        <button
                          key={hex}
                          onClick={() => setManualColor(hex)}
                          className="w-4 h-4 rounded-full border border-border cursor-pointer"
                          style={{ backgroundColor: hex }}
                        >
                          {manualColor === hex && <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit trigger button */}
                <Button
                  onClick={handleAddManualPoint}
                  className="w-full h-9 text-xs font-bold mt-2"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  <span>Tambahkan Titik ke Peta</span>
                </Button>
              </Card>
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Bottom info footer */}
      <div className="p-3.5 bg-muted/40 text-muted-foreground border-t border-border flex items-center justify-center font-semibold">
        <div className="text-[11px] opacity-90">
          &copy; {new Date().getFullYear()} Geovertex. Crafted by <a href="https://feryirawan.com" target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground font-bold transition-colors">Fery Irawan</a>.
        </div>
      </div>
    </aside>
  );
}
