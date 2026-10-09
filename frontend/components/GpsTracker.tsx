"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigation, MapPin, CheckCircle, AlertCircle } from "lucide-react";

interface GpsTrackerProps {
  onLocationUpdate?: (coords: { latitude: number; longitude: number }) => void;
}

export default function GpsTracker({ onLocationUpdate }: GpsTrackerProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "active" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const requestGPS = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setStatus("locating");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setStatus("active");

        if (onLocationUpdate) {
          onLocationUpdate({ latitude, longitude });
        }

        const token = localStorage.getItem("token");
        if (token) {
          try {
            await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/location/update`,
              { latitude, longitude },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (err) {
            console.error("Failed to sync location to server:", err);
          }
        }
      },
      (err) => {
        setStatus("error");
        setErrorMessage(err.message || "Failed to acquire GPS coordinates.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  useEffect(() => {
    requestGPS();
    const interval = setInterval(requestGPS, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center justify-between text-white text-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-slate-200 flex items-center gap-2">
            <span>GPS Tracking System</span>
            {status === "active" && (
              <span className="inline-flex items-center text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle className="w-3 h-3 mr-1" /> Active
              </span>
            )}
          </div>
          <div className="text-slate-400 text-xs mt-0.5">
            {status === "locating" && "Acquiring live satellite coordinates..."}
            {status === "active" && coords && (
              <span className="font-mono text-emerald-300">
                {coords.latitude.toFixed(5)}° N, {coords.longitude.toFixed(5)}° E
              </span>
            )}
            {status === "error" && <span className="text-rose-400">{errorMessage}</span>}
          </div>
        </div>
      </div>
      <button
        onClick={requestGPS}
        id="btn-refresh-gps"
        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
      >
        <MapPin className="w-3.5 h-3.5" /> Recalibrate
      </button>
    </div>
  );
}

