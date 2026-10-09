"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, LoaderCircle, MapPin } from "lucide-react";
import { apiRequest } from "../../lib/api";

export default function PaymentPage() {
  const [requests, setRequests] = useState([]);
  const [requestId, setRequestId] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("requestId") || "",
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadCompletedRequests = async () => {
      try {
        const data = await apiRequest(
          "/help-requests/my",
          {},
          localStorage.getItem("token"),
        );
        setRequests(
          (data.requests || []).filter(
            (request) => request.status === "completed",
          ),
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load completed requests.",
        );
      } finally {
        setLoading(false);
      }
    };
    void loadCompletedRequests();
  }, []);

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  useEffect(() => {
    if (!requestId || !requests.length) return;
    const selectedRequestExists = requests.some(
      (request) => String(request.id) === String(requestId),
    );
    if (!selectedRequestExists) {
      setRequestId("");
    }
  }, [requestId, requests]);

  const handlePayment = async () => {
    if (!requestId) {
      setMessage("Select a completed request first.");
      return;
    }
    const selectedRequest = requests.find(
      (request) => String(request.id) === String(requestId),
    );
    if (!selectedRequest) {
      setMessage("That completed request is no longer available for payment.");
      return;
    }
    setPaying(true);
    setMessage("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay Checkout failed to load.");
      const order = await apiRequest(
        "/payments/create-order",
        {
          method: "POST",
          body: JSON.stringify({ requestId: Number(requestId) }),
        },
        localStorage.getItem("token"),
      );
      const token = localStorage.getItem("token");
      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "HelpBridge",
        description: "Completed help request",
        order_id: order.orderId,
        theme: { color: "#0f766e" },
        handler: async (paymentResponse) => {
          try {
            await apiRequest(
              "/payments/verify",
              {
                method: "POST",
                body: JSON.stringify(paymentResponse),
              },
              token,
            );
            setMessage("Payment successful. Thank you for using HelpBridge.");
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Payment verification failed.",
            );
          } finally {
            setPaying(false);
          }
        },
      });
      razorpay.on("payment.failed", () => {
        setMessage("Payment failed. Please try again.");
        setPaying(false);
      });
      razorpay.open();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to start payment.",
      );
      setPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-800">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/seeker"
          className="text-sm font-semibold text-teal-700"
        >
          Back to dashboard
        </Link>
        <div className="mt-5 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Pay for completed help
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Choose a completed request to continue securely with Razorpay.
              </p>
            </div>
          </div>
          {loading ? (
            <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="animate-spin" size={18} /> Loading
              completed requests...
            </div>
          ) : requests.length === 0 ? (
            <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No completed requests are waiting for payment.
            </p>
          ) : (
            <div className="mt-8 space-y-3">
              {requests.map((request) => (
                <label
                  key={request.id}
                  className={`block cursor-pointer rounded-xl border p-4 ${requestId === String(request.id) ? "border-teal-500 bg-teal-50" : "border-slate-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="request"
                      value={request.id}
                      checked={requestId === String(request.id)}
                      onChange={(event) => setRequestId(event.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-900">
                          {request.title}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 size={15} /> Completed
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Request #{request.id}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={13} />{" "}
                        {request.address || "Location unavailable"}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {message && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
            >
              {message}
            </p>
          )}
          <button
            onClick={handlePayment}
            disabled={paying || loading || !requestId}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paying ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />{" "}
                Processing...
              </>
            ) : (
              <>Pay ₹100 securely</>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

