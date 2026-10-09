"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  LoaderCircle,
  MapPin,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "../../../lib/api";

const activeStatuses = new Set([
  "pending_verification",
  "approved",
  "assigned",
  "accepted",
  "in_progress",
]);
const labels = {
  pending_verification: "Pending verification",
  approved: "Approved",
  assigned: "Provider assigned",
  accepted: "Accepted",
  in_progress: "In progress",
};

export default function ActiveRequestsPage() {
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
          activeStatuses.has(request.status),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load active requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

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
              Active requests
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track approval, provider assignment, and help progress.
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
        {loading ? (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border bg-white p-12 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" /> Loading active
            requests...
          </div>
        ) : error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : requests.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed bg-white p-12 text-center text-sm text-slate-500">
            <Activity size={36} className="mx-auto text-slate-300" />
            <p className="mt-3">You have no active requests.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">
                        {request.title}
                      </h2>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {labels[request.status] || request.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {request.description || "Help requested"}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} />{" "}
                      {request.address || "Location unavailable"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    Request #{request.id}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
                  {["assigned", "accepted", "in_progress"].includes(
                    request.status,
                  ) && (
                    <Link
                      href="/user/messages"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <MessageSquare size={16} /> Open messages
                    </Link>
                  )}
                  <Link
                    href={`/requests/${request.id}`}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

