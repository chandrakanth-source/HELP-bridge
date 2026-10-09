"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DollarSign, CheckCircle2, XCircle, ShieldAlert, RefreshCw, Send } from "lucide-react";
import { apiRequest } from "../lib/api";

interface BargainModalProps {
  requestId: number;
  providerId?: number;
  isOpen: boolean;
  onClose: () => void;
  onAgreed?: (finalPrice: number) => void;
}

interface OfferHistory {
  id: number;
  sender_role: string;
  offered_price: string;
  status: string;
  round_number: number;
  created_at: string;
  provider_name?: string;
  seeker_name?: string;
}

export default function BargainModal({
  requestId,
  providerId,
  isOpen,
  onClose,
  onAgreed,
}: BargainModalProps) {
  const [history, setHistory] = useState<OfferHistory[]>([]);
  const [offerPrice, setOfferPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [myRole, setMyRole] = useState<"seeker" | "provider" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMyRole(payload.role === "seeker" ? "seeker" : "provider");
    } catch {
      setMyRole("provider");
    }
  }, [isOpen]);

  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await apiRequest(`/bargain/history/${requestId}`, {}, token);
      setHistory(data.history || []);
    } catch (err) {
      console.error("Failed to load bargain history:", err);
    }
  }, [requestId]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      void fetchHistory();
      pollRef.current = setInterval(() => void fetchHistory(), 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  const pendingOffers = history.filter((o) => o.status === "pending");
  const latestPending = pendingOffers[pendingOffers.length - 1];
  const agreedOffer = history.find((o) => o.status === "accepted");
  const isBargainDone = !!agreedOffer;

  const canSendOffer = !isBargainDone && (
    myRole === "provider"
      ? !latestPending || latestPending.sender_role === "seeker"
      : !latestPending || latestPending.sender_role === "provider"
  );

  const handleSendOffer = async () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      await apiRequest(
        "/bargain/offer",
        {
          method: "POST",
          body: JSON.stringify({
            request_id: requestId,
            ...(providerId && providerId > 0 ? { provider_id: providerId } : {}),
            offered_price: parseFloat(offerPrice),
            round_number: history.length + 1,
          }),
        },
        token,
      );
      setOfferPrice("");
      await fetchHistory();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit price offer.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId: number, price: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      await apiRequest(`/bargain/accept/${offerId}`, { method: "POST" }, token);
      if (onAgreed) onAgreed(parseFloat(price));
      await fetchHistory();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to accept offer.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (offerId: number) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      await apiRequest(`/bargain/reject/${offerId}`, { method: "POST" }, token);
      await fetchHistory();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to reject offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Price Negotiation</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {isBargainDone
                  ? `Agreed at $${parseFloat(agreedOffer!.offered_price).toFixed(2)}`
                  : myRole === "seeker" ? "Review provider offers and negotiate" : "Negotiate service fee"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void fetchHistory()} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer">
              &#x2715;
            </button>
          </div>
        </div>

        <div className="px-5 py-2 bg-slate-900/80 border-b border-slate-800/60 flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            myRole === "seeker"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
          }`}>
            You: {myRole === "seeker" ? "SEEKER" : "PROVIDER"}
          </span>
          <span className="text-xs text-slate-500">Request #{requestId}</span>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {history.length === 0 ? (
            <div className="text-center text-slate-500 py-8 text-sm">
              <DollarSign className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              {myRole === "provider" ? "Enter a price below to start negotiating." : "Waiting for a provider to make an offer..."}
            </div>
          ) : (
            history.map((offer) => {
              const isMyOffer = offer.sender_role === myRole;
              const isPending = offer.status === "pending";
              const isAccepted = offer.status === "accepted";
              return (
                <div key={offer.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isMyOffer ? "bg-indigo-950/40 border-indigo-800/50" : "bg-slate-800/60 border-slate-700"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">
                        Round #{offer.round_number} from{" "}
                        <span className={`capitalize font-semibold ${isMyOffer ? "text-indigo-300" : "text-slate-300"}`}>
                          {isMyOffer ? "You" : offer.sender_role === "seeker" ? (offer.seeker_name || "Seeker") : (offer.provider_name || "Provider")}
                        </span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                        ${parseFloat(offer.offered_price).toFixed(2)}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${
                      isAccepted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : offer.status === "rejected" ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}>
                      {isAccepted ? "Agreed" : offer.status}
                    </span>
                  </div>
                  {isPending && !isMyOffer && (
                    <div className="flex gap-2 pt-1 border-t border-slate-700/50">
                      <button type="button" onClick={() => handleAccept(offer.id, offer.offered_price)} disabled={loading}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept ${parseFloat(offer.offered_price).toFixed(2)}
                      </button>
                      <button type="button" onClick={() => handleReject(offer.id)} disabled={loading}
                        className="flex-1 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {errorMsg && (
          <div className="px-5 py-2 bg-rose-500/10 text-rose-400 text-xs border-t border-rose-500/20 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" /> {errorMsg}
          </div>
        )}

        {!isBargainDone && (
          <div className="p-5 bg-slate-950 border-t border-slate-800">
            {!canSendOffer ? (
              <p className="text-center text-xs text-slate-500 py-1">
                {latestPending?.sender_role === myRole
                  ? "Waiting for the other party to respond..."
                  : "Accept or reject the offer above to continue."}
              </p>
            ) : (
              <>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  {myRole === "seeker" ? "Counter-offer ($)" : "Propose price ($)"}
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono">$</span>
                    <input type="number" min="1" step="0.5" value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleSendOffer(); }}
                      placeholder="e.g. 25.00"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 text-white pl-7 pr-3 py-2 rounded-xl text-sm outline-none" />
                  </div>
                  <button type="button" onClick={() => void handleSendOffer()} disabled={loading || !offerPrice}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                    <Send className="w-4 h-4" /> {loading ? "..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {isBargainDone && (
          <div className="p-5 bg-emerald-900/20 border-t border-emerald-800/40 text-center">
            <p className="text-emerald-300 font-bold">Deal agreed at <span className="text-emerald-400 font-mono">${parseFloat(agreedOffer!.offered_price).toFixed(2)}</span></p>
            <p className="text-xs text-slate-400 mt-1">Provider has been assigned to your request.</p>
            <button type="button" onClick={onClose} className="mt-3 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition cursor-pointer">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

