"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, Mail, MapPin, Phone, Save, ShieldCheck, User, Droplet, Briefcase } from "lucide-react";
import { apiRequest } from "../../../lib/api";

type Profile = { name: string; email: string; phone: string; occupation: string; blood_group: string; address: string; role: string; };
const emptyProfile: Profile = { name: "", email: "", phone: "", occupation: "", blood_group: "", address: "", role: "seeker" };

export default function UserProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setError("Please log in to view your profile."); return; }
        const data = await apiRequest("/profile", {}, token);
        setProfile({ ...emptyProfile, ...data.user });
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load profile."); }
      finally { setLoading(false); }
    };
    loadProfile();
  }, []);

  const update = (field: keyof Profile, value: string) => setProfile((current) => ({ ...current, [field]: value }));
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage(""); setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const data = await apiRequest("/profile", { method: "PATCH", body: JSON.stringify(profile) }, token);
      setProfile({ ...emptyProfile, ...data.user }); setMessage("Profile updated successfully.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to update profile."); }
    finally { setSaving(false); }
  };

  const initial = profile.name.trim().charAt(0).toUpperCase() || "U";
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link href="/user/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft size={18} />Back to Dashboard</Link><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><ShieldCheck size={20} /></div><span className="font-bold text-slate-900">HelpBridge</span></div></div></header>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"><User size={30} /></div><h1 className="text-3xl font-bold text-slate-900">My Profile</h1><p className="mt-2 text-slate-500">Keep your contact details current for better assistance.</p></div>
        {loading && <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Loading profile...</div>}
        {!loading && error && !profile.email && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!loading && profile.email && <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8"><div className="mb-8 flex items-center gap-4 border-b pb-6"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">{initial}</div><div><h2 className="text-xl font-bold text-slate-900">{profile.name}</h2><p className="mt-1 text-sm capitalize text-slate-500">{profile.role} account</p></div></div><div className="grid gap-5 sm:grid-cols-2"><Field id="name" label="Full name" icon={<User size={18} />} value={profile.name} onChange={(value) => update("name", value)} /><Field id="phone" label="Phone number" icon={<Phone size={18} />} value={profile.phone} onChange={(value) => update("phone", value)} /><Field id="email" label="Email address" icon={<Mail size={18} />} value={profile.email} disabled onChange={() => undefined} /><Field id="occupation" label="Occupation" icon={<Briefcase size={18} />} value={profile.occupation} onChange={(value) => update("occupation", value)} /><Field id="blood_group" label="Blood group" icon={<Droplet size={18} />} value={profile.blood_group} onChange={(value) => update("blood_group", value)} /><Field id="address" label="Address" icon={<MapPin size={18} />} value={profile.address} onChange={(value) => update("address", value)} /></div>{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{message && <p role="status" className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><Check size={16} />{message}</p>}<button disabled={saving} type="submit" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={18} />{saving ? "Saving..." : "Save changes"}</button></form>}
      </div>
    </main>
  );
}

function Field({ id, label, icon, value, disabled = false, onChange }: { id: string; label: string; icon: React.ReactNode; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">{label}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span><input id={id} disabled={disabled} value={value || ""} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500" /></div></div>;
}

