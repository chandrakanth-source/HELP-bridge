"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "../../../../lib/api";
import { ArrowLeft, CheckCircle, Clock, LoaderCircle, MapPin, ShieldAlert, UserRound } from "lucide-react";
import ManagerRequestWorkflow from "../../../../components/ManagerRequestWorkflow";

type EmergencyRequest = {
  id: number;
  title: string;
  emergency_type: string | null;
  description: string | null;
  address: string | null;
  status: string;
  requester_name: string;
  requester_phone: string;
  requester_email: string;
  provider_name: string | null;
  provider_phone: string | null;
  created_at: string;
  updated_at: string;
};

function LegacyEmergencyRequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const data = await apiRequest(`/manager/requests/emergency/${id}`, {}, localStorage.getItem("token"));
        setRequest(data.request);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load emergency request.");
      }
    };
    if (id) void loadRequest();
  }, [id]);

  if (error) return <DetailShell><p className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error}</p></DetailShell>;
  if (!request) return <DetailShell><div className="flex items-center gap-2 text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading request...</div></DetailShell>;

  return <DetailShell><Link href="/manager/emergency_requests" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={17} /> Back to emergency requests</Link><div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold text-[#12234b]">{request.title}</h1><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{request.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm text-slate-500">Emergency request #{request.id}</p></div><ShieldAlert className="text-red-500" size={34} /></div><div className="mt-7 grid gap-6 lg:grid-cols-2"><InfoCard title="Request details"><Detail label="Type" value={request.emergency_type || "Emergency assistance"} /><Detail label="Description" value={request.description || "No description provided"} /><Detail label="Location" value={request.address || "Location unavailable"} icon={<MapPin size={16} />} /><Detail label="Created" value={new Date(request.created_at).toLocaleString()} icon={<Clock size={16} />} /></InfoCard><InfoCard title="People"><Detail label="Requester" value={`${request.requester_name} · ${request.requester_phone}`} icon={<UserRound size={16} />} /><Detail label="Email" value={request.requester_email} /><Detail label="Assigned provider" value={request.provider_name ? `${request.provider_name} · ${request.provider_phone}` : "No provider assigned"} icon={<CheckCircle size={16} />} /></InfoCard></div></DetailShell>;
}

export default function EmergencyRequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return <DetailShell><Link href="/manager/emergency_requests" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={17} /> Back to emergency requests</Link><div className="mt-6"><h1 className="text-3xl font-bold text-[#12234b]">Request review</h1><ManagerRequestWorkflow requestId={id} /></div></DetailShell>;
}

function DetailShell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-[#f7f9fc] px-5 py-8 sm:px-10"><div className="mx-auto max-w-5xl">{children}</div></main>; }
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-[#12234b]">{title}</h2><div className="mt-5 space-y-4">{children}</div></section>; }
function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-700">{icon}{value}</p></div>; }
