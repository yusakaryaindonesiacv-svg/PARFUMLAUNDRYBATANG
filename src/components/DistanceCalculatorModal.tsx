import React, { useState } from 'react';
import { X, MapPin, Calculator, Navigation, CheckCircle, Map } from 'lucide-react';
import { BATANG_DISTRICTS, calculateLocalDistanceShipping } from '../lib/shipping';
import { formatRupiah } from '../lib/excelPdf';
import { StoreSettings } from '../types';
import { MapPicker } from './MapPicker';

interface DistanceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

export const DistanceCalculatorModal: React.FC<DistanceCalculatorModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  if (!isOpen) return null;

  const [activeMode, setActiveMode] = useState<'MAP' | 'PRESET'>('MAP');
  const [selectedDistrictName, setSelectedDistrictName] = useState(BATANG_DISTRICTS[0].name);
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(2.5);
  const [subtotal, setSubtotal] = useState<number>(100000);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string>('Kalisalak Batang');

  const handleDistrictChange = (name: string) => {
    setSelectedDistrictName(name);
    const matched = BATANG_DISTRICTS.find((d) => d.name === name);
    if (matched) {
      setCustomDistanceKm(matched.avgDistanceKm);
      setSelectedAddressLabel(matched.name);
    }
  };

  const calcResult = calculateLocalDistanceShipping(customDistanceKm, subtotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-black">Kalkulator Ongkir Jarak Real-Time</h2>
              <p className="text-[10px] text-indigo-100">Berdasarkan GPS Peta OpenStreetMap & Tarif Toko</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* Store Origin Info */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
            <MapPin className="w-6 h-6 text-indigo-600 shrink-0" />
            <div>
              <p className="font-extrabold text-indigo-900 dark:text-indigo-200">Titik Asal Toko (Origin):</p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">{settings.address}</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveMode('MAP')}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeMode === 'MAP'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>🗺️ Peta Interaktif & GPS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('PRESET')}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeMode === 'PRESET'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>🏘️ Presets Kecamatan</span>
            </button>
          </div>

          {activeMode === 'MAP' ? (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500">
                Pilih atau cari lokasi di peta OpenStreetMap (Gratis & Real-Time) untuk menghitung jarak presisi dari toko:
              </p>
              <MapPicker
                storeLat={settings.latitude}
                storeLng={settings.longitude}
                mode="CUSTOMER_SELECT"
                onLocationSelect={(loc) => {
                  setCustomDistanceKm(loc.distanceKm);
                  setSelectedAddressLabel(loc.addressLabel);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* District Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Kecamatan / Wilayah Tujuan di Batang & Pekalongan:
                </label>
                <select
                  value={selectedDistrictName}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                >
                  {BATANG_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} (~{d.avgDistanceKm} km)
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual Distance Slider */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Atur Jarak Manual:</span>
                  <span className="text-indigo-600 font-extrabold">{customDistanceKm} Km</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={45}
                  step={0.5}
                  value={customDistanceKm}
                  onChange={(e) => setCustomDistanceKm(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Order Subtotal input to test free shipping limit */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Simulasi Total Belanja (Rp) [Uji Batas Gratis Ongkir]:
            </label>
            <input
              type="number"
              value={subtotal}
              onChange={(e) => setSubtotal(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-extrabold text-indigo-600"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              * Bebas ongkir otomatis aktif jika total belanja ≥ {formatRupiah(settings.freeDeliveryMinOrder || 250000)} (Jarak ≤ 15 Km).
            </p>
          </div>

          {/* Calculation Result */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Hasil Jarak Terhitung:</span>
              <span className="font-bold text-indigo-600">{customDistanceKm} Km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Keterangan Layanan:</span>
              <span className="font-bold">{calcResult.message}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Biaya Ongkir Kurir:</span>
              <span className={calcResult.isFree ? 'text-emerald-600' : 'text-indigo-600 dark:text-indigo-400'}>
                {calcResult.isFree ? 'GRATIS ONGKIR' : formatRupiah(calcResult.cost)}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

