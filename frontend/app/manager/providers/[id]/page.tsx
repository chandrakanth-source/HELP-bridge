"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "../../../../lib/api";
import { ArrowLeft, CheckCircle, Clock, LoaderCircle, MapPin, Phone, ShieldCheck } from "lucide-react";

type Provider = { id: number; name: string; email: string; phone: string; address: string | null; availability_status: string; verification_status: string; created_at: string; };

export default function ProviderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const data = await apiRequest(`/manager/providers/${encodeURIComponent(id)}`, {}, localStorage.getItem("token"));
        setProvider(data.provider);
      } catch (providerError) {
        setError(providerError instanceof Error ? providerError.message : "Unable to load provider.");
      }
    };
    if (id) void loadProvider();
  }, [id]);

  if (error) return <DetailShell><p className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error}</p></DetailShell>;
  if (!provider) return <DetailShell><div className="flex items-center gap-2 text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading provider...</div></DetailShell>;

  return <DetailShell><Link href="/manager/providers" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={17} /> Back to providers</Link><div className="mt-6 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">{provider.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><h1 className="text-3xl font-bold text-[#12234b]">{provider.name}</h1><p className="mt-1 text-sm text-slate-500">Provider #{provider.id}</p></div></div><div className="mt-7 grid gap-6 lg:grid-cols-2"><InfoCard title="Contact information"><Detail label="Phone" value={provider.phone} icon={<Phone size={16} />} /><Detail label="Email" value={provider.email} /><Detail label="Address" value={provider.address || "Address unavailable"} icon={<MapPin size={16} />} /></InfoCard><InfoCard title="Account status"><Detail label="Verification" value={provider.verification_status} icon={<ShieldCheck size={16} />} /><Detail label="Availability" value={provider.availability_status} icon={<CheckCircle size={16} />} /><Detail label="Joined" value={new Date(provider.created_at).toLocaleDateString()} icon={<Clock size={16} />} /></InfoCard></div></DetailShell>;
}

function DetailShell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-[#f7f9fc] px-5 py-8 sm:px-10"><div className="mx-auto max-w-5xl">{children}</div></main>; }
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-[#12234b]">{title}</h2><div className="mt-5 space-y-4">{children}</div></section>; }
function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 flex items-center gap-2 text-sm capitalize text-slate-700">{icon}{value.replaceAll("_", " ")}</p></div>; }
