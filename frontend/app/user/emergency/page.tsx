"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {ArrowLeft,MapPin,Siren,Send,Phone,AlertTriangle,} from "lucide-react";
import { apiRequest } from "../../../lib/api";
export default function EmergencyPage() {
  const [emergencyType, setEmergencyType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const useGps = () => {
    if (!navigator.geolocation) {
      setMessage("GPS is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        setMessage("GPS location captured. You can submit this request now.");
      },
      () => setMessage("Please allow location access or enter your location and try again."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (latitude === null || longitude === null) { setMessage("Please use GPS to capture your current location."); return; }
    setLoading(true);
    try {
      await apiRequest("/help-requests", { method: "POST", body: JSON.stringify({ request_type: "emergency", emergency_type: emergencyType, title: emergencyType || "Emergency assistance", description, latitude, longitude, address }) }, localStorage.getItem("token"));
      setMessage("Emergency request sent for manager verification.");
      setTimeout(() => router.push("/dashboard/seeker"), 900);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send request."); }
    finally { setLoading(false); }
  };
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/user/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600">
            <ArrowLeft size={18} />Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white">
              <Siren size={20} />
            </div>
            <span className="font-bold text-slate-900">HelpBridge</span>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <Siren size={30} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Emergency SOS</h1>
          <p className="mt-2 text-slate-500"> Request immediate assistance for an emergency situation.</p>
        </div>
        <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle size={21} className="mt-0.5 shrink-0 text-red-600"/>
          <div>
            <p className="font-semibold text-red-800">Use this only for genuine emergencies</p>
            <p className="mt-1 text-sm text-red-700">Examples include accidents, natural disasters, medical emergencies, and urgent blood requirements.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900"> Emergency Details</h2>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700"> Emergency Type</label>
            <select required value={emergencyType} onChange={(event) => setEmergencyType(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100">
              <option value="">Select emergency type</option>
              <option>Accident</option>
              <option>Medical Emergency</option>
              <option>Blood Requirement</option>
              <option>Flood</option>
              <option>Earthquake</option>
              <option>Fire</option>
              <option>Other</option>
            </select>
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Describe the Emergency</label>
            <textarea required value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Explain what happened and what kind of help is required..." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"/>
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700"> Current Location </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required value={address} onChange={(event) => setAddress(event.target.value)} type="text" placeholder="Enter your current location" className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100" />
              </div>
              <button type="button" onClick={useGps} className="rounded-xl bg-slate-100 px-4 font-semibold text-slate-700 hover:bg-slate-200">Use GPS</button>
            </div>
            {latitude !== null && longitude !== null && (
              <p className="mt-2 text-xs text-emerald-700">
                GPS coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Number of People Requiring Help</label>
            <input type="number" min="1" placeholder="Example: 2" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100" />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Contact Number</label>
            <div className="relative">
              <Phone size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"/>
            </div>
          </div>
          {message && <p role="status" className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}
          <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 py-4 text-lg font-bold text-white transition hover:bg-red-700 disabled:opacity-60">
            <Siren size={23} />{loading ? "Sending..." : "Send Emergency SOS"}
            <Send size={20} />
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">Your request will be sent to the HelpBridge manager for emergency verification.
          </p>
        </form>
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex gap-3">
            <Phone size={20} className="mt-0.5 text-blue-600"/>
            <div>
              <p className="font-semibold text-blue-900"> Immediate danger? </p>
              <p className="mt-1 text-sm text-blue-700">If you are facing a life-threatening situation, contact your local emergency services immediately. </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
