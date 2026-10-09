"use client";

import React, { useState } from "react";
import axios from "axios";
import GpsTracker from "@/components/GpsTracker";
import LiveTrackingMap from "@/components/LiveTrackingMap";
import { AlertTriangle, ShieldAlert, Radio, CheckCircle, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SosPage() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [title, setTitle] = useState("EMERGENCY MEDICAL / SAFETY HELP NEEDED");
  const [emergencyType, setEmergencyType] = useState("Medical Emergency");
  const [submitting, setSubmitting] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const handleTriggerSOS = async () => {
    if (!coords) {
      alert("Please wait for GPS satellite location to acquire before triggering SOS.");
      return;
    }

    setSubmitting(true);
    setStatusMsg("Broadcasting SOS Emergency Signal to all nearby providers...");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/help-requests`,
        {
          request_type: "emergency",
          emergency_type: emergencyType,
          title: title,
          description: `Emergency alert triggered at ${coords.latitude.toFixed(5)}° N, ${coords.longitude.toFixed(5)}° E. Immediate response required.`,
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: `GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const request = res.data.request;
      setActiveRequestId(request.id);
      setStatusMsg(res.data.message || "🚨 SOS Request Sent to Manager! Awaiting manager approval before broadcasting to nearest providers...");
    } catch (err: any) {
      console.error("SOS trigger error:", err);
      alert(err.response?.data?.message || "Failed to broadcast SOS emergency.");
      setStatusMsg("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background emergency glow pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-xs px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-ping" /> HELPBRIDGE EMERGENCY SOS
          </span>
        </div>

        {/* Live GPS Tracker */}
        <GpsTracker onLocationUpdate={(c) => setCoords(c)} />

        {!activeRequestId ? (

          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-4 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/30 mb-2">
                <AlertTriangle className="w-12 h-12 animate-bounce" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Emergency SOS Broadcast
              </h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Pressing the button below will instantly alert all verified providers in HelpBridge with your live GPS location.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Emergency Category
                </label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-rose-500"
                >
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Fire Hazard">Fire Hazard</option>
                  <option value="Accident / Rescue">Accident / Rescue</option>
                  <option value="Personal Safety Threat">Personal Safety Threat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Emergency Note / Description
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Big Red Panic Button */}
            <button
              onClick={handleTriggerSOS}
              disabled={submitting || !coords}
              id="btn-trigger-sos"
              className="w-full py-5 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xl rounded-2xl shadow-2xl shadow-rose-600/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 border border-rose-400/40"
            >
              <ShieldAlert className="w-7 h-7" />
              {submitting ? "BROADCASTING SOS..." : "TRIGGER INSTANT EMERGENCY SOS"}
            </button>
          </div>
        ) : (

          <div className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-400">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Emergency Signal Broadcasted Successfully!</h4>
                <p className="text-xs text-emerald-300/80 mt-0.5">{statusMsg}</p>
              </div>
            </div>

            {/* Live Map Tracking Component */}
            <LiveTrackingMap requestId={activeRequestId} />
          </div>
        )}
      </div>
    </main>
  );
}

