"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type Request = { id: number; title: string; description: string | null; address: string | null; status: string; requester_name: string; requester_phone: string; requester_email: string; provider_name: string | null; provider_phone: string | null; };
type Provider = { id: number; name: string; phone: string; occupation: string | null; availability_status: string; verification_status: string; distance_km?: number | string; };

export default function ManagerRequestWorkflow({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [requestData, providerData] = await Promise.all([
        apiRequest(`/manager/requests/emergency/${requestId}`, {}, token),
        apiRequest(`/manager/requests/${requestId}/nearby-providers`, {}, token),
      ]);
      setRequest(requestData.request);
      setProviders(providerData.providers || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load request.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (requestId) void load(); }, [requestId]);

  const assign = async () => {
    if (!providerId) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await apiRequest(`/manager/requests/${requestId}/assign`, { method: "PUT", body: JSON.stringify({ provider_id: Number(providerId) }) }, localStorage.getItem("token"));
      setMessage("Provider assigned successfully.");
      await load();
      setProviderId("");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to assign provider."); }
    finally { setBusy(false); }
  };

  const providerUnavailableMessage = request && request.status !== "approved"
    ? "This request must be approved before a provider can be assigned."
    : "No verified and available providers are currently eligible for this request.";

  if (loading) return <p className="text-sm text-slate-500">Loading request...</p>;
  if (error && !request) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!request) return <p className="text-sm text-slate-500">Request not found.</p>;

  return <div><p className="text-sm text-slate-500">Emergency request #{request.id}</p><div className="mt-4 grid gap-6 lg:grid-cols-2"><section className="rounded-xl border bg-white p-6"><h2 className="text-lg font-bold text-slate-900">Request details</h2><dl className="mt-5 space-y-3 text-sm"><div><dt className="font-semibold">Status</dt><dd>{request.status.replaceAll("_", " ")}</dd></div><div><dt className="font-semibold">Requester</dt><dd>{request.requester_name} · {request.requester_phone}</dd></div><div><dt className="font-semibold">Email</dt><dd>{request.requester_email}</dd></div><div><dt className="font-semibold">Location</dt><dd>{request.address || "Location unavailable"}</dd></div><div><dt className="font-semibold">Description</dt><dd>{request.description || "No description provided"}</dd></div></dl></section><section className="rounded-xl border bg-white p-6"><h2 className="text-lg font-bold text-slate-900">Provider assignment</h2>{request.provider_name ? <p className="mt-5 text-sm text-slate-700">{request.provider_name} · {request.provider_phone}</p> : <><label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="provider">Available verified provider</label><select id="provider" value={providerId} onChange={(event) => setProviderId(event.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"><option value="">Select a provider</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} {provider.occupation ? `· ${provider.occupation}` : ""} · {provider.phone}</option>)}</select><button disabled={busy || !providerId || request.status !== "approved"} onClick={assign} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Assigning..." : "Assign provider"}</button>{providers.length === 0 && <p className="mt-3 text-xs text-slate-500">{providerUnavailableMessage}</p>}</>}{message && <p className="mt-3 text-sm text-green-700">{message}</p>}{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</section></div></div>;
}

