"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {ArrowLeft,Wrench,MapPin,Send,Phone,Info,} from "lucide-react";
import { apiRequest } from "../../../lib/api";
export default function NonEmergencyPage() {
  const [helpType, setHelpType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const useGps = () => {
    if (!navigator.geolocation) { setMessage("GPS is not available in this browser."); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLatitude(coords.latitude); setLongitude(coords.longitude); setMessage("Location captured."); },
      () => setMessage("Please allow location access or enter your location and try again."),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (latitude === null || longitude === null) { setMessage("Please use GPS to capture your current location."); return; }
    setLoading(true);
    try {
      await apiRequest("/help-requests", { method: "POST", body: JSON.stringify({ request_type: "non_emergency", title: helpType || "General assistance", description, latitude, longitude, address }) }, localStorage.getItem("token"));
      setMessage("Help request submitted successfully.");
      setTimeout(() => router.push("/dashboard/seeker"), 900);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send request."); }
    finally { setLoading(false); }
  };
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/user/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600" >
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wrench size={20} />
            </div>
            <span className="font-bold text-slate-900">HelpBridge</span>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Wrench size={30} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Request Non-Emergency Help</h1>
          <p className="mt-2 text-slate-500">Get assistance for situations that are not immediately life-threatening.</p>
        </div>
        <div className="mb-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info size={21} className="mt-0.5 shrink-0 text-blue-600"/>
          <div>
            <p className="font-semibold text-blue-800"> Non-emergency assistance </p>
            <p className="mt-1 text-sm text-blue-700">
              Choose your help type, submit the request, and a manager will approve it. Available providers click
              &quot;I am ready to help&quot;; HelpBridge assigns the nearest provider within 5 minutes.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Help Request Details</h2>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Type of Help</label>
            <select required value={helpType} onChange={(event) => setHelpType(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="">Select type of help</option>
              <option>Car Breakdown</option>
              <option> Vehicle Problem</option>
              <option>Transport Assistance</option>
              <option>  Roadside Assistance</option>
              <option>Other </option>
            </select>
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700"> Describe Your Requirement </label>
            <textarea required value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Describe the help you need..." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Current Location </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input required value={address} onChange={(event) => setAddress(event.target.value)} type="text" placeholder="Enter your location" className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/>
              </div>
              <button type="button" onClick={useGps} className="rounded-xl bg-slate-100 px-4 font-semibold text-slate-700 hover:bg-slate-200"> Use GPS</button>
            </div>
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred Assistance Time</label>
            <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option>As soon as possible</option>
              <option>Within 30 minutes</option>
              <option>Within 1 hour</option>
              <option>Later today</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Contact Number</label>
            <div className="relative">
              <Phone size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/>
            </div>
          </div>
          {message && <p role="status" className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}
          <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white transition hover:bg-blue-700 disabled:opacity-60" >
            <Send size={21} /> {loading ? "Submitting..." : "Submit Help Request"}
          </button>
          <p className="mt-4 text-center text-xs text-slate-400"> A suitable help provider will be assigned based on your request and location.</p>
        </form>
      </div>
    </main>
  );
}
