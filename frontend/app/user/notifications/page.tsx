"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Check, Clock, ShieldCheck, MapPin, MessageSquare, Activity } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeRequests, setActiveRequests] = useState<Array<{id: number; title: string; status: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your notifications.");
          return;
        }
        const [notifData, reqData] = await Promise.allSettled([
          apiRequest("/notifications", {}, token),
          apiRequest("/help-requests/my", {}, token),
        ]);
        if (notifData.status === "fulfilled") setNotifications(notifData.value.notifications || []);
        if (reqData.status === "fulfilled") {
          const all = reqData.value.requests || [];
          setActiveRequests(all.filter((r: {status: string}) => ["assigned","accepted","in_progress"].includes(r.status)));
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" }, token);
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Unable to update notification.");
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/user/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft size={18} />Back to Dashboard</Link>
          <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><ShieldCheck size={20} /></div><span className="font-bold text-slate-900">HelpBridge</span></div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8 flex items-end justify-between gap-4"><div><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"><Bell size={30} /></div><h1 className="text-3xl font-bold text-slate-900">Notifications</h1><p className="mt-2 text-slate-500">Updates about your requests and account.</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">{unreadCount} unread</span></div>
        {loading && <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Loading notifications...</div>}
        {!loading && error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!loading && !error && notifications.length === 0 && <div className="rounded-2xl border bg-white p-12 text-center shadow-sm"><Bell size={40} className="mx-auto text-slate-300" /><h2 className="mt-4 font-bold text-slate-800">You&apos;re all caught up</h2><p className="mt-1 text-sm text-slate-500">New updates will appear here.</p></div>}
        {!loading && activeRequests.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Activity size={18} className="text-emerald-600" />
              <h2 className="font-bold text-slate-800">Track Your Active Requests</h2>
            </div>
            <div className="space-y-3">
              {activeRequests.map((r) => (
                <div key={r.id} className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-bold text-emerald-800">{r.status === "in_progress" ? "🟢 Provider is helping you now" : r.status === "accepted" ? "🔵 Provider is on the way!" : "🟡 Provider has been assigned"}</p>
                      <p className="mt-0.5 text-sm text-emerald-700">{r.title}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/requests/${r.id}/track`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"><MapPin size={14} /> Track</Link>
                    <Link href={`/requests/${r.id}/chat`} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"><MessageSquare size={14} /> Chat</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="space-y-3">{notifications.map((notification) => <article key={notification.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${notification.is_read ? "border-slate-200" : "border-blue-200 bg-blue-50/40"}`}><div className="flex gap-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.is_read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"}`}><Bell size={19} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-bold text-slate-900">{notification.title}</h2><span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={13} />{new Date(notification.created_at).toLocaleDateString()}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>{!notification.is_read && <button onClick={() => markAsRead(notification.id)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"><Check size={16} />Mark as read</button>}</div></div></article>)}</div>
      </div>
    </main>
  );
}

