"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "../../../lib/api";

const closedStatuses = new Set(["completed", "rejected", "cancelled"]);
const labels = {
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function RequestHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(
        "/help-requests/my",
        {},
        localStorage.getItem("token"),
      );
      setRequests(
        (data.requests || []).filter((request) =>
          closedStatuses.has(request.status),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load request history.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const completedCount = useMemo(
    () => requests.filter((request) => request.status === "completed").length,
    [requests],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/dashboard/seeker"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              Request history
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Completed and closed requests from your account.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
        <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Resolved requests</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {completedCount}
          </p>
        </div>
        {loading ? (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border bg-white p-12 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" /> Loading
            history...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed bg-white p-12 text-center text-sm text-slate-500">
            <ClipboardList size={34} className="mx-auto text-slate-300" />
            <p className="mt-3">No closed requests yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Request #{request.id}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {request.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.address || "Location unavailable"}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {labels[request.status] || request.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                  <span className="text-slate-500">
                    {request.created_at
                      ? new Date(request.created_at).toLocaleString()
                      : "Date unavailable"}
                  </span>
                  <div className="flex gap-3">
                    <Link
                      href={`/requests/${request.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Details
                    </Link>
                    {request.status === "completed" && (
                      <Link
                        href={`/payment?requestId=${request.id}`}
                        className="font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Pay
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

