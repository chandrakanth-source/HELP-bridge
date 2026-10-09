"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";
import { apiRequest } from "../../../lib/api";

const chatStatuses = new Set([
  "assigned",
  "accepted",
  "in_progress",
  "completed",
]);

export default function MessagesPage() {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(
        "/help-requests/my",
        {},
        localStorage.getItem("token"),
      );
      const available = (data.requests || []).filter((request) =>
        chatStatuses.has(request.status),
      );
      setRequests(available);
      setSelectedId((current) =>
        current && available.some((request) => String(request.id) === current)
          ? current
          : available[0]
            ? String(available[0].id)
            : "",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load conversations.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (requestId = selectedId) => {
    if (!requestId) return;
    setMessagesLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const data = await apiRequest(`/chat/${requestId}/messages`, {}, token);
      setMessages(data.messages || []);
      await apiRequest(
        `/chat/${requestId}/messages/read`,
        { method: "PUT" },
        token,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load messages.",
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);
  useEffect(() => {
    void loadMessages();
  }, [selectedId]);

  const selectedRequest = useMemo(
    () => requests.find((request) => String(request.id) === selectedId),
    [requests, selectedId],
  );

  const send = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selectedId) return;
    setSending(true);
    setError("");
    try {
      const data = await apiRequest(
        `/chat/${selectedId}/messages`,
        { method: "POST", body: JSON.stringify({ message: draft.trim() }) },
        localStorage.getItem("token"),
      );
      setMessages((current) => [...current, data.data]);
      setDraft("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send message.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/seeker"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <h1 className="mt-5 text-3xl font-bold text-slate-900">Messages</h1>
            <p className="mt-1 text-sm text-slate-500">
              Talk with the provider assigned to your request.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadRequests();
              void loadMessages();
            }}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {loading ? (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border bg-white p-12 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" /> Loading
            conversations...
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed bg-white p-12 text-center text-sm text-slate-500">
            <MessageSquare size={34} className="mx-auto text-slate-300" />
            <p className="mt-3">
              Messages become available after a provider is assigned.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
            <section className="rounded-xl border bg-white p-3 shadow-sm">
              <h2 className="px-3 py-2 text-sm font-bold text-slate-900">
                Conversations
              </h2>
              <div className="space-y-1">
                {requests.map((request) => (
                  <button
                    type="button"
                    key={request.id}
                    onClick={() => setSelectedId(String(request.id))}
                    className={`w-full rounded-lg p-3 text-left ${selectedId === String(request.id) ? "bg-blue-50 text-blue-800" : "hover:bg-slate-50"}`}
                  >
                    <p className="font-semibold">{request.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Request #{request.id} ·{" "}
                      {request.status.replaceAll("_", " ")}
                    </p>
                  </button>
                ))}
              </div>
            </section>
            <section className="flex min-h-[480px] flex-col rounded-xl border bg-white shadow-sm">
              <div className="border-b p-5">
                <h2 className="font-bold text-slate-900">
                  {selectedRequest?.title || "Conversation"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Request #{selectedId}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messagesLoading ? (
                  <p className="text-sm text-slate-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No messages yet. Send the first message.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-lg bg-slate-50 p-3"
                    >
                      <p className="text-xs font-semibold text-slate-500">
                        {message.sender_name || `User ${message.sender_id}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {message.message}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t p-4">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  className="min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Send size={16} /> Send
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

