"use client";

import { GoogleMap, MarkerF, CircleF, useJsApiLoader, Libraries } from "@react-google-maps/api";

// Defined outside component — must match SearchModal.tsx to avoid "LoadScript reloaded" warnings.
const LIBRARIES: Libraries = ["places"];
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { LocateFixed, Loader2 } from "lucide-react";

type Venue = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  venues: Venue[];
  selectedVenueId?: number | null;
  onMarkerClick?: (venueId: number) => void;
  center?: { lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number } | null;
  fullHeight?: boolean;
  className?: string;
};

const defaultCenter = { lat: -37.8136, lng: 144.9631 };

function getSavedCenter(): { lat: number; lng: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem("ss_lastCenter");
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export default function VenueMap({
  venues,
  selectedVenueId,
  onMarkerClick,
  center,
  userLocation,
  fullHeight = false,
  className = "",
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Live GPS location fetched by the locate button (overrides parent userLocation for dot)
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(false);

  // Frozen on first render — must not change or @react-google-maps/api re-runs panTo.
  // Priority: explicit search center > GPS location > last searched location > Melbourne CBD default.
  const initialCenter = useRef(center ?? userLocation ?? getSavedCenter() ?? defaultCenter);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const validVenues = useMemo(
    () => venues.filter((v) => typeof v.lat === "number" && typeof v.lng === "number" && !isNaN(v.lat) && !isNaN(v.lng)),
    [venues]
  );

  const selectedVenue = useMemo(
    () => (selectedVenueId ? validVenues.find((v) => v.id === selectedVenueId) || null : null),
    [selectedVenueId, validVenues]
  );

  // Pan to selected venue imperatively — never rely on the center prop for this.
  useEffect(() => {
    if (!mapRef.current || !selectedVenue) return;
    mapRef.current.panTo({ lat: selectedVenue.lat, lng: selectedVenue.lng });
    mapRef.current.setZoom(14);
  }, [selectedVenue]);

  // Fit all venues into view when venues load (does NOT re-run when userLocation arrives —
  // hasAutoPanned handles that so the two effects don't fight each other).
  useEffect(() => {
    if (!mapRef.current || validVenues.length === 0 || selectedVenue) return;
    const bounds = new google.maps.LatLngBounds();
    validVenues.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
    mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validVenues, selectedVenue]);

  // Pan to user's GPS location once — only if no explicit search center and no saved location.
  // If the user has previously searched a suburb, honour that instead of moving to inaccurate GPS.
  const hasAutoPanned = useRef(false);
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !userLocation || center || getSavedCenter() || hasAutoPanned.current) return;
    hasAutoPanned.current = true;
    mapRef.current.panTo(userLocation);
    mapRef.current.setZoom(12);
  }, [mapLoaded, userLocation, center]);

  // The dot shown on the map — prefer live GPS hit; fall back to parent-provided location.
  const dotLocation = liveLocation ?? userLocation ?? null;

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocateError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLiveLocation(loc);
        setLocating(false);
        if (mapRef.current) {
          mapRef.current.panTo(loc);
          mapRef.current.setZoom(14);
        }
      },
      () => {
        setLocating(false);
        setLocateError(true);
        // Reset error indicator after 2 s
        setTimeout(() => setLocateError(false), 2000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const mapHeight = fullHeight ? "100%" : "500px";

  const placeholder = (msg: string) => (
    <div
      className={`flex items-center justify-center text-center text-[13px] text-slate-400 ${className}`}
      style={{ height: mapHeight, background: "#f8fafc" }}
    >
      {msg}
    </div>
  );

  if (!apiKey) return placeholder("Google Maps API key is missing");
  if (loadError) return placeholder("Failed to load Google Maps");
  if (!isLoaded) return placeholder("Loading map...");

  return (
    <div className={`relative ${className}`} style={{ width: "100%", height: mapHeight }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={initialCenter.current}
        zoom={12}
        onLoad={(map) => { mapRef.current = map; setMapLoaded(true); }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
          ],
        }}
      >
        {validVenues.map((venue) => {
          const isSelected = selectedVenueId === venue.id;
          return (
            <MarkerF
              key={venue.id}
              position={{ lat: venue.lat, lng: venue.lng }}
              title={venue.name}
              onClick={() => onMarkerClick?.(venue.id)}
              zIndex={isSelected ? 999 : 1}
              icon={{
                url: isSelected
                  ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  : "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: isSelected
                  ? new google.maps.Size(44, 44)
                  : new google.maps.Size(34, 34),
              }}
            />
          );
        })}

        {dotLocation && (
          <>
            <CircleF
              center={dotLocation}
              radius={200}
              options={{
                fillColor: "#4285F4", fillOpacity: 0.12,
                strokeColor: "#4285F4", strokeOpacity: 0.3, strokeWeight: 1, zIndex: 1,
              }}
            />
            <CircleF
              center={dotLocation}
              radius={40}
              options={{
                fillColor: "#4285F4", fillOpacity: 1,
                strokeColor: "#ffffff", strokeOpacity: 1, strokeWeight: 3, zIndex: 1001,
              }}
            />
          </>
        )}
      </GoogleMap>

      {/* Current location button — absolutely positioned over the map */}
      <button
        onClick={handleLocateMe}
        disabled={locating}
        title="Go to my current location"
        className="absolute top-2 right-2 flex items-center justify-center rounded bg-white shadow-md hover:bg-gray-50 active:bg-gray-100 disabled:cursor-wait"
        style={{ width: 40, height: 40, zIndex: 9999, border: "1px solid #e2e8f0" }}
      >
        {locating
          ? <span className="animate-spin"><Loader2 size={18} color="#4285F4" /></span>
          : <LocateFixed size={18} color={locateError ? "#ef4444" : dotLocation ? "#4285F4" : "#555555"} />
        }
      </button>
    </div>
  );
}
