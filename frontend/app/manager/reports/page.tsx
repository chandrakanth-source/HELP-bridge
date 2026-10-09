"use client";

import { useEffect, useState } from "react";
import { Activity, BarChart3, CheckCircle, Clock3, LoaderCircle, RefreshCw, Siren, Users } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type Stats = {
  total_count: number;
  pending_count: number;
  active_count: number;
  verified_count: number;
  completed_count: number;
};

type RequestRecord = {
  id: number;
  title: string;
  status: string;
  emergency_type: string | null;
  created_at: string;
};

const statusItems = [
  { key: "pending_count", label: "Pending verification", color: "bg-amber-500" },
  { key: "active_count", label: "Active", color: "bg-blue-500" },
  { key: "verified_count", label: "Approved", color: "bg-green-500" },
  { key: "completed_count", label: "Completed", color: "bg-violet-500" },
] as const;

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [statsData, requestsData] = await Promise.all([
        apiRequest("/manager/dashboard/stats", {}, token),
        apiRequest("/manager/requests/emergency", {}, token),
      ]);
      setStats(statsData);
      setRequests(requestsData.requests || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialReport = async () => {
      try {
        const token = localStorage.getItem("token");
        const [statsData, requestsData] = await Promise.all([
          apiRequest("/manager/dashboard/stats", {}, token),
          apiRequest("/manager/requests/emergency", {}, token),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setRequests(requestsData.requests || []);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load reports.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadInitialReport();
    return () => { cancelled = true; };
  }, []);

  const total = stats?.total_count || 0;
  const typeCounts = requests.reduce<Record<string, number>>((counts, request) => {
    const type = request.emergency_type || "Other";
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
  const topTypes = Object.entries(typeCounts).sort(([, first], [, second]) => second - first).slice(0, 5);

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div><h1 className="text-3xl font-bold text-[#12234b]">Reports & Analytics</h1><p className="mt-2 text-slate-500">A live overview of HelpBridge emergency request activity.</p></div>
        <button onClick={loadReport} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw size={17} /> Refresh</button>
      </div>

      {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
      {isLoading ? <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading report data...</div> : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Total requests" value={total} icon={<BarChart3 size={21} />} tone="blue" />
            <Metric title="Pending verification" value={stats?.pending_count || 0} icon={<Clock3 size={21} />} tone="amber" />
            <Metric title="Active requests" value={stats?.active_count || 0} icon={<Activity size={21} />} tone="green" />
            <Metric title="Completed requests" value={stats?.completed_count || 0} icon={<CheckCircle size={21} />} tone="violet" />
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><BarChart3 className="text-blue-600" size={21} /><h2 className="font-bold text-[#12234b]">Request status distribution</h2></div><div className="mt-7 space-y-5">{statusItems.map((item) => { const value = stats?.[item.key] || 0; const percentage = total ? Math.round((value / total) * 100) : 0; return <div key={item.key}><div className="flex justify-between text-sm"><span className="font-semibold text-slate-600">{item.label}</span><span className="font-bold text-slate-800">{value} <span className="font-normal text-slate-400">({percentage}%)</span></span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} /></div></div>; })}</div></section>
            <section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Siren className="text-red-500" size={21} /><h2 className="font-bold text-[#12234b]">Emergency categories</h2></div>{topTypes.length === 0 ? <p className="mt-8 text-sm text-slate-500">No category data available.</p> : <div className="mt-6 space-y-4">{topTypes.map(([type, count], index) => <div key={type} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-sm font-bold text-red-600">{index + 1}</span><span className="flex-1 text-sm font-semibold text-slate-700">{type}</span><span className="text-sm font-bold text-slate-900">{count}</span></div>)}</div>}</section>
          </div>

          <section className="mt-6 rounded-2xl border bg-white shadow-sm"><div className="flex items-center justify-between border-b px-6 py-5"><div className="flex items-center gap-3"><Users className="text-blue-600" size={21} /><h2 className="font-bold text-[#12234b]">Recent request activity</h2></div><span className="text-sm text-slate-500">{requests.length} records</span></div>{requests.length === 0 ? <p className="px-6 py-12 text-center text-sm text-slate-500">No request activity yet.</p> : <div className="divide-y">{requests.slice(0, 6).map((request) => <div key={request.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-800">{request.title}</p><p className="mt-1 text-xs text-slate-500">#{request.id} · {request.emergency_type || "Emergency"}</p></div><div className="text-left sm:text-right"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">{request.status.replaceAll("_", " ")}</span><p className="mt-2 text-xs text-slate-400">{new Date(request.created_at).toLocaleString()}</p></div></div>)}</div>}</section>
        </>
      )}
    </div>
  );
}

function Metric({ title, value, icon, tone }: { title: string; value: number; icon: React.ReactNode; tone: "blue" | "amber" | "green" | "violet" }) { const styles = { blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", green: "bg-green-50 text-green-600", violet: "bg-violet-50 text-violet-600" }; return <div className="flex items-center justify-between rounded-xl border bg-white p-5 shadow-sm"><div><p className="text-3xl font-bold text-slate-800">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{title}</p></div><div className={`flex h-11 w-11 items-center justify-center rounded-full ${styles[tone]}`}>{icon}</div></div>; }

