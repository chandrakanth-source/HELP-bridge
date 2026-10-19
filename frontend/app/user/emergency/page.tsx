"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Siren,
  Send,
  Phone,
  AlertTriangle,
  LoaderCircle,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { apiRequest } from "../../../lib/api";

export default function EmergencyPage() {
  const [emergencyType, setEmergencyType] = useState("");
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
      // fallback
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
        setMessage("GPS location captured successfully!");

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
        setLatitude(17.3850);
        setLongitude(78.4867);
        if (!address) setAddress("Hyderabad, Telangana");
        setMessage("Browser GPS access was unavailable or denied. Location coordinates set (you can edit your address).");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    let lat = latitude;
    let lon = longitude;

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
      formData.append("request_type", "emergency");
      formData.append("emergency_type", emergencyType);
      formData.append("title", emergencyType || "Emergency assistance");
      formData.append("description", description);
      formData.append("latitude", String(lat));
      formData.append("longitude", String(lon));
      formData.append("address", address || "Emergency Location");
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
      setMessage("Emergency request sent for manager verification! Returning to your dashboard...");
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
          <p className="mt-2 text-slate-500">
            Request immediate assistance for an emergency situation.
          </p>
        </div>

        <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle size={21} className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Use this only for genuine emergencies</p>
            <p className="mt-1 text-sm text-red-700">
              Examples include accidents, natural disasters, medical emergencies, and urgent blood requirements.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Emergency Details</h2>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Emergency Type</label>
            <select
              required
              value={emergencyType}
              onChange={(event) => setEmergencyType(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            >
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
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Describe the Emergency
            </label>
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="Explain what happened and what kind of help is required..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
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
                  placeholder="Enter your current location"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
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
            {latitude !== null && longitude !== null && (
              <p className="mt-2 text-xs text-emerald-700">
                GPS coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Camera size={16} className="text-red-500" /> Attach Incident Photo (Optional)
              </span>
              <span className="text-xs font-normal text-slate-400">JPG, PNG, WEBP up to 10MB</span>
            </label>

            {!imagePreview ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition hover:border-red-400 hover:bg-red-50/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Upload size={20} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">Click to upload photo or drag & drop</p>
                <p className="text-xs text-slate-400">Helps responders quickly assess the situation</p>
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
                    alt="Incident preview"
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
              Number of People Requiring Help
            </label>
            <input
              type="number"
              min="1"
              placeholder="Example: 2"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Contact Number</label>
            <div className="relative">
              <Phone size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
              />
            </div>
          </div>

          {message && (
            <p role="status" className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
              {message}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 py-4 text-lg font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            <Siren size={23} />
            {loading ? "Sending..." : "Send Emergency SOS"}
            <Send size={20} />
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">
            Your request will be sent to the HelpBridge manager for emergency verification.
          </p>
        </form>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex gap-3">
            <Phone size={20} className="mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Immediate danger?</p>
              <p className="mt-1 text-sm text-blue-700">
                If you are facing a life-threatening situation, contact your local emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
