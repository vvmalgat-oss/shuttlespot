"use client";

import { useState, useEffect, useCallback } from "react";

export type LocStatus = "requesting" | "granted" | "denied";

export type UserLocation = { lat: number; lng: number };

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<LocStatus>("requesting");

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { location, status, request };
}
