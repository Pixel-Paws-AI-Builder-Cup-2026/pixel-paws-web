"use client";
import { useCallback, useState } from "react";

// Shared GPS helper: status is idle | locating | ready | error
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const request = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setStatus("error");
        setError("Location isn't available on this device.");
        resolve(null);
        return;
      }
      setStatus("locating");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCoords(c);
          setStatus("ready");
          setError("");
          resolve(c);
        },
        () => {
          setStatus("error");
          setError("Couldn't get your location. Allow location access and try again.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }, []);

  return { coords, status, error, request };
}
