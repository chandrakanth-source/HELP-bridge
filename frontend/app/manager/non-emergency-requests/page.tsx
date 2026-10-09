"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock3, LoaderCircle, MapPin, RefreshCw, Search, Wrench } from "lucide-react";
import { apiRequest } from "../../../lib/api";
import { formatRelativeTime } from "../../../lib/datetime";

type Status = "pending_verification" | "approved" | "assigned" | "accepted" | "in_progress" | "completed" | "rejected" | "cancelled";
type NonEmergencyRequest = { id: number; title: string; description: string | null; address: string | null; status: Status; requester_name: string; requester_phone: string; provider_name: string | null; created_at: string };

const statusLabels: Record<Status, string> = { pending_verification: "Pending", approved: "Approved", assigned: "Assigned", accepted: "Accepted", in_progress: "In progress", completed: "Completed", rejected: "Rejected", cancelled: "Cancelled" };

export default function NonEmergencyRequestsPage() {
  const [requests, setRequests] = useState<NonEmergencyRequest[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiRequest("/manager/requests/non-emergency", {}, localStorage.getItem("token"));
      setRequests(data.requests || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load non-emergency requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialRequests = async () => {
      try {
        const data = await apiRequest("/manager/requests/non-emergency", {}, localStorage.getItem("token"));
        if (!cancelled) setRequests(data.requests || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load non-emergency requests.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadInitialRequests();
    return () => { cancelled = true; };
  }, []);

  const filteredRequests = requests.filter((request) => {
    const searchable = [request.title, request.description, request.address, request.requester_name, request.provider_name, String(request.id)].filter(Boolean).join(" ").toLowerCase();
    return (statusFilter === "all" || request.status === statusFilter) && searchable.includes(search.toLowerCase());
  });
  const count = (status: Status) => requests.filter((request) => request.status === status).length;

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center"><div><h1 className="text-3xl font-bold text-[#12234b]">Non-Emergency Help</h1><p className="mt-2 text-slate-500">Review and manage general assistance requests from the community.</p></div><div className="flex flex-col gap-3 sm:flex-row"><div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." className="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-[260px]" /></div><button onClick={loadRequests} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw size={17} /> Refresh</button></div></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary title="Total requests" value={String(requests.length)} /><Summary title="Pending" value={String(count("pending_verification"))} /><Summary title="In progress" value={String(count("in_progress") + count("accepted") + count("assigned"))} /><Summary title="Completed" value={String(count("completed"))} /></div>
      <div className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Wrench size={20} className="text-blue-600" /><h2 className="font-bold text-[#12234b]">General assistance requests</h2></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | Status)} className="h-10 rounded-lg border bg-white px-3 text-sm text-slate-600 outline-none"><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{error && <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}{isLoading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading non-emergency requests...</div> : filteredRequests.length === 0 ? <p className="px-6 py-16 text-center text-sm text-slate-500">No non-emergency requests match the current filters.</p> : <div className="divide-y">{filteredRequests.map((request) => <div key={request.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Wrench size={20} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-800">{request.title}</p><StatusBadge status={request.status} /></div><p className="mt-1 text-sm text-slate-500">{request.description || "General assistance requested"}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>#{request.id} · {request.requester_name} · {request.requester_phone}</span><span className="inline-flex items-center gap-1"><MapPin size={13} />{request.address || "Location unavailable"}</span></div></div></div><div className="text-left text-xs text-slate-500 lg:text-right"><p>Provider: <span className="font-semibold text-slate-700">{request.provider_name || "Not assigned"}</span></p><p className="mt-1">Submitted {formatRelativeTime(request.created_at)}</p></div></div>)}</div>}</div>
    </div>
  );
}

function Summary({ title, value }: { title: string; value: string }) { return <div className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-slate-800">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{title}</p></div>; }
function StatusBadge({ status }: { status: Status }) { const tone = status === "completed" ? "bg-green-50 text-green-700" : status === "pending_verification" ? "bg-orange-50 text-orange-700" : status === "in_progress" || status === "accepted" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"; return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{status === "completed" ? <CheckCircle size={13} /> : <Clock3 size={13} />}{statusLabels[status]}</span>; }

