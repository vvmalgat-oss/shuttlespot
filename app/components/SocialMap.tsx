"use client";

import {
  GoogleMap,
  useJsApiLoader,
  Libraries,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { LocateFixed, Loader2 } from "lucide-react";

const LIBRARIES: Libraries = ["places"];

type VenuePin = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  sessionCount: number;
};

type Props = {
  venues: VenuePin[];
  selectedVenueId: number | null;
  onMarkerClick: (venueId: number) => void;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
};

const AU_CENTER = { lat: -27.0, lng: 133.0 };

// Build an SVG data-URI shuttlecock icon for MarkerF.
// Five feather shafts radiate from the tip + two horizontal cross-section rings.
// Count badge is shown inside the top feather ring.
function makeIconUrl(count: number, selected: boolean, hasSessions: boolean): string {
  const fill = selected ? "#2563eb" : hasSessions ? "#16a34a" : "#94a3b8";
  const ringFill = selected
    ? "rgba(219,234,254,0.96)"
    : hasSessions
    ? "rgba(220,252,231,0.96)"
    : "rgba(248,250,252,0.96)";
  const label = hasSessions ? (count > 9 ? "9+" : String(count)) : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="46" viewBox="0 0 40 46">
  <ellipse cx="20" cy="45" rx="5" ry="1.6" fill="rgba(0,0,0,0.15)"/>
  <line x1="20" y1="40" x2="3"  y2="11" stroke="${fill}" stroke-width="2"   stroke-linecap="round"/>
  <line x1="20" y1="40" x2="10" y2="6"  stroke="${fill}" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
  <line x1="20" y1="40" x2="20" y2="4"  stroke="${fill}" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
  <line x1="20" y1="40" x2="30" y2="6"  stroke="${fill}" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
  <line x1="20" y1="40" x2="37" y2="11" stroke="${fill}" stroke-width="2"   stroke-linecap="round"/>
  <ellipse cx="20" cy="22" rx="11" ry="3.5" fill="none" stroke="${fill}" stroke-width="1.4" opacity="0.55"/>
  <ellipse cx="20" cy="31" rx="6"  ry="2"   fill="none" stroke="${fill}" stroke-width="1.2" opacity="0.4"/>
  <ellipse cx="20" cy="11" rx="17" ry="5.5" fill="${ringFill}" stroke="${fill}" stroke-width="2.2"/>
  ${label
    ? `<text x="20" y="13" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="800" fill="${fill}" font-family="system-ui,sans-serif">${label}</text>`
    : ""
  }
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function SocialMap({
  venues,
  selectedVenueId,
  onMarkerClick,
  userLocation,
  className = "",
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
  const mapRef = useRef<google.maps.Map | null>(null);

  // Live GPS location fetched by the locate button
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const validVenues = useMemo(
    () =>
      venues.filter(
        (v) =>
          typeof v.lat === "number" &&
          typeof v.lng === "number" &&
          !isNaN(v.lat) &&
          !isNaN(v.lng)
      ),
    [venues]
  );

  const selectedVenue = useMemo(
    () => validVenues.find((v) => v.id === selectedVenueId) ?? null,
    [selectedVenueId, validVenues]
  );

  // Pan + zoom to selected venue whenever selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedVenue) return;
    mapRef.current.panTo({ lat: selectedVenue.lat, lng: selectedVenue.lng });
    mapRef.current.setZoom(14);
  }, [selectedVenue]);

  // Fit bounds on first load (or when venue list changes)
  useEffect(() => {
    if (!mapRef.current || validVenues.length === 0 || selectedVenue) return;
    if (validVenues.length === 1) {
      mapRef.current.setCenter({ lat: validVenues[0].lat, lng: validVenues[0].lng });
      mapRef.current.setZoom(13);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    validVenues.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
    if (userLocation) bounds.extend(userLocation);
    mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  }, [validVenues, selectedVenue, userLocation]);

  // Dot shown on map — prefer live GPS hit; fall back to parent-provided location.
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
        setTimeout(() => setLocateError(false), 2000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const placeholder = (msg: string) => (
    <div
      className={`flex items-center justify-center text-center text-[13px] text-slate-400 ${className}`}
      style={{ height: "100%", background: "#f8fafc" }}
    >
      {msg}
    </div>
  );

  if (!apiKey) return placeholder("Google Maps API key is missing");
  if (loadError) return placeholder("Failed to load Google Maps");
  if (!isLoaded) return placeholder("Loading map…");

  return (
    <div className={`relative ${className}`} style={{ width: "100%", height: "100%" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={userLocation ?? AU_CENTER}
        zoom={validVenues.length > 0 ? 10 : 5}
        onLoad={(map) => { mapRef.current = map; }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          clickableIcons: false,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
          ],
        }}
      >
        {/* ── Venue markers ── */}
        {validVenues.map((venue) => {
          const isSelected = venue.id === selectedVenueId;
          const hasSessions = venue.sessionCount > 0;
          const iconUrl = makeIconUrl(venue.sessionCount, isSelected, hasSessions);
          const scaledW = isSelected ? 42 : 34;
          const scaledH = isSelected ? 48 : 39;
          return (
            <MarkerF
              key={venue.id}
              position={{ lat: venue.lat, lng: venue.lng }}
              title={venue.name}
              zIndex={isSelected ? 999 : hasSessions ? 2 : 1}
              onClick={() => onMarkerClick(venue.id)}
              icon={{
                url: iconUrl,
                scaledSize: new google.maps.Size(scaledW, scaledH),
                anchor: new google.maps.Point(scaledW / 2, isSelected ? 46 : 37),
              }}
            />
          );
        })}

        {/* ── InfoWindow tooltip for selected venue ── */}
        {selectedVenue && (
          <InfoWindowF
            position={{ lat: selectedVenue.lat, lng: selectedVenue.lng }}
            options={{
              pixelOffset: new google.maps.Size(0, -64 + 4),
              disableAutoPan: true,
            }}
            onCloseClick={() => onMarkerClick(selectedVenue.id)}
          >
            <div style={{ minWidth: 140, maxWidth: 220, padding: "2px 4px" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                {selectedVenue.name}
              </p>
              {selectedVenue.sessionCount > 0 ? (
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                  {selectedVenue.sessionCount} open session{selectedVenue.sessionCount !== 1 ? "s" : ""} · tap to view →
                </p>
              ) : (
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>
                  No active sessions · tap to post →
                </p>
              )}
            </div>
          </InfoWindowF>
        )}

        {/* ── User / live location dot ── */}
        {dotLocation && (
          <MarkerF
            position={dotLocation}
            zIndex={1000}
            clickable={false}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="18" fill="rgba(66,133,244,0.18)" stroke="rgba(66,133,244,0.35)" stroke-width="1.5"/>
  <circle cx="20" cy="20" r="8" fill="#4285F4" stroke="white" stroke-width="3"/>
</svg>`)}`,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20),
            }}
          />
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
