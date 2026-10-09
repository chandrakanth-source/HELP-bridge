"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  MapPin,
  Phone,
  ShieldCheck,
  Navigation,
  MessageCircle,
} from "lucide-react";
import { apiRequest } from "../../../../lib/api";
import socket from "../../../../lib/socket";

type ChatMessage = {
  id?: number;
  senderId?: number;
  sender_id?: number;
  message: string;
  createdAt?: string;
  sent_at?: string;
  sender_name?: string;
};

type RequestInfo = {
  id: number;
  title: string;
  status: string;
  requester_id: number;
  assigned_provider_id?: number | null;
  provider_name?: string;
  provider_phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export default function SeekerChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const requestId = Number(id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.id ?? payload.userId ?? null);
    } catch { /* ignore */ }

    apiRequest(`/help-requests/${requestId}`, {}, token)
      .then((data) => {
        setRequestInfo(data.request);
        setLoadingInfo(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load request");
        setLoadingInfo(false);
      });

    apiRequest(`/chat/${requestId}/messages`, {}, token)
      .then((data) => {
        setMessages(data.messages || []);
      })
      .catch(() => { /* ignore — chat may not be available yet */ });

    socket.auth = { token };
    socket.connect();
    socket.emit("join_request", requestId);
    setConnected(true);

    const onMsg = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };
    socket.on("receive_message", onMsg);

    void apiRequest(`/chat/${requestId}/messages/read`, { method: "PUT" }, token).catch(() => {});

    return () => {
      socket.emit("leave_request", requestId);
      socket.off("receive_message", onMsg);
      socket.disconnect();
      setConnected(false);
    };
  }, [requestId, router]);

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

  if (loadingInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 animate-pulse">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8">
        <p className="text-red-600">{error}</p>
        <Link href="/dashboard/seeker" className="text-blue-600 underline">← Back to dashboard</Link>
      </div>
    );
  }

  const canChat = requestInfo && ["accepted", "in_progress", "completed"].includes(requestInfo.status);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/dashboard/seeker"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-slate-900">
              {requestInfo?.provider_name ?? "Waiting for provider..."}
            </p>
            <p className="truncate text-xs text-slate-500">
              {requestInfo?.title ?? `Request #${requestId}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {requestInfo?.provider_phone && (
              <a
                href={`tel:${requestInfo.provider_phone}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                aria-label="Call provider"
              >
                <Phone size={17} />
              </a>
            )}
            {requestInfo?.latitude && (
              <Link
                href={`/requests/${requestId}/track`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                aria-label="Track provider"
              >
                <Navigation size={17} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Status bar */}
      {requestInfo && (
        <div className={`border-b px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide ${
          requestInfo.status === "in_progress" ? "bg-emerald-50 text-emerald-700" :
          requestInfo.status === "accepted"    ? "bg-blue-50 text-blue-700" :
          requestInfo.status === "assigned"    ? "bg-amber-50 text-amber-700" :
          "bg-slate-100 text-slate-500"
        }`}>
          {requestInfo.status === "in_progress" ? "🟢 Provider is helping you now" :
           requestInfo.status === "accepted"    ? "🔵 Provider is on the way" :
           requestInfo.status === "assigned"    ? "🟡 Provider assigned — awaiting acceptance" :
           requestInfo.status === "completed"   ? "✅ Help completed" :
           requestInfo.status.replace(/_/g, " ")}
        </div>
      )}

      {/* Chat body */}
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          {!canChat ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <MessageCircle size={30} className="text-blue-400" />
              </div>
              <h3 className="font-bold text-slate-700">Chat not available yet</h3>
              <p className="max-w-xs text-sm text-slate-500">
                Chat opens once a provider accepts your request and is on the way.
                Current status: <span className="font-semibold capitalize">{requestInfo?.status?.replace(/_/g, " ")}</span>
              </p>
              {requestInfo?.latitude && (
                <Link
                  href={`/requests/${requestId}/track`}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  <Navigation size={16} /> Track Request
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6" style={{ maxHeight: "calc(100vh - 220px)" }}>
                {messages.length === 0 && (
                  <p className="mt-12 text-center text-sm text-slate-400">
                    No messages yet. Say hello to your provider!
                  </p>
                )}
                {messages.map((msg, i) => {
                  const sid = msg.sender_id ?? msg.senderId;
                  const isOwn = sid === userId;
                  const time = msg.sent_at ?? msg.createdAt;
                  return (
                    <div key={msg.id ?? i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      {!isOwn && (
                        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          P
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isOwn
                          ? "rounded-br-sm bg-blue-600 text-white"
                          : "rounded-bl-sm bg-white text-slate-800"
                      }`}>
                        {!isOwn && msg.sender_name && (
                          <p className="mb-1 text-[10px] font-semibold text-blue-600">{msg.sender_name}</p>
                        )}
                        <p>{msg.message}</p>
                        <p className={`mt-1 text-[10px] ${isOwn ? "text-blue-200" : "text-slate-400"}`}>
                          {formatTime(time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="sticky bottom-0 border-t bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  {requestInfo?.latitude && (
                    <Link
                      href={`/requests/${requestId}/track`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                      aria-label="View live tracking"
                    >
                      <MapPin size={18} />
                    </Link>
                  )}
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!text.trim() || !connected}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 px-1">
                  <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  <span className="text-[10px] text-slate-400">{connected ? "Connected — messages are live" : "Connecting..."}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

