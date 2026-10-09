"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api";
import { MapPin, Send } from "lucide-react";
import BargainModal from "./BargainModal";
import LiveTrackingMap from "./LiveTrackingMap";
import socket from "../lib/socket";
import { formatRelativeTime } from "../lib/datetime";

type Request = {
  id: number;
  title: string;
  description?: string | null;
  request_type: string;
  emergency_type?: string | null;
  address?: string | null;
  status: string;
  requester_name?: string;
  requester_phone?: string;
  requester_email?: string;
  created_at: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const statusLabels: Record<string, string> = {
  pending_verification: "Pending verification",
  approved: "Approved",
  assigned: "Assigned",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
};

function useProviderRequests(available = false) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = available ? "/provider/requests/available" : "/provider/requests/mine";
      const data = await apiRequest(endpoint, {}, localStorage.getItem("token"));
      setRequests(data.requests || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [available]);
  return { requests, error, loading, reload: load };
}

function useLiveProviderLocation(active: boolean, requestId?: number) {
  const [locationStatus, setLocationStatus] = useState<"waiting" | "active" | "error">("waiting");
  const [errorMsg, setErrorMsg] = useState("");
  const activeRequestId = useRef<number | undefined>(requestId);
  useEffect(() => { activeRequestId.current = requestId; }, [requestId]);

  const sendLocation = async (position: GeolocationPosition) => {
    try {
      await apiRequest("/location/update", {
        method: "POST",
        body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      }, localStorage.getItem("token"));
      setLocationStatus("active");

      if (activeRequestId.current && socket.connected) {
        socket.emit("provider_location_update", {
          requestId: activeRequestId.current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    } catch {
      // silent — still mark active if we got coords, just failed to sync
    }
  };

  const startGPS = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setErrorMsg("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocationStatus("active"); void sendLocation(pos); },
      (err) => { setLocationStatus("error"); setErrorMsg(err.message || "GPS permission denied."); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    if (!active) return undefined;

    startGPS();
    if (!navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      sendLocation,
      (err) => { setLocationStatus("error"); setErrorMsg(err.message || "GPS signal lost."); },
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { locationStatus, errorMsg, retryGPS: startGPS };
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-800 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-blue-600">HelpBridge Provider Workspace</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
                Dual Role Active
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{title}</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="rounded-lg border bg-white px-3 py-2 hover:bg-slate-50 transition" href="/provider/dashboard">Dashboard</Link>
            <Link className="rounded-lg border bg-white px-3 py-2 hover:bg-slate-50 transition" href="/provider/available-requests">Available</Link>
            <Link className="rounded-lg border bg-white px-3 py-2 hover:bg-slate-50 transition" href="/provider/active-help">My help</Link>
            <Link className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-sm" href="/dashboard/seeker">
              Seeker Mode (Request Help) →
            </Link>
          </nav>
        </div>
        {children}
      </div>
    </main>
  );
}

function RequestCard({ request, action }: { request: Request; action?: React.ReactNode }) {
  const mapUrl = request.latitude != null && request.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}` : null;
  return <article className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{request.title}</h2><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{statusLabels[request.status] || request.status}</span></div><p className="mt-2 text-sm text-slate-600">{request.description || "Help requested"}</p><p className="mt-2 text-xs text-slate-500">{request.requester_name || "Requester"} · {request.address || "Location unavailable"} · {formatRelativeTime(request.created_at)}</p>{mapUrl && <a className="mt-2 inline-block text-xs font-semibold text-teal-700" href={mapUrl} target="_blank" rel="noreferrer">Open location in Google Maps</a>}</div>{action}</article>;
}

export function ProviderDashboardWorkflow() {
  const { requests, error, loading } = useProviderRequests();
  const active = requests.filter((request) => ["assigned", "accepted", "in_progress"].includes(request.status));
  const completed = requests.filter((request) => request.status === "completed");
  return <Shell title="Provider dashboard"><div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Available requests" value="Browse" href="/provider/available-requests" /><Metric label="Active help" value={String(active.length)} href="/provider/active-help" /><Metric label="Completed help" value={String(completed.length)} href="/provider/completed-help" /></div><section className="mt-8 rounded-xl border bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Assigned requests</h2><Link className="text-sm font-semibold text-blue-600" href="/provider/active-help">View all</Link></div><div className="mt-4 space-y-3">{loading && <p className="text-sm text-slate-500">Loading requests...</p>}{error && <p className="text-sm text-red-600">{error}</p>}{!loading && !error && active.length === 0 && <p className="text-sm text-slate-500">No assigned requests yet.</p>}{active.map((request) => <RequestCard key={request.id} request={request} action={<Link className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" href={`/provider/requests/${request.id}`}>Open</Link>} />)}</div></section></Shell>;
}

export function ProviderAvailableWorkflow() {
  const { requests, error, loading, reload } = useProviderRequests(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [bargainRequest, setBargainRequest] = useState<Request | null>(null);

  const { locationStatus, errorMsg, retryGPS } = useLiveProviderLocation(true, undefined);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    socket.auth = { token };
    socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  const handleKNNExpressInterest = async (id: number) => {
    if (locationStatus !== "active") {
      setActionError("GPS is not connected yet. Please allow location access and try again.");
      return;
    }
    setBusyId(id);
    setActionError("");
    try {
      const data = await apiRequest(
        `/provider/requests/${id}/express-interest`,
        { method: "POST" },
        localStorage.getItem("token")
      );
      alert(data.message || "Interest recorded! HelpBridge will assign the nearest provider soon.");
      await reload();
    } catch (requestError) {
      const msg = requestError instanceof Error ? requestError.message : "Unable to express interest.";

      if (msg.includes("currently handling")) {
        setActionError(`🚫 ${msg}`);
      } else {
        setActionError(msg);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Shell title="Available Requests">
      {/* GPS Status Banner */}
      <div className={`mt-6 flex items-center justify-between gap-3 rounded-xl border p-4 ${locationStatus === "active" ? "border-emerald-200 bg-emerald-50" :
        locationStatus === "error" ? "border-red-200 bg-red-50" :
          "border-amber-200 bg-amber-50"
        }`}>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${locationStatus === "active" ? "bg-emerald-500 animate-pulse" :
            locationStatus === "error" ? "bg-red-500" : "bg-amber-400 animate-pulse"
            }`} />
          <div>
            <p className={`text-sm font-semibold ${locationStatus === "active" ? "text-emerald-700" :
              locationStatus === "error" ? "text-red-700" : "text-amber-700"
              }`}>
              {locationStatus === "active" ? "GPS Connected — You are visible to HelpBridge" :
                locationStatus === "error" ? `GPS Error: ${errorMsg}` :
                  "Connecting to GPS..."}
            </p>
            {locationStatus !== "active" && (
              <p className="text-xs text-slate-500 mt-0.5">GPS is required to express interest in requests</p>
            )}
          </div>
        </div>
        {locationStatus !== "active" && (
          <button type="button" onClick={retryGPS}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            <MapPin size={14} />
            {locationStatus === "error" ? "Retry GPS" : "Enable GPS"}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Approved help requests near you. Click &quot;I am ready to help&quot; — HelpBridge will assign the closest provider.
        </p>
        <button type="button" onClick={() => void reload()} disabled={loading}
          className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          Refresh
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {(error || actionError) && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error || actionError}
          </p>
        )}
        {loading && <p className="text-sm text-slate-500">Loading available requests...</p>}
        {!loading && requests.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500">
            No approved requests are available currently.
          </p>
        )}

        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            action={
              <div className="flex flex-col sm:flex-row gap-2">
                {request.request_type === "emergency" ? (
                  <button
                    disabled={busyId === request.id || locationStatus !== "active"}
                    onClick={() => handleKNNExpressInterest(request.id)}
                    title={locationStatus !== "active" ? "Enable GPS first" : ""}
                    className={`rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition cursor-pointer flex items-center gap-1.5 ${locationStatus !== "active"
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                      }`}
                  >
                    {busyId === request.id ? "Finding nearest provider..." : "I am ready to help"}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBargainRequest(request)}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition cursor-pointer"
                    >
                      Bargain / Price Offer
                    </button>
                    <button
                      disabled={busyId === request.id || locationStatus !== "active"}
                      onClick={() => handleKNNExpressInterest(request.id)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition cursor-pointer ${locationStatus !== "active" ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
                        }`}
                    >
                      I am ready to help
                    </button>
                  </div>
                )}
              </div>
            }
          />
        ))}
      </div>

      {bargainRequest && (
        <BargainModal
          requestId={bargainRequest.id}
          isOpen={Boolean(bargainRequest)}
          onClose={() => setBargainRequest(null)}
          onAgreed={() => reload()}
        />
      )}
    </Shell>
  );
}

export function ProviderActiveWorkflow({ completedOnly = false }: { completedOnly?: boolean }) {
  const { requests, error, loading } = useProviderRequests();
  const filtered = requests.filter((request) => completedOnly ? request.status === "completed" : ["assigned", "accepted", "in_progress"].includes(request.status));
  useLiveProviderLocation(!completedOnly && filtered.some((request) => ["assigned", "accepted", "in_progress"].includes(request.status)), filtered.find(r => ["assigned", "accepted", "in_progress"].includes(r.status))?.id);
  return <Shell title={completedOnly ? "Completed help" : "My active help"}><div className="mt-8 space-y-3">{error && <p className="text-sm text-red-600">{error}</p>}{loading && <p className="text-sm text-slate-500">Loading requests...</p>}{!loading && filtered.length === 0 && <p className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500">No requests in this section.</p>}{filtered.map((request) => <RequestCard key={request.id} request={request} action={<Link className="rounded-lg border px-4 py-2 text-sm font-semibold text-blue-700" href={`/provider/requests/${request.id}`}>Open</Link>} />)}</div></Shell>;
}

export function ProviderRequestWorkflow({ requestId }: { requestId: string }) {
  const { requests, error, loading, reload } = useProviderRequests();
  const request = requests.find((item) => String(item.id) === requestId);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  useLiveProviderLocation(Boolean(request && ["assigned", "accepted", "in_progress"].includes(request.status)), request?.id);

  const update = async (operation: "start" | "complete") => {
    setBusy(true); setActionError("");
    try { await apiRequest(`/provider/requests/${requestId}/${operation}`, { method: "PUT" }, localStorage.getItem("token")); await reload(); }
    catch (requestError) { setActionError(requestError instanceof Error ? requestError.message : "Unable to update request."); }
    finally { setBusy(false); }
  };

  const cancel = async () => {
    setBusy(true); setActionError(""); setShowCancelConfirm(false);
    try {
      await apiRequest(`/provider/requests/${requestId}/cancel`, { method: "PUT" }, localStorage.getItem("token"));
      await reload();
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Unable to cancel assistance.");
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    setBusy(true); setActionError("");
    try { await apiRequest(`/provider/requests/${requestId}/accept`, { method: "PUT" }, localStorage.getItem("token")); await reload(); }
    catch (requestError) { setActionError(requestError instanceof Error ? requestError.message : "Unable to accept request."); }
    finally { setBusy(false); }
  };

  if (loading) return <Shell title="Request details"><p className="mt-8 text-sm text-slate-500">Loading request...</p></Shell>;
  if (error || !request) return <Shell title="Request details"><p className="mt-8 text-sm text-red-600">{error || "Request not found or not assigned to you."}</p></Shell>;

  const isActive = ["assigned", "accepted", "in_progress"].includes(request.status);
  const canChat = ["accepted", "in_progress"].includes(request.status);

  const statusColors: Record<string, string> = {
    assigned: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <Shell title={request.title}>
      {/* Status bar */}
      <div className={`mt-6 flex items-center justify-between gap-4 rounded-xl border p-4 ${statusColors[request.status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full animate-pulse ${request.status === "in_progress" ? "bg-emerald-500" :
            request.status === "accepted" ? "bg-blue-500" :
              request.status === "assigned" ? "bg-amber-500" : "bg-slate-400"
            }`} />
          <div>
            <p className="font-bold text-sm">{statusLabels[request.status] || request.status}</p>
            <p className="text-xs opacity-70">Request #{request.id}</p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-2 text-xs">
            {request.status === "assigned" && (
              <button disabled={busy} onClick={accept}
                className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                Accept Request
              </button>
            )}
            {request.status === "accepted" && (
              <button disabled={busy} onClick={() => update("start")}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                Start Help (I Arrived)
              </button>
            )}
            {request.status === "in_progress" && (
              <button disabled={busy} onClick={() => update("complete")}
                className="rounded-lg bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-60">
                Mark Completed
              </button>
            )}
            <button disabled={busy} onClick={() => setShowCancelConfirm(true)}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 font-bold text-red-600 hover:bg-red-100 disabled:opacity-60">
              Cancel Help
            </button>
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-bold text-red-700">Are you sure you want to cancel?</p>
          <p className="mt-1 text-sm text-slate-600">
            Cancelling will notify all available providers again. This request will be re-opened.
          </p>
          <div className="mt-4 flex gap-3">
            <button onClick={cancel} disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
              Yes, Cancel Help
            </button>
            <button onClick={() => setShowCancelConfirm(false)}
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              No, Go Back
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: request details + live tracking */}
        <div className="space-y-6">
          <section className="rounded-xl border bg-white p-6">
            <h2 className="font-bold text-slate-800 text-lg">{request.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{request.description || "No description provided."}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase">Requester</dt>
                <dd className="mt-1 font-semibold text-slate-700">{request.requester_name || "—"}</dd>
                <dd className="text-xs text-slate-500">{request.requester_phone || ""}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase">Location</dt>
                <dd className="mt-1 font-semibold text-slate-700">{request.address || "Location unavailable"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase">Type</dt>
                <dd className="mt-1 font-semibold text-slate-700 capitalize">{request.request_type?.replace("_", " ")}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase">Posted</dt>
                <dd className="mt-1 text-slate-700">{new Date(request.created_at).toLocaleString()}</dd>
              </div>
            </dl>
            {request.latitude != null && request.longitude != null && (
              <a className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
                href={`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`}
                target="_blank" rel="noreferrer">
                <MapPin size={16} /> Open in Google Maps
              </a>
            )}
          </section>

          {/* Live tracking map — shows when provider is en route */}
          {isActive && <LiveTrackingMap requestId={request.id} />}
        </div>

        {/* Right: Chat */}
        {canChat && (
          <StyledChat requestId={request.id} token={localStorage.getItem("token")} />
        )}

        {!canChat && isActive && (
          <section className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
            <p className="font-semibold text-slate-700">Chat becomes available once you accept the request.</p>
            <p>Accept the request above to start communicating with the seeker.</p>
          </section>
        )}
      </div>
    </Shell>
  );
}

function Metric({ label, value, href }: { label: string; value: string; href: string }) { return <Link href={href} className="rounded-xl border bg-white p-5 shadow-sm hover:border-blue-300"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></Link>; }

type ChatMessage = { id?: number; senderId?: number; message: string; createdAt?: string; own?: boolean };

function StyledChat({ requestId, token }: { requestId: number; token: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !requestId) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.id || payload.userId || null);
    } catch { /* ignore */ }

    void apiRequest(`/chat/${requestId}/messages`, {}, token).then((data) => {
      const history: ChatMessage[] = (data.messages || []).map((m: { id: number; sender_id: number; message: string; sent_at: string }) => ({
        id: m.id,
        senderId: m.sender_id,
        message: m.message,
        createdAt: m.sent_at,
      }));
      setMessages(history);
    }).catch(() => {/* ignore */ });

    socket.auth = { token };
    socket.connect();
    socket.emit("join_request", requestId);
    setConnected(true);

    const onMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };
    socket.on("receive_message", onMessage);

    return () => {
      socket.emit("leave_request", requestId);
      socket.off("receive_message", onMessage);
      socket.disconnect();
      setConnected(false);
    };
  }, [requestId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !connected) return;
    socket.emit("send_message", { requestId, message: text.trim() });
    setText("");
  };

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden" style={{ height: "520px" }}>
      <div className="border-b px-5 py-4 flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
        <h3 className="font-bold text-slate-800">Chat with Seeker</h3>
        {connected && <span className="ml-auto text-xs text-emerald-600 font-semibold">Live</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.senderId === userId || msg.own;
          return (
            <div key={msg.id ?? i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}>
                <p>{msg.message}</p>
                <p className={`mt-1 text-[10px] ${isOwn ? "text-blue-200" : "text-slate-400"}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4 flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <button onClick={sendMessage} disabled={!text.trim() || !connected}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition">
          <Send size={18} />
        </button>
      </div>
    </section>
  );
}

