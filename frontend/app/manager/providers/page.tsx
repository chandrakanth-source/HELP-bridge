"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, Eye, LoaderCircle, MapPin, PauseCircle, Search, Users } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type ProviderRecord = {
  id: number;
  name: string;
  email: string;
  phone: string;
  occupation: string | null;
  address: string | null;
  availability_status: "available" | "busy" | "offline";
  verification_status: "pending" | "verified" | "rejected";
  created_at: string;
};

function getStatus(provider: ProviderRecord) {
  if (provider.verification_status === "pending") return "Pending";
  if (provider.verification_status === "rejected" || provider.availability_status === "offline") return "Inactive";
  return "Verified";
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadProviders = async () => {
      try {
        const data = await apiRequest("/manager/providers", {}, localStorage.getItem("token"));
        if (!cancelled) setProviders(data.providers || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load providers.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadProviders();
    return () => { cancelled = true; };
  }, []);

  const filteredProviders = providers.filter((provider) => {
    const searchable = [provider.name, provider.email, provider.phone, provider.occupation, provider.address, String(provider.id)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(search.toLowerCase());
  });

  const verifiedCount = providers.filter((provider) => getStatus(provider) === "Verified").length;
  const pendingCount = providers.filter((provider) => getStatus(provider) === "Pending").length;
  const inactiveCount = providers.filter((provider) => getStatus(provider) === "Inactive").length;

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#12234b]">Providers</h1>
          <p className="mt-2 text-slate-500">View and manage registered help providers from the database.</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search providers..." className="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-[280px]" />
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard value={String(providers.length)} title="Total Providers" icon={<Users size={22} />} tone="blue" />
        <StatCard value={String(verifiedCount)} title="Verified Providers" icon={<CheckCircle size={22} />} tone="green" />
        <StatCard value={String(pendingCount)} title="Pending Verification" icon={<Clock size={22} />} tone="purple" />
        <StatCard value={String(inactiveCount)} title="Inactive Providers" icon={<PauseCircle size={22} />} tone="orange" />
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-bold text-[#12234b]">Registered providers</h2>
          <span className="text-sm text-slate-500">{filteredProviders.length} shown</span>
        </div>
        {error && <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading providers...</div>
        ) : filteredProviders.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-500">No providers match your search.</p>
        ) : (
          <div className="divide-y">
            {filteredProviders.map((provider) => {
              const status = getStatus(provider);
              return (
                <div key={provider.id} className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between hover:bg-slate-50">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{provider.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-800">{provider.name}</p><StatusBadge status={status} /></div>
                      <p className="mt-1 text-sm text-slate-500">{provider.occupation || "General assistance"} · {provider.phone}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{provider.address || "Location unavailable"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-5 lg:justify-end">
                    <div className="text-left text-xs text-slate-500 lg:text-right"><p>{provider.email}</p><p className="mt-1">Joined {new Date(provider.created_at).toLocaleDateString()}</p></div>
                    <Link href={`/manager/providers/${encodeURIComponent(String(provider.id))}`} className="flex h-9 w-9 items-center justify-center rounded-lg border text-slate-600 hover:bg-blue-50" title="View provider"><Eye size={16} /></Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, title, icon, tone }: { value: string; title: string; icon: React.ReactNode; tone: "blue" | "green" | "purple" | "orange" }) {
  const styles = { blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", purple: "bg-purple-50 text-purple-600", orange: "bg-orange-50 text-orange-600" };
  return <div className="flex items-center justify-between rounded-xl border bg-white p-5 shadow-sm"><div><p className="text-3xl font-bold text-slate-800">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{title}</p></div><div className={`flex h-11 w-11 items-center justify-center rounded-full ${styles[tone]}`}>{icon}</div></div>;
}

function StatusBadge({ status }: { status: "Verified" | "Pending" | "Inactive" }) {
  const styles = { Verified: "bg-green-50 text-green-700", Pending: "bg-purple-50 text-purple-700", Inactive: "bg-orange-50 text-orange-700" };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>{status}</span>;
}

