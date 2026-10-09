"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Check, Clock, MapPin } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type Notification = {
  id: number;
  request_id: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function ProviderNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [gpsOn, setGpsOn] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);

  const turnGpsOn = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await apiRequest("/profile/location", { method: "PATCH", body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }) }, localStorage.getItem("token"));
        setGpsOn(true);
        setError("");
      } catch (locationError) {
        setError(locationError instanceof Error ? locationError.message : "Unable to update GPS location.");
      } finally {
        setGpsBusy(false);
      }
    }, (locationError) => {
      setGpsBusy(false);
      setError(locationError.message || "GPS permission is required.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view provider notifications.");
        return;
      }
      const data = await apiRequest("/notifications", {}, token);
      setNotifications(data.notifications || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    void loadNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" }, localStorage.getItem("token"));
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Unable to update notification.");
    }
  };

  const readyToHelp = async (notification: Notification) => {
    if (!notification.request_id) return;
    if (!gpsOn) {
      setError("Turn GPS on before selecting I am ready to help.");
      return;
    }
    setBusyId(notification.id);
    setError("");
    try {
      const data = await apiRequest(
        `/provider/requests/${notification.request_id}/express-interest`,
        { method: "POST" },
        localStorage.getItem("token"),
      );
      alert(data.message || "Your GPS location was evaluated and the nearest provider was assigned.");
      await markAsRead(notification.id);
      await loadNotifications();
    } catch (readyError) {
      setError(readyError instanceof Error ? readyError.message : "Unable to accept this request.");
    } finally {
      setBusyId(null);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/provider/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft size={18} />Back to Provider Dashboard</Link>
          <div className="flex items-center gap-3"><button type="button" onClick={turnGpsOn} disabled={gpsBusy || gpsOn} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"><MapPin size={14} />{gpsOn ? "GPS on" : gpsBusy ? "Turning GPS on..." : "Turn GPS on"}</button><Link href="/provider/available-requests" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Available requests</Link></div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8 flex items-end justify-between gap-4"><div><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"><Bell size={30} /></div><h1 className="text-3xl font-bold text-slate-900">Provider Notifications</h1><p className="mt-2 text-slate-500">New approved requests appear here. Use your GPS location to respond when you are ready to help.</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">{unreadCount} unread</span></div>
        {loading && <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Loading notifications...</div>}
        {!loading && error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!loading && !error && notifications.length === 0 && <div className="rounded-2xl border bg-white p-12 text-center shadow-sm"><Bell size={40} className="mx-auto text-slate-300" /><h2 className="mt-4 font-bold text-slate-800">No provider notifications yet</h2><p className="mt-1 text-sm text-slate-500">Approved requests will appear here after manager approval.</p></div>}
        <div className="space-y-3">{notifications.map((notification) => { const isAvailableRequest = notification.type === "broadcast_request" && notification.request_id; return <article key={notification.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${notification.is_read ? "border-slate-200" : "border-blue-200 bg-blue-50/40"}`}><div className="flex gap-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.is_read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"}`}><Bell size={19} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-bold text-slate-900">{notification.title}</h2><span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={13} />{new Date(notification.created_at).toLocaleString()}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p><div className="mt-3 flex flex-wrap items-center gap-3">{isAvailableRequest && <button disabled={busyId === notification.id} onClick={() => void readyToHelp(notification)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><MapPin size={16} />{busyId === notification.id ? "Checking GPS..." : "I am ready to help"}</button>}{!notification.is_read && <button onClick={() => void markAsRead(notification.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"><Check size={16} />Mark as read</button>}</div></div></div></article>; })}</div>
      </div>
    </main>
  );
}

