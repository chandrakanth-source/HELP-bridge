"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigation, MapPin, UserCheck, ShieldCheck, Clock, RefreshCw } from "lucide-react";

interface LiveTrackingMapProps {
  requestId: string | number;
}

interface TrackingData {
  request_id: number;
  title: string;
  status: string;
  requester_name: string;
  requester_phone: string;
  requester_live_lat?: number;
  requester_live_lon?: number;
  request_latitude: number;
  request_longitude: number;
  provider_name?: string;
  provider_phone?: string;
  provider_live_lat?: number;
  provider_live_lon?: number;
  distance_km?: number | null;
}

export default function LiveTrackingMap({ requestId }: LiveTrackingMapProps) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTracking = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/location/track/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data.tracking);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load live tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 animate-pulse">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
        Initializing Live Telemetry Map...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const seekerLat = data.requester_live_lat || data.request_latitude;
  const seekerLon = data.requester_live_lon || data.request_longitude;
  const provLat = data.provider_live_lat;
  const provLon = data.provider_live_lon;
  const distance = data.distance_km;

  const etaMinutes = distance ? Math.ceil((distance / 30) * 60) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Map Header Telemetry Bar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              HelpBridge Live Telemetry Tracker
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live Dynamic
              </span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Request #{data.request_id} • Status: <span className="uppercase text-amber-400 font-semibold">{data.status}</span></p>
          </div>
        </div>

        {distance !== null && distance !== undefined && (
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
            <div>
              <div className="text-xs text-slate-400">Live Distance</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">{distance} km</div>
            </div>
            {etaMinutes && (
              <div className="border-l border-slate-800 pl-4">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" /> Est. Arrival
                </div>
                <div className="text-lg font-bold text-indigo-300 font-mono">~{etaMinutes} mins</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simulated Map Visual Canvas */}
      <div className="relative h-72 bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Radar Map Grid Background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* OpenStreetMap Embed Frame */}
        <iframe
          title="Live Map"
          width="100%"
          height="100%"
          className="filter opacity-85 contrast-125"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${seekerLon - 0.03}%2C${seekerLat - 0.03}%2C${seekerLon + 0.03}%2C${seekerLat + 0.03}&layer=mapnik&marker=${seekerLat}%2C${seekerLon}`}
        />

        {/* Telemetry Overlay Badges */}
        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Seeker Location</div>
            <div className="text-xs font-semibold text-white">{data.requester_name}</div>
          </div>
        </div>

        {data.provider_name && (
          <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Assigned Provider</div>
              <div className="text-xs font-semibold text-white flex items-center gap-1">
                {data.provider_name} <ShieldCheck className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Directions + footer */}
      <div className="bg-slate-950 px-4 py-3 border-t border-slate-800/80 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${seekerLat},${seekerLon}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition"
        >
          <Navigation className="w-4 h-4" />
          Get turn-by-turn directions
        </a>
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 sm:justify-end">
          <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          <button
            type="button"
            onClick={fetchTracking}
            className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Sync Now
          </button>
        </div>
      </div>
    </div>
  );
}

