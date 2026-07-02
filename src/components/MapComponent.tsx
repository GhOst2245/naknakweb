import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Truck, Navigation, MapPin } from "lucide-react";

interface MapComponentProps {
  pickupLatLng?: { lat: number; lng: number };
  destinationLatLng?: { lat: number; lng: number };
  onCalculated?: (distanceKm: number, durationMins: number) => void;
  distanceKm?: number;
  estimatedDurationMins?: number;
}

export default function MapComponent({
  pickupLatLng,
  destinationLatLng,
  onCalculated,
  distanceKm,
  estimatedDurationMins
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center of Turkey
    const initialLat = 38.9637;
    const initialLng = 35.2433;
    const initialZoom = 6;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }).addTo(map);

    mapRef.current = map;

    // Handle container resize
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);

    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers and Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Pickup Marker
    if (pickupLatLng) {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng([pickupLatLng.lat, pickupLatLng.lng]);
      } else {
        const pickupIcon = L.divIcon({
          html: `<div class="bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          className: "custom-div-icon",
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        pickupMarkerRef.current = L.marker([pickupLatLng.lat, pickupLatLng.lng], { icon: pickupIcon })
          .addTo(map)
          .bindPopup("<b>Yükleme Noktası</b>");
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    // Destination Marker
    if (destinationLatLng) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng([destinationLatLng.lat, destinationLatLng.lng]);
      } else {
        const destIcon = L.divIcon({
          html: `<div class="bg-emerald-600 text-white p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          className: "custom-div-icon",
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        destinationMarkerRef.current = L.marker([destinationLatLng.lat, destinationLatLng.lng], { icon: destIcon })
          .addTo(map)
          .bindPopup("<b>Teslimat Noktası</b>");
      }
    } else if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    // Polyline Route and Fit Bounds
    if (pickupLatLng && destinationLatLng) {
      const points: [number, number][] = [
        [pickupLatLng.lat, pickupLatLng.lng],
        [destinationLatLng.lat, destinationLatLng.lng]
      ];

      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(points);
      } else {
        routePolylineRef.current = L.polyline(points, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.8,
          dashArray: "8, 8"
        }).addTo(map);
      }

      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60] });

      // Calculate distance using Haversine formula
      const dist = calculateHaversineDistance(
        pickupLatLng.lat,
        pickupLatLng.lng,
        destinationLatLng.lat,
        destinationLatLng.lng
      );

      // Estimated duration: average speed 60 km/h in truck + 30 mins overhead
      const estDurationMins = Math.round((dist / 60) * 60 + 30);

      if (onCalculated) {
        onCalculated(parseFloat(dist.toFixed(1)), estDurationMins);
      }
    } else {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      // If only pickup is available, zoom into it
      if (pickupLatLng) {
        map.setView([pickupLatLng.lat, pickupLatLng.lng], 12);
      } else if (destinationLatLng) {
        map.setView([destinationLatLng.lat, destinationLatLng.lng], 12);
      }
    }
  }, [pickupLatLng, destinationLatLng]);

  // Haversine Distance Calculator
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 shadow-xs flex flex-col">
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {/* Dynamic Overlay Info for Distance and Duration */}
      {pickupLatLng && destinationLatLng && distanceKm !== undefined && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-xl z-10 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Görsel Güzergah Analizi</p>
              <p className="text-xs font-semibold text-slate-700">Dinamik Mesafe Ölçümü</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-blue-600">{distanceKm} KM</p>
            <p className="text-[10px] text-slate-400 font-bold">Ort. {estimatedDurationMins} Dk Sürüş</p>
          </div>
        </div>
      )}

      {/* Empty State Help Overlay */}
      {(!pickupLatLng || !destinationLatLng) && (
        <div className="absolute top-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-lg z-10 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400 animate-bounce" />
          <span>İl ve İlçe seçtiğinizde haritada güzergah otomatik çizilecektir.</span>
        </div>
      )}
    </div>
  );
}
