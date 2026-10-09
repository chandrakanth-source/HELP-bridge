"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import {
  Siren, ClipboardCheck, Activity, Users, BarChart3, ChevronRight, MapPin, Eye, CheckCircle, Clock, ShieldCheck,
  AlertTriangle, CalendarDays,
} from "lucide-react";
import { formatRelativeTime } from "../../../lib/datetime";

type PendingRequest = {
  id: number;
  title: string;
  description: string | null;
  address: string | null;
  emergency_type: string | null;
  created_at: string;
};

type DashboardStats = {
  pending_count: number;
  active_count: number;
  verified_count: number;
  completed_count: number;
  total_count: number;
  unread_notifications: number;
};

function EmergencyIcon({ type }: { type: string | null }) {
  const iconProps = { size: 20 };

  if (type?.toLowerCase().includes("medical")) return <Activity {...iconProps} />;
  if (type?.toLowerCase().includes("fire")) return <AlertTriangle {...iconProps} />;
  return <Siren {...iconProps} />;
}
export default function ManagerDashboard() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    const loadData = async () => {
      try {
        const [statsData, requestsData] = await Promise.all([
          apiRequest("/manager/dashboard/stats", {}, token),
          apiRequest("/manager/requests/pending", {}, token),
        ]);
        setStats(statsData);
        setPendingRequests(requestsData.requests || []);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load dashboard data.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
  return (
    <>
          <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#12234b]">Welcome back, Manager!</h2>
              <p className="mt-2 text-slate-500"> Monitor, verify and manage emergency requests efficiently. </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-white px-5 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <CalendarDays size={21} className="text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{formattedDate}</p>
                <p className="text-xs text-slate-500">{formattedTime}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Pending Verification" value={isLoading ? "-" : String(stats?.pending_count ?? 0)} description="Requires your attention" icon={<ClipboardCheck size={25} />} color="red" />
            <StatCard title="Active Requests" value={isLoading ? "-" : String(stats?.active_count ?? 0)} description="Currently in progress" icon={<Activity size={25} />} color="blue" />
            <StatCard title="Assigned Requests" value={isLoading ? "-" : String(stats?.verified_count ?? 0)} description="Provider assigned" icon={<Users size={25} />} color="green" />
            <StatCard title="Completed Requests" value={isLoading ? "-" : String(stats?.completed_count ?? 0)} description="This month" icon={<CheckCircle size={25} />} color="purple" />
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-6 py-5">
                <div>
                  <h3 className="text-lg font-bold text-[#12234b]">Recent Emergency Requests </h3>
                </div>
                <Link href="/manager/emergency_requests" className="text-sm font-semibold text-blue-600 hover:text-blue-700"> View All  </Link>
              </div>

              <div className="divide-y">
                {isLoading && <p className="px-6 py-10 text-center text-sm text-slate-500">Loading emergency requests...</p>}
                {!isLoading && error && <p className="px-6 py-10 text-center text-sm text-red-600">{error}</p>}
                {!isLoading && !error && pendingRequests.length === 0 && <p className="px-6 py-10 text-center text-sm text-slate-500">No emergency requests are waiting for verification.</p>}
                {!isLoading && !error && pendingRequests.map((request) => (
                  <RequestItem
                    key={request.id}
                    icon={<EmergencyIcon type={request.emergency_type} />}
                    iconColor="red"
                    title={request.title}
                    description={request.description || "Emergency assistance requested"}
                    location={request.address || "Location unavailable"}
                    distance="--"
                    status="Pending"
                    time={formatRelativeTime(request.created_at)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#12234b]"> Request Status Overview</h3>
                {stats && (() => {
                  const total = stats.total_count || 1;
                  const pendingPct = (stats.pending_count / total) * 100;
                  const activePct = (stats.active_count / total) * 100;
                  const verifiedPct = (stats.verified_count / total) * 100;
                  const p1 = pendingPct;
                  const p2 = p1 + activePct;
                  const p3 = p2 + verifiedPct;
                  return (
                    <div className="mt-7 flex items-center justify-center">
                      <div className={`relative flex h-44 w-44 items-center justify-center rounded-full`}
                        style={{ background: `conic-gradient(#f59e0b 0 ${p1}%,#3b82f6 ${p1}% ${p2}%,#22c55e ${p2}% ${p3}%,#8b5cf6 ${p3}% 100%)` }}>
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white">
                          <div className="text-center">
                            <p className="text-xl font-bold text-slate-800">{stats.total_count}</p>
                            <p className="text-[10px] text-slate-500">Total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {isLoading && <div className="mt-7 flex justify-center"><div className="h-44 w-44 animate-pulse rounded-full bg-slate-100" /></div>}
                <div className="mt-7 space-y-3">
                  <StatusLegend color="bg-amber-500" label="Pending" value={isLoading ? "-" : String(stats?.pending_count ?? 0)} />
                  <StatusLegend color="bg-blue-500" label="Active" value={isLoading ? "-" : String(stats?.active_count ?? 0)} />
                  <StatusLegend color="bg-green-500" label="Verified" value={isLoading ? "-" : String(stats?.verified_count ?? 0)} />
                  <StatusLegend color="bg-purple-500" label="Completed" value={isLoading ? "-" : String(stats?.completed_count ?? 0)} />
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#12234b]"> Quick Actions </h3>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <QuickAction href="/manager/pending-verification" icon={<ClipboardCheck size={20} />} title="Verify Requests" color="red" />
                  <QuickAction href="/manager/providers" icon={<Users size={20} />} title="View Providers" color="blue" />
                  <QuickAction href="/manager/active-requests" icon={<Activity size={20} />} title="Active Requests" color="green" />
                  <QuickAction href="/manager/reports" icon={<BarChart3 size={20} />} title="Reports" color="purple" />
                </div>
                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-100">
                  <MapPin size={19} />
                  Emergency Map
                </button>
              </div>
            </div>
          </div>
          <div className="mt-7 grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="flex items-center gap-5 rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <ShieldCheck size={29} />
              </div>
              <div>
                <h3 className="font-bold text-[#12234b]">Important Reminder </h3>
                <p className="mt-1 text-sm text-slate-600"> Always verify emergency requests carefully before   assigning providers. </p>
                <p className="mt-1 text-sm font-medium text-blue-600"> Your verification can save lives. </p>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-[#12234b]">Manager Performance </h3>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">You have verified
                    <span className="font-bold text-slate-900">  {" "}23 requests </span>
                    {" "}this week.
                  </p>
                  <p className="mt-1 text-sm text-slate-500"> Keep up the good work!  </p>
                </div>
                <span className="ml-auto rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">+15%</span>
              </div>
            </div>
          </div>
    </>
  );
}

function StatCard({ title, value, description, icon, color }: { title: string; value: string; description: string; icon: React.ReactNode; color: "red" | "blue" | "green" | "purple"; }) {
  const styles = {
    red: {
      bg: "bg-red-50",
      icon: "text-red-500",
      number: "text-red-500",
    },
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-500",
      number: "text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-500",
      number: "text-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-500",
      number: "text-purple-600",
    },
  };
  const style = styles[color];
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600"> {title}  </p>
          <p className={`mt-2 text-4xl font-bold ${style.number}`}> {value} </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${style.bg} ${style.icon}`}>{icon}</div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-slate-500"> {description} </p>
        <ChevronRight size={17} className="text-slate-400" />
      </div>
    </div>
  );
}
function RequestItem({ icon, iconColor, title, description, location, distance, status, time, }: {
  icon: React.ReactNode; iconColor: "red" | "blue" | "purple" | "orange"; title: string; description: string;
  location: string; distance: string; status: "Pending" | "Verified"; time: string;
}) {
  const iconStyles = {
    red: "bg-red-50 text-red-500",
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500",
    orange: "bg-orange-50 text-orange-500",
  };
  return (
    <div className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyles[iconColor]}`}>{icon} </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800">{title}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{description} </p>
        </div>
      </div>
      <div className="flex min-w-[160px] items-center gap-2">
        <MapPin size={17} className="shrink-0 text-blue-500" />
        <p className="text-xs text-slate-600"> {location}</p>
      </div>
      <p className="min-w-[65px] text-sm font-semibold text-red-500"> {distance}</p>
      <div className="min-w-[90px]">
        {status === "Pending" ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-3 py-1.5 text-[11px] font-bold uppercase text-orange-600">
            <Clock size={13} /> Pending
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-3 py-1.5 text-[11px] font-bold uppercase text-green-600">
            <CheckCircle size={13} /> Verified
          </span>
        )}
      </div>
      <p className="min-w-[75px] text-xs text-slate-500"> {time}</p>
      <button className="flex h-9 w-9 items-center justify-center rounded-lg border text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600">
        <Eye size={17} />

      </button>

    </div>
  );
}
function StatusLegend({ color, label, value, }: { color: string; label: string; value: string; }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        <span className="text-sm text-slate-600"> {label}</span>
      </div>
      <span className="text-sm font-bold text-slate-800"> {value} </span>
    </div>
  );
}
function QuickAction({ href, icon, title, color }: { href: string; icon: React.ReactNode; title: string; color: "red" | "blue" | "green" | "purple"; }) {
  const styles = {
    red: "border-red-100 bg-red-50 text-red-600 hover:bg-red-100",
    blue: "border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "border-green-100 bg-green-50 text-green-600 hover:bg-green-100",
    purple: "border-purple-100 bg-purple-50 text-purple-600 hover:bg-purple-100",
  };

  return (
    <Link href={href} className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition ${styles[color]}`}>
      {icon}
      {title}
    </Link>
  );
}
