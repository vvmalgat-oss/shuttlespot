"use client";

import {
  GoogleMap,
  useJsApiLoader,
  Libraries,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import { useEffect, useMemo, useRef } from "react";

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

// Build an SVG data-URI icon for MarkerF — no OverlayView needed
function makeIconUrl(count: number, selected: boolean, hasSessions: boolean): string {
  const fill = selected ? "#2563eb" : hasSessions ? "#16a34a" : "#94a3b8";
  const w = selected ? 52 : 42;
  const h = selected ? 64 : 52;
  const cx = w / 2;
  // pin path scaled to viewBox
  const vbW = 52;
  const vbH = 64;
  const label = hasSessions ? (count > 9 ? "9+" : String(count)) : "";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vbW} ${vbH}">
  <ellipse cx="${cx}" cy="${vbH - 3}" rx="10" ry="3.5" fill="rgba(0,0,0,0.18)"/>
  <path d="M${cx} 3C${cx - 14} 3 ${cx - 22} ${3 + 12} ${cx - 22} ${3 + 22}c0 14 22 36 22 36s22-22 22-36C${cx + 22} ${3 + 12} ${cx + 14} 3 ${cx} 3z"
    fill="${fill}" stroke="white" stroke-width="2.5"/>
  ${label
    ? `<text x="${cx}" y="${3 + 26}" text-anchor="middle" dominant-baseline="middle"
         font-size="15" font-weight="800" fill="white" font-family="system-ui,sans-serif">${label}</text>`
    : `<circle cx="${cx}" cy="${3 + 22}" r="6" fill="white" opacity="0.8"/>`
  }
</svg>`.trim();

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
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      mapContainerClassName={className}
      center={userLocation ?? AU_CENTER}
      zoom={validVenues.length > 0 ? 10 : 5}
      onLoad={(map) => {
        mapRef.current = map;
      }}
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
        const iconSize = isSelected ? 52 : 42;
        const iconHeight = isSelected ? 64 : 52;

        return (
          <MarkerF
            key={venue.id}
            position={{ lat: venue.lat, lng: venue.lng }}
            title={venue.name}
            zIndex={isSelected ? 999 : hasSessions ? 2 : 1}
            onClick={() => onMarkerClick(venue.id)}
            icon={{
              url: iconUrl,
              scaledSize: new google.maps.Size(iconSize, iconHeight),
              anchor: new google.maps.Point(iconSize / 2, iconHeight - 4),
            }}
          />
        );
      })}

      {/* ── InfoWindow tooltip for selected venue ── */}
      {selectedVenue && (
        <InfoWindowF
          position={{ lat: selectedVenue.lat, lng: selectedVenue.lng }}
          options={{
            pixelOffset: new google.maps.Size(0, -(selectedVenue.id === selectedVenueId ? 64 : 52) + 4),
            disableAutoPan: true,
          }}
          onCloseClick={() => onMarkerClick(selectedVenue.id)} // toggles off
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

      {/* ── User location blue dot ── */}
      {userLocation && (
        <MarkerF
          position={userLocation}
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
  );
}
