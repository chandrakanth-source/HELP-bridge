"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Check, LoaderCircle, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type Profile = { id: number; name: string; email: string; phone: string; role: string; created_at: string };
type Stats = { total_count: number; pending_count: number; active_count: number; completed_count: number };

export default function ManagerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const [profileData, statsData] = await Promise.all([
          apiRequest("/profile", {}, token),
          apiRequest("/manager/dashboard/stats", {}, token),
        ]);
        if (!cancelled) {
          setProfile(profileData.user);
          setName(profileData.user.name || "");
          setPhone(profileData.user.phone || "");
          setStats(statsData);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load profile.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadProfile();
    return () => { cancelled = true; };
  }, []);

  const saveProfile = async () => {
    setIsSaving(true);
    setMessage("");
    setError("");
    try {
      const data = await apiRequest("/profile", { method: "PATCH", body: JSON.stringify({ name, phone }) }, localStorage.getItem("token"));
      setProfile(data.user);
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-24 text-sm text-slate-500"><LoaderCircle className="mr-2 animate-spin" size={18} /> Loading profile...</div>;

  return (
    <div>
      <div><h1 className="text-3xl font-bold text-[#12234b]">Manager Profile</h1><p className="mt-2 text-slate-500">View and manage your personal information and account activity.</p></div>
      {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700"><Check size={17} /> {message}</p>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3 border-b pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><UserRound size={20} /></div><div><h2 className="font-bold text-[#12234b]">Personal Information</h2><p className="mt-1 text-xs text-slate-500">Keep your manager account details current.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal outline-none focus:border-blue-500" /></label><label className="text-sm font-semibold text-slate-700">Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal outline-none focus:border-blue-500" /></label></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="text-sm font-semibold text-slate-700">Email address<p className="mt-2 flex items-center gap-2 font-normal text-slate-600"><Mail size={16} />{profile?.email}</p></div><div className="text-sm font-semibold text-slate-700">Role<p className="mt-2 flex items-center gap-2 font-normal text-slate-600"><ShieldCheck size={16} />HelpBridge Manager</p></div></div><button onClick={saveProfile} disabled={isSaving} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Save size={17} />{isSaving ? "Saving..." : "Save profile"}</button></section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between border-b pb-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><BarChart3 size={20} /></div><h2 className="font-bold text-[#12234b]">Manager Statistics</h2></div><Link href="/manager/reports" className="text-xs font-bold text-blue-600 hover:text-blue-700">View analytics</Link></div><div className="mt-6 grid grid-cols-2 gap-4"><Stat value={stats?.total_count || 0} label="Total requests" /><Stat value={stats?.pending_count || 0} label="Pending" /><Stat value={stats?.active_count || 0} label="Active" /><Stat value={stats?.completed_count || 0} label="Completed" /></div></section>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-2xl font-bold text-slate-800">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{label}</p></div>; }

