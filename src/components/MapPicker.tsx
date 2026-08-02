import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Search, Loader2, Compass, AlertCircle } from 'lucide-react';
import { STORE_COORDINATES, getStoreCoordinates, calculateHaversineDistance, searchAddressOsm, GeocodingResult } from '../lib/shipping';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  storeLat?: number;
  storeLng?: number;
  mode?: 'CUSTOMER_SELECT' | 'STORE_ORIGIN';
  onLocationSelect: (location: { lat: number; lng: number; distanceKm: number; addressLabel: string }) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat,
  initialLng,
  storeLat,
  storeLng,
  mode = 'CUSTOMER_SELECT',
  onLocationSelect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const storeMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const storeCoords = getStoreCoordinates();
  const effectiveStoreLat = storeLat ?? storeCoords.lat;
  const effectiveStoreLng = storeLng ?? storeCoords.lng;

  const defaultLat = initialLat ?? effectiveStoreLat;
  const defaultLng = initialLng ?? effectiveStoreLng;

  const [targetLat, setTargetLat] = useState<number>(defaultLat);
  const [targetLng, setTargetLng] = useState<number>(defaultLng);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressLabel, setAddressLabel] = useState(mode === 'STORE_ORIGIN' ? 'Titik Toko Utama' : 'Area Batang');

  // Fix Leaflet Icon default path issues in Vite
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    if (mode === 'STORE_ORIGIN') {
      // Single Store Marker mode for setting Origin
      const storeIcon = L.divIcon({
        className: 'custom-store-origin-marker',
        html: `<div style="background-color: #4f46e5; color: white; border: 3px solid white; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-weight: bold; font-size: 22px; cursor: move;">🏪</div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const storeMarker = L.marker([defaultLat, defaultLng], {
        icon: storeIcon,
        draggable: true,
      }).addTo(map);
      storeMarker.bindPopup('<b>🏪 Titik Asal Toko (Origin)</b><br/>Geser ikon ini ke lokasi toko Anda').openPopup();
      targetMarkerRef.current = storeMarker;

      storeMarker.on('dragend', () => {
        const pos = storeMarker.getLatLng();
        updateSelectedLocation(pos.lat, pos.lng, 'Titik Asal Toko Pilihan di Peta');
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        storeMarker.setLatLng(e.latlng);
        updateSelectedLocation(e.latlng.lat, e.latlng.lng, 'Titik Asal Toko Pilihan di Peta');
      });
    } else {
      // Customer selection mode with store origin and polyline
      const storeIcon = L.divIcon({
        className: 'custom-store-marker',
        html: `<div style="background-color: #4f46e5; color: white; border: 2px solid white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 16px;">🏪</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const storeMarker = L.marker([effectiveStoreLat, effectiveStoreLng], {
        icon: storeIcon,
      }).addTo(map);
      storeMarker.bindPopup('<b>Toko Parfum Laundry Batang</b><br/>Origin Shipping').openPopup();
      storeMarkerRef.current = storeMarker;

      const customerIcon = L.divIcon({
        className: 'custom-customer-marker',
        html: `<div style="background-color: #059669; color: white; border: 2px solid white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-weight: bold; font-size: 18px;">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const targetMarker = L.marker([defaultLat, defaultLng], {
        icon: customerIcon,
        draggable: true,
      }).addTo(map);
      targetMarkerRef.current = targetMarker;

      const polyline = L.polyline(
        [
          [effectiveStoreLat, effectiveStoreLng],
          [defaultLat, defaultLng],
        ],
        { color: '#4f46e5', weight: 4, dashArray: '6, 8' }
      ).addTo(map);
      polylineRef.current = polyline;

      targetMarker.on('dragend', () => {
        const position = targetMarker.getLatLng();
        updateSelectedLocation(position.lat, position.lng, 'Titik Pilihan di Peta');
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        targetMarker.setLatLng(e.latlng);
        updateSelectedLocation(e.latlng.lat, e.latlng.lng, 'Titik Pilihan di Peta');
      });

      const initialDist = calculateHaversineDistance(effectiveStoreLat, effectiveStoreLng, defaultLat, defaultLng);
      setDistanceKm(initialDist);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const updateSelectedLocation = (lat: number, lng: number, label: string) => {
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;

    setTargetLat(roundedLat);
    setTargetLng(roundedLng);
    setAddressLabel(label);

    let dist = 0;
    if (mode === 'CUSTOMER_SELECT') {
      dist = calculateHaversineDistance(effectiveStoreLat, effectiveStoreLng, roundedLat, roundedLng);
      setDistanceKm(dist);

      if (polylineRef.current) {
        polylineRef.current.setLatLngs([
          [effectiveStoreLat, effectiveStoreLng],
          [roundedLat, roundedLng],
        ]);
      }

      if (mapRef.current) {
        const bounds = L.latLngBounds([
          [effectiveStoreLat, effectiveStoreLng],
          [roundedLat, roundedLng],
        ]);
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    } else if (mapRef.current) {
      mapRef.current.panTo([roundedLat, roundedLng]);
    }

    onLocationSelect({
      lat: roundedLat,
      lng: roundedLng,
      distanceKm: dist,
      addressLabel: label,
    });
  };

  // Handle GPS Auto Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Fitur GPS lokasi tidak didukung di browser ini.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        if (targetMarkerRef.current) {
          targetMarkerRef.current.setLatLng([latitude, longitude]);
        }
        updateSelectedLocation(latitude, longitude, 'Lokasi GPS Saya Saat Ini');
      },
      (error) => {
        setIsLocating(false);
        alert('Gagal mengambil lokasi GPS. Pastikan izin lokasi diizinkan di browser Anda.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Address Search Submit
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchAddressOsm(searchQuery);
    setIsSearching(false);
    setSearchResults(results);
  };

  const handleSelectSearchResult = (item: GeocodingResult) => {
    setSearchResults([]);
    setSearchQuery(item.displayName);
    if (targetMarkerRef.current) {
      targetMarkerRef.current.setLatLng([item.lat, item.lng]);
    }
    updateSelectedLocation(item.lat, item.lng, item.displayName);
  };

  return (
    <div className="space-y-3">
      {/* Search Bar & GPS Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="Cari lokasi/desa/jalan di Batang (Contoh: Kauman Batang)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-xs pl-8 pr-16 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1 top-1 text-[10px] font-bold px-3 py-1.5 bg-indigo-600 text-white rounded-lg flex items-center gap-1"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cari Peta'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          <span>Deteksi GPS Saya</span>
        </button>
      </div>

      {/* Geocoding Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
          {searchResults.map((item) => (
            <button
              key={item.placeId}
              type="button"
              onClick={() => handleSelectSearchResult(item)}
              className="w-full p-2.5 text-left text-xs hover:bg-indigo-50 dark:hover:bg-slate-700/60 transition-colors flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span className="font-medium text-slate-700 dark:text-slate-200 line-clamp-2">{item.displayName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full h-72 sm:h-80 rounded-2xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Map Helper Badge */}
        <div className="absolute top-3 left-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md text-[10px] font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>
            {mode === 'STORE_ORIGIN'
              ? 'Geser / Klik Marker Toko 🏪 Untuk Menggeser Titik Asal Toko (Origin)'
              : 'Geser / Klik Marker 📍 Untuk Pilih Lokasi Tujuan'}
          </span>
        </div>

        {/* Live Distance Info Overlay */}
        <div className="absolute bottom-3 right-3 left-3 z-[400] bg-slate-900/90 text-white backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-xl flex items-center justify-between text-xs">
          <div>
            {mode === 'STORE_ORIGIN' ? (
              <>
                <p className="text-[10px] text-slate-300">Titik Asal Toko (Origin):</p>
                <p className="font-extrabold text-xs text-indigo-300 truncate max-w-[200px] sm:max-w-xs">{addressLabel}</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-slate-300">Jarak Dari Toko Origin:</p>
                <p className="font-extrabold text-sm text-emerald-400">{distanceKm} Km (Peta Real-Time)</p>
              </>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-mono px-2 py-0.5 rounded-md border border-indigo-400/40">
              GPS: {targetLat.toFixed(4)}, {targetLng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
