"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, DollarSign, MapPin, RefreshCw, Siren, Wrench } from "lucide-react";
import { apiRequest } from "../../lib/api";
import BargainModal from "../../components/BargainModal";

type RequestStatus =
  | "pending_verification"
  | "approved"
  | "rejected"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "bargaining";

type HelpRequest = {
  id: number;
  title: string;
  description: string | null;
  request_type: "emergency" | "non_emergency";
  status: RequestStatus;
  address: string | null;
  created_at: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const statusLabels: Record<RequestStatus, string> = {
  pending_verification: "Pending verification",
  approved: "Approved",
  rejected: "Rejected",
  assigned: "Assigned",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  bargaining: "Negotiating price",
};

const statusStyles: Record<RequestStatus, string> = {
  pending_verification: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  assigned: "border-blue-200 bg-blue-50 text-blue-700",
  accepted: "border-indigo-200 bg-indigo-50 text-indigo-700",
  in_progress: "border-cyan-200 bg-cyan-50 text-cyan-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-300 bg-slate-100 text-slate-700",
  bargaining: "border-amber-300 bg-amber-50 text-amber-800",
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bargainRequestId, setBargainRequestId] = useState<number | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first to view your requests.");
        return;
      }

      const data = await apiRequest("/help-requests/my", {}, token);
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadRequests();
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, []);

  const visibleRequests = useMemo(() => {
    if (filter === "completed") {
      return requests.filter((request) => request.status === "completed");
    }

    if (filter === "active") {
      return requests.filter((request) => !["completed", "rejected", "cancelled"].includes(request.status));
    }

    return requests;
  }, [filter, requests]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard/seeker" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600">
              <ArrowLeft size={17} /> Back to dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ClipboardList size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">My requests</h1>
                <p className="mt-1 text-sm text-slate-500">Follow every request from submission to completion.</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={loadRequests} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", "active", "completed"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${filter === value ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {value} ({value === "all" ? requests.length : value === "completed" ? requests.filter((request) => request.status === "completed").length : requests.filter((request) => !["completed", "rejected", "cancelled"].includes(request.status)).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading your requests...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-800">Unable to load requests</p>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <Link href="/login" className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Go to login</Link>
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <ClipboardList size={38} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">No requests in this view</h2>
            <p className="mt-2 text-sm text-slate-500">Start with emergency or non-emergency help when you need it.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/user/emergency" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"><Siren size={16} /> Emergency help</Link>
              <Link href="/user/non-emergency" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Wrench size={16} /> General help</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${request.request_type === "emergency" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                        {request.request_type === "emergency" ? "Emergency" : "Non-emergency"}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[request.status]}`}>{statusLabels[request.status]}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-slate-900">{request.title}</h2>
                    {request.description && <p className="mt-2 text-sm leading-6 text-slate-600">{request.description}</p>}
                  </div>
                  <span className="text-xs font-medium text-slate-400">#{request.id}</span>
                </div>
                <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-6">
                  <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-slate-400" />{request.address || "Location captured"}</span>
                  <span>{new Date(request.created_at).toLocaleString()}</span>
                  {request.latitude != null && request.longitude != null && <a href={`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`} target="_blank" rel="noreferrer" className="font-semibold text-teal-700">Open map</a>}
                </div>
                {request.status === "completed" && <Link href={`/payment?requestId=${request.id}`} className="mt-4 inline-flex rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">Pay for completed help</Link>}
                {request.request_type === "non_emergency" && ["approved", "bargaining"].includes(request.status) && (
                  <button
                    type="button"
                    onClick={() => setBargainRequestId(request.id)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 transition"
                  >
                    <DollarSign size={15} /> Negotiate Price
                    {request.status === "bargaining" && (
                      <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Active</span>
                    )}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {bargainRequestId !== null && (
        <BargainModal
          requestId={bargainRequestId}
          isOpen={true}
          onClose={() => { setBargainRequestId(null); void loadRequests(); }}
          onAgreed={() => { setBargainRequestId(null); void loadRequests(); }}
        />
      )}
    </main>
  );
}

