"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, LoaderCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "../../../lib/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(
        "/payments/completed",
        {},
        localStorage.getItem("token"),
      );
      setPayments(data.payments || []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load payment history.",
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
            <h1 className="mt-5 text-3xl font-bold text-slate-900">Payments</h1>
            <p className="mt-1 text-sm text-slate-500">
              Pay completed requests and review your payment history.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/payment"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
            >
              <CreditCard size={16} /> Pay a request
            </Link>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </div>
        </div>
        {loading ? (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border bg-white p-12 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" /> Loading
            payments...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed bg-white p-12 text-center text-sm text-slate-500">
            <CreditCard size={34} className="mx-auto text-slate-300" />
            <p className="mt-3">No payments recorded yet.</p>
            <Link
              href="/payment"
              className="mt-5 inline-flex font-semibold text-teal-700"
            >
              Open payment page
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {payments.map((payment) => (
              <article
                key={payment.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Transaction #{payment.id}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {payment.title || `Request #${payment.request_id}`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {payment.provider_name
                        ? `Provider: ${payment.provider_name}`
                        : "Provider unavailable"}
                    </p>
                  </div>
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {payment.payment_status || "Recorded"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap justify-between gap-3 border-t pt-4 text-sm">
                  <span className="font-bold text-slate-800">
                    ₹{payment.amount}
                  </span>
                  <span className="text-slate-500">
                    {payment.paid_at
                      ? new Date(payment.paid_at).toLocaleString()
                      : new Date(payment.created_at).toLocaleString()}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

