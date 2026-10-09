"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { formatRelativeTime } from "../../../lib/datetime";
import {
  Activity,
  Bell,
  CheckCircle,
  ClipboardCheck,
  Eye,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  User,
  Users,
  X,
} from "lucide-react";

type Status = "assigned" | "accepted" | "in_progress";
type ActiveRequest = { id: number; title: string; emergency_type: string | null; description: string | null; address: string | null; status: Status; requester_name: string; requester_phone: string; provider_name: string | null; provider_phone: string | null; updated_at: string; };
type PendingAssignment = { request_id: number; title: string; address: string | null; requester_name: string; seconds_remaining: number; candidates: { provider_name: string; provider_phone: string; distance_km: number }[] };
const statusLabels: Record<Status, string> = { assigned: "Assigned", accepted: "Accepted", in_progress: "In progress" };

export default function ActiveRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [requests, setRequests] = useState<ActiveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);

  const loadRequests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiRequest("/manager/requests/active", {}, localStorage.getItem("token"));
      setRequests(data.requests || []);
      const pending = await apiRequest("/manager/requests/pending-assignments", {}, localStorage.getItem("token"));
      setPendingAssignments(pending.assignments || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load active requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialRequests = async () => {
      try {
        const data = await apiRequest("/manager/requests/active", {}, localStorage.getItem("token"));
        if (!cancelled) setRequests(data.requests || []);
        const pending = await apiRequest("/manager/requests/pending-assignments", {}, localStorage.getItem("token"));
        if (!cancelled) setPendingAssignments(pending.assignments || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load active requests.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadInitialRequests();
    return () => { cancelled = true; };
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const searchable = [request.title, request.emergency_type, request.address, request.requester_name, request.provider_name, String(request.id)].filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && searchable.includes(search.toLowerCase());
  });
  const count = (status: Status) => requests.filter((request) => request.status === status).length;
  const completeRequest = async (id: number) => {
    setError("");
    try {
      await apiRequest(`/manager/requests/${id}/complete`, { method: "PUT" }, localStorage.getItem("token"));
      await loadRequests();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to complete request.");
    }
  };

  return (
    <>
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
        Select an active request below to mark it as completed after the provider confirms the help is finished.
      </div>
      {pendingAssignments.length > 0 && <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-900">Pending provider responses</h2><p className="mt-1 text-sm text-amber-800">Providers who selected GPS-on and “I am ready to help” are held for three minutes, then the closest eligible provider is assigned automatically.</p><div className="mt-4 space-y-3">{pendingAssignments.map((assignment) => <div key={assignment.request_id} className="rounded-lg border border-amber-200 bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold text-slate-800">#{assignment.request_id} {assignment.title}</p><span className="text-sm font-bold text-amber-700">{Math.floor(assignment.seconds_remaining / 60)}:{String(assignment.seconds_remaining % 60).padStart(2, "0")} remaining</span></div><p className="mt-1 text-xs text-slate-500">{assignment.requester_name} · {assignment.address || "Location unavailable"}</p><div className="mt-3 flex flex-wrap gap-2">{assignment.candidates.map((candidate) => <span key={`${assignment.request_id}-${candidate.provider_name}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{candidate.provider_name} · {candidate.distance_km} km</span>)}</div></div>)}</div></section>}
      {filteredRequests.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {filteredRequests.map((request) => (
            <button
              key={`complete-${request.id}`}
              onClick={() => completeRequest(request.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <CheckCircle size={17} />
              Complete Request #{request.id}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center"><div><h1 className="text-3xl font-bold text-[#12234b]">Active Requests</h1><p className="mt-2 text-slate-500">Monitor emergency requests currently assigned to providers.</p></div><div className="flex flex-col gap-3 sm:flex-row"><div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." className="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-[260px]" /></div><button onClick={loadRequests} className="h-11 rounded-lg border bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Refresh</button></div></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary title="Active total" value={String(requests.length)} /><Summary title="Assigned" value={String(count("assigned"))} /><Summary title="Accepted" value={String(count("accepted"))} /><Summary title="In progress" value={String(count("in_progress"))} /></div>
      <div className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-bold text-[#12234b]">Provider assignments</h2><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | Status)} className="h-10 rounded-lg border bg-white px-3 text-sm text-slate-600 outline-none"><option value="all">All active statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{error && <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}{isLoading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading active requests...</div> : filteredRequests.length === 0 ? <p className="px-6 py-16 text-center text-sm text-slate-500">No active requests match the current filters.</p> : <div className="divide-y">{filteredRequests.map((request) => <div key={request.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Activity size={20} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-800">{request.title}</p><StatusBadge status={request.status} /></div><p className="mt-1 text-sm text-slate-500">{request.description || "Emergency assistance requested"}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>#{request.id} · Requester: {request.requester_name}</span><span className="inline-flex items-center gap-1"><MapPin size={13} />{request.address || "Location unavailable"}</span><span>Updated {formatRelativeTime(request.updated_at)}</span></div></div></div><div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center"><div className="rounded-lg bg-slate-50 px-3 py-2 text-xs"><p className="font-bold text-slate-700">Provider</p><p className="text-slate-500">{request.provider_name || "Not assigned"}</p>{request.provider_phone && <p className="text-slate-500">{request.provider_phone}</p>}</div><Link href={`/manager/emergency-requests/${request.id}`} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-blue-100 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"><Eye size={15} /> View</Link></div></div>)}</div>}<p className="border-t px-5 py-4 text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{filteredRequests.length}</span> of <span className="font-semibold text-slate-700">{requests.length}</span> active requests</p></div>
    </>
  );
}

function Summary({ title, value }: { title: string; value: string }) { return <div className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-slate-800">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{title}</p></div>; }
function StatusBadge({ status }: { status: Status }) { const tone = status === "in_progress" ? "bg-blue-50 text-blue-700" : status === "accepted" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{statusLabels[status]}</span>; }
function ManagerShell({ children, sidebarOpen, setSidebarOpen }: { children: React.ReactNode; sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) { return <div className="min-h-screen bg-[#f7f9fc]"><aside className={`fixed left-0 top-0 z-50 h-screen w-[260px] bg-[#082b63] text-white transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}><div className="flex h-[90px] items-center border-b border-white/10 px-6"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600"><ShieldCheck size={27} /></div><div><h2 className="text-xl font-bold">HelpBridge</h2><p className="text-xs text-blue-200">Manager Panel</p></div></div><button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden" aria-label="Close navigation"><X size={22} /></button></div><nav className="px-4 py-6"><NavItem href="/manager/dashboard" icon={<LayoutDashboard size={19} />} label="Dashboard" /><NavItem href="/manager/emergency_requests" icon={<Siren size={19} />} label="Emergency Requests" /><NavItem href="/manager/pending-verification" icon={<ClipboardCheck size={19} />} label="Pending Verification" /><NavItem href="/manager/active-requests" icon={<Activity size={19} />} label="Active Requests" active /><NavItem href="/manager/providers" icon={<Users size={19} />} label="Providers" /><NavItem href="/manager/profile" icon={<User size={19} />} label="Profile" /><NavItem href="/manager/settings" icon={<Settings size={19} />} label="Settings" /></nav><Link href="/login" className="absolute bottom-6 left-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-300 hover:bg-white/10"><LogOut size={19} /> Logout</Link></aside>{sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}<main className="lg:ml-[260px]"><header className="flex h-[90px] items-center justify-between border-b bg-white px-5 sm:px-8"><button onClick={() => setSidebarOpen(true)} className="text-slate-600 lg:hidden" aria-label="Open navigation"><Menu size={25} /></button><div className="ml-auto flex items-center gap-4"><Bell size={22} className="text-slate-600" /><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">M</div></div></header><div className="p-5 sm:p-8">{children}</div></main></div>; }
function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) { return <Link href={href} className={`mb-1 flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium ${active ? "bg-blue-600 text-white" : "text-blue-50 hover:bg-white/10"}`}>{icon}{label}</Link>; }
