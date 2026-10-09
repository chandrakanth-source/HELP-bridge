"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, LoaderCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  request_id: number | null;
  is_read: boolean;
  created_at: string;
};

export default function ManagerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const loadNotifications = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiRequest("/notifications", {}, localStorage.getItem("token"));
      setNotifications(data.notifications || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialNotifications = async () => {
      try {
        const data = await apiRequest("/notifications", {}, localStorage.getItem("token"));
        if (!cancelled) setNotifications(data.notifications || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load notifications.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadInitialNotifications();
    return () => { cancelled = true; };
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" }, localStorage.getItem("token"));
      setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, is_read: true } : notification));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update notification.");
    }
  };

  const visibleNotifications = filter === "unread" ? notifications.filter((notification) => !notification.is_read) : notifications;

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#12234b]">Notifications</h1>
          <p className="mt-2 text-slate-500">Stay updated on requests, providers, and account activity.</p>
        </div>
        <button onClick={loadNotifications} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw size={17} /> Refresh
        </button>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button onClick={() => setFilter("all")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === "all" ? "bg-blue-600 text-white" : "border bg-white text-slate-600 hover:bg-slate-50"}`}>All notifications</button>
        <button onClick={() => setFilter("unread")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === "unread" ? "bg-blue-600 text-white" : "border bg-white text-slate-600 hover:bg-slate-50"}`}>Unread ({unreadCount})</button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
        {error && <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading notifications...</div>
        ) : visibleNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center"><Bell className="mx-auto text-slate-300" size={30} /><p className="mt-3 text-sm text-slate-500">You are all caught up.</p></div>
        ) : (
          <div className="divide-y">
            {visibleNotifications.map((notification) => (
              <article key={notification.id} className={`flex gap-4 px-5 py-5 ${notification.is_read ? "bg-white" : "bg-blue-50/40"}`}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${notification.is_read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"}`}><Bell size={19} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><h2 className="font-bold text-slate-800">{notification.title}</h2><time className="text-xs text-slate-400">{new Date(notification.created_at).toLocaleString()}</time></div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                  {notification.request_id && <p className="mt-2 text-xs font-semibold text-slate-400">Request #{notification.request_id}</p>}
                </div>
                {!notification.is_read && <button onClick={() => markAsRead(notification.id)} className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50" title="Mark as read"><Check size={15} /> <span className="hidden sm:inline">Mark read</span></button>}
                {notification.is_read && <CheckCheck className="mt-1 shrink-0 text-green-500" size={19} aria-label="Read" />}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

