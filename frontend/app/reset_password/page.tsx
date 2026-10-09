"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";

export default function ResetPasswordPage() {
  const [token] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("token") || "",
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is missing or invalid.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.push("/login?reset=success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-emerald-700">HelpBridge</h1>
            <p className="text-xs text-slate-500">Choose a new password</p>
            <h2 className="text-3xl font-bold text-slate-900">Reset password</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your reset link is valid for 15 minutes.</p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <PasswordInput id="password" label="New password" value={password} onChange={setPassword} />
              <PasswordInput id="confirmation" label="Confirm new password" value={confirmation} onChange={setConfirmation} />
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button disabled={loading} type="submit" className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Updating password..." : "Update password"}
              </button>
            </form>
            <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">Back to login</Link>
      </div>
    </main>
  );
}

function PasswordInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={id}>{label}</label>
      <div className="relative">
        <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input id={id} required minLength={8} type="password" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
      </div>
    </div>
  );
}

