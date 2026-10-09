"use client";

import { useEffect, useState } from "react";
import { CheckCircle, LoaderCircle, MapPin, RefreshCw, Search } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type CompletedRequest = {
  id: number;
  title: string;
  description: string | null;
  address: string | null;
  requester_name: string;
  provider_name: string | null;
  updated_at: string;
};

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<CompletedRequest[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiRequest("/manager/requests/completed", {}, localStorage.getItem("token"));
      setRequests(data.requests || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load completed requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialRequests = async () => {
      try {
        const data = await apiRequest("/manager/requests/completed", {}, localStorage.getItem("token"));
        if (!cancelled) setRequests(data.requests || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load completed requests.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadInitialRequests();
    return () => { cancelled = true; };
  }, []);

  const filteredRequests = requests.filter((request) => {
    const searchable = [request.title, request.description, request.address, request.requester_name, request.provider_name, String(request.id)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#12234b]">Completed Requests</h1>
          <p className="mt-2 text-slate-500">Review emergency requests that have been completed successfully.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search completed requests..."
              className="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-[280px]"
            />
          </div>
          <button onClick={loadRequests} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-bold text-[#12234b]">Completed emergency requests</h2>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{filteredRequests.length} total</span>
        </div>

        {error && <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading completed requests...</div>
        ) : filteredRequests.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-500">No completed requests found.</p>
        ) : (
          <div className="divide-y">
            {filteredRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle size={21} /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-800">{request.title}</p>
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">Completed</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{request.description || "Emergency assistance completed"}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>#{request.id} · Requester: {request.requester_name}</span>
                      <span className="inline-flex items-center gap-1"><MapPin size={13} />{request.address || "Location unavailable"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left text-xs text-slate-500 lg:text-right">
                  <p>Provider</p>
                  <p className="mt-1 font-semibold text-slate-700">{request.provider_name || "Not assigned"}</p>
                  <p className="mt-2">Completed {new Date(request.updated_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

