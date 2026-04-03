"use client";

import { GoogleMap, MarkerF, CircleF, useJsApiLoader, Libraries } from "@react-google-maps/api";

// Defined outside component — must match SearchModal.tsx to avoid "LoadScript reloaded" warnings.
const LIBRARIES: Libraries = ["places"];
import { useEffect, useMemo, useRef } from "react";

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

  // Frozen on first render — never changes.
  // @react-google-maps/api calls panTo() whenever the `center` prop object changes,
  // so keeping it stable ensures the library NEVER overrides our imperative panning.
  // All positioning after mount is handled by the useEffect hooks below.
  const initialCenter = useRef(center ?? userLocation ?? defaultCenter);

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

  // Fit all venues into view when no venue is selected.
  useEffect(() => {
    if (!mapRef.current || validVenues.length === 0 || selectedVenue) return;
    const bounds = new google.maps.LatLngBounds();
    validVenues.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
    if (userLocation) bounds.extend(userLocation);
    mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [validVenues, selectedVenue, userLocation]);

  const containerStyle = { width: "100%", height: fullHeight ? "100%" : "500px" };

  const placeholder = (msg: string) => (
    <div
      className={`flex items-center justify-center text-center text-[13px] text-slate-400 ${className}`}
      style={{ height: fullHeight ? "100%" : "500px", background: "#f8fafc" }}
    >
      {msg}
    </div>
  );

  if (!apiKey) return placeholder("Google Maps API key is missing");
  if (loadError) return placeholder("Failed to load Google Maps");
  if (!isLoaded) return placeholder("Loading map...");

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      mapContainerClassName={className}
      center={initialCenter.current}
      zoom={12}
      onLoad={(map) => { mapRef.current = map; }}
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

      {userLocation && (
        <>
          <CircleF
            center={userLocation}
            radius={200}
            options={{
              fillColor: "#4285F4", fillOpacity: 0.12,
              strokeColor: "#4285F4", strokeOpacity: 0.3, strokeWeight: 1, zIndex: 1,
            }}
          />
          <CircleF
            center={userLocation}
            radius={40}
            options={{
              fillColor: "#4285F4", fillOpacity: 1,
              strokeColor: "#ffffff", strokeOpacity: 1, strokeWeight: 3, zIndex: 1001,
            }}
          />
        </>
      )}
    </GoogleMap>
  );
}
