"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wrench, MapPin, Send, Phone, Info, LoaderCircle, Camera, Upload, X } from "lucide-react";
import { apiRequest } from "../../../lib/api";

export default function NonEmergencyPage() {
  const [helpType, setHelpType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("/user/dashboard");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.id) {
          setDashboardUrl(`/user/${u.id}/dashboard`);
        }
      }
    } catch {
      // fallback to /user/dashboard
    }
  }, []);

  const useGps = () => {
    setGpsLoading(true);
    setMessage("Capturing GPS location...");

    if (typeof window === "undefined" || !navigator.geolocation) {
      setLatitude(17.3850);
      setLongitude(78.4867);
      if (!address) setAddress("Hyderabad, Telangana");
      setMessage("GPS not supported on this device. Default coordinates set.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setGpsLoading(false);
        setMessage("Location captured successfully!");

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else if (!address) {
            setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
          }
        } catch {
          if (!address) {
            setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
          }
        }
      },
      (error) => {
        console.warn("Geolocation warning:", error);
        setGpsLoading(false);
        // Fallback gracefully so user can continue without getting stuck
        setLatitude(17.3850);
        setLongitude(78.4867);
        if (!address) setAddress("Hyderabad, Telangana");
        setMessage("Browser GPS access was unavailable or denied. Location coordinates set (you can edit your location).");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    let lat = latitude;
    let lon = longitude;

    // If user hasn't pressed GPS yet or it failed, resolve coordinates
    if (lat === null || lon === null) {
      if (address.trim()) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}`
          );
          const data = await res.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lon = parseFloat(data[0].lon);
            setLatitude(lat);
            setLongitude(lon);
          }
        } catch {
          // Ignore geocoding network errors
        }
      }

      // Default fallback coordinates if address couldn't be geocoded
      if (lat === null || lon === null) {
        lat = 17.3850;
        lon = 78.4867;
        setLatitude(lat);
        setLongitude(lon);
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("request_type", "non_emergency");
      formData.append("title", helpType || "General assistance");
      formData.append("description", description);
      formData.append("latitude", String(lat));
      formData.append("longitude", String(lon));
      formData.append("address", address || "Location specified");
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      await apiRequest(
        "/help-requests",
        {
          method: "POST",
          body: formData,
        },
        localStorage.getItem("token")
      );
      setMessage("Help request submitted successfully! Returning to your dashboard...");
      setTimeout(() => router.push(dashboardUrl), 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link
            href={dashboardUrl}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
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
          <p className="mt-2 text-slate-500">
            Get assistance for situations that are not immediately life-threatening.
          </p>
        </div>

        <div className="mb-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info size={21} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-800">Non-emergency assistance</p>
            <p className="mt-1 text-sm text-blue-700">
              Choose your help type, submit the request, and a manager will approve it.
              Available providers click &quot;I am ready to help&quot;; HelpBridge assigns the
              nearest provider within 5 minutes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Help Request Details</h2>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Type of Help</label>
            <select
              required
              value={helpType}
              onChange={(event) => setHelpType(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select type of help</option>
              <option>Car Breakdown</option>
              <option>Vehicle Problem</option>
              <option>Transport Assistance</option>
              <option>Roadside Assistance</option>
              <option>Other</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Describe Your Requirement
            </label>
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="Describe the help you need..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Current Location</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  type="text"
                  placeholder="Enter your location"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={useGps}
                disabled={gpsLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              >
                {gpsLoading ? <LoaderCircle size={16} className="animate-spin" /> : null}
                Use GPS
              </button>
            </div>
            {latitude && longitude && (
              <p className="mt-2 text-xs text-emerald-600">
                Coordinates ready: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Camera size={16} className="text-blue-500" /> Attach Reference Photo (Optional)
              </span>
              <span className="text-xs font-normal text-slate-400">JPG, PNG, WEBP up to 10MB</span>
            </label>

            {!imagePreview ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition hover:border-blue-400 hover:bg-blue-50/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Upload size={20} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">Click to upload photo or drag & drop</p>
                <p className="text-xs text-slate-400">Add a picture of the issue (e.g. flat tire, leak, etc.)</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setSelectedImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                <div className="relative aspect-video max-h-56 w-full overflow-hidden rounded-lg bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Photo preview"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-600">
                  <span className="truncate max-w-[250px] font-medium">{selectedImage?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 font-semibold text-red-600 hover:bg-red-50"
                  >
                    <X size={14} /> Remove photo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Preferred Assistance Time
            </label>
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
              <Phone size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {message && (
            <p role="status" className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
              {message}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 shadow-md"
          >
            <Send size={21} /> {loading ? "Submitting..." : "Submit Help Request"}
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">
            A suitable help provider will be assigned based on your request and location.
          </p>
        </form>
      </div>
    </main>
  );
}
