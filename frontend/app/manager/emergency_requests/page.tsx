"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { Eye, LoaderCircle, MapPin, Search, Siren } from "lucide-react";
import { formatRelativeTime } from "../../../lib/datetime";

type Status = "pending_verification" | "approved" | "assigned" | "accepted" | "in_progress" | "completed" | "rejected" | "cancelled";
type Request = { id: number; title: string; emergency_type: string | null; description: string | null; address: string | null; status: Status; requester_name: string; requester_phone: string; created_at: string };

const statusLabels: Record<Status, string> = { pending_verification: "Pending", approved: "Approved", assigned: "Assigned", accepted: "Accepted", in_progress: "In progress", completed: "Completed", rejected: "Rejected", cancelled: "Cancelled" };

export default function EmergencyRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiRequest("/manager/requests/emergency", {}, localStorage.getItem("token"));
      setRequests(data.requests || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load emergency requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialRequests = async () => {
      try {
        const data = await apiRequest("/manager/requests/emergency", {}, localStorage.getItem("token"));
        if (!cancelled) setRequests(data.requests || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load emergency requests.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadInitialRequests();
    return () => { cancelled = true; };
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const searchable = [request.title, request.emergency_type, request.address, request.requester_name, String(request.id)].filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && searchable.includes(search.toLowerCase());
  });
  const count = (status: Status) => requests.filter((request) => request.status === status).length;

  return (
    <>
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center"><div><h1 className="text-3xl font-bold text-[#12234b]">Emergency Requests</h1><p className="mt-2 text-slate-500">Monitor every emergency request and its current database status.</p></div><div className="flex flex-col gap-3 sm:flex-row"><div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." className="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-[260px]" /></div><button onClick={loadRequests} className="h-11 rounded-lg border bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Refresh</button></div></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Summary title="Total" value={String(requests.length)} /><Summary title="Pending" value={String(count("pending_verification"))} /><Summary title="In progress" value={String(count("in_progress") + count("accepted") + count("assigned"))} /><Summary title="Completed" value={String(count("completed"))} /><Summary title="Rejected" value={String(count("rejected"))} /></div>
      <div className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-bold text-[#12234b]">All emergency requests</h2><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | Status)} className="h-10 rounded-lg border bg-white px-3 text-sm text-slate-600 outline-none"><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{error && <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}{isLoading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading requests...</div> : filteredRequests.length === 0 ? <p className="px-6 py-16 text-center text-sm text-slate-500">No emergency requests match the current filters.</p> : <div className="divide-y">{filteredRequests.map((request) => <div key={request.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><Siren size={20} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-800">{request.title}</p><StatusBadge status={request.status} /></div><p className="mt-1 text-sm text-slate-500">{request.description || "Emergency assistance requested"}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>#{request.id} · {request.requester_name} · {request.requester_phone}</span><span className="inline-flex items-center gap-1"><MapPin size={13} />{request.address || "Location unavailable"}</span><span>{formatRelativeTime(request.created_at)}</span></div></div></div><Link href={`/manager/emergency-requests/${request.id}`} className="flex h-9 w-fit shrink-0 items-center gap-1 rounded-lg border border-blue-100 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"><Eye size={15} /> View details</Link></div>)}</div>}<p className="border-t px-5 py-4 text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{filteredRequests.length}</span> of <span className="font-semibold text-slate-700">{requests.length}</span> emergency requests</p></div>
    </>
  );
}

function Summary({ title, value }: { title: string; value: string }) { return <div className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-slate-800">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{title}</p></div>; }
function StatusBadge({ status }: { status: Status }) { const tone = status === "pending_verification" ? "bg-orange-50 text-orange-700" : status === "completed" ? "bg-green-50 text-green-700" : status === "rejected" || status === "cancelled" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{statusLabels[status]}</span>; }
