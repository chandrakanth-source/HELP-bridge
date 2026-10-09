"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiRequest } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSent(false);
    setLoading(true);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-emerald-700">HelpBridge</h1>
            <p className="text-xs text-slate-500">Password recovery</p>
            <h2 className="text-3xl font-bold text-slate-900">Forgot password?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your email and we will send a password reset link if an account exists.
            </p>
            {sent ? (
              <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800" role="status">
                Check your email for a reset link. The link expires in 15 minutes.
              </div>
            ) : <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
                <div className="relative">
                  <input id="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
              </div>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button disabled={loading} type="submit" className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Creating reset link..." : "Continue"}
              </button>
            </form>}
            <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">Back to login</Link>
      </div>
    </main>
  );
}

