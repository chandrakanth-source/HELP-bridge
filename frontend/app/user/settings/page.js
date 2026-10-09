"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Check, Settings as SettingsIcon } from "lucide-react";

const defaults = { notifications: true, messageAlerts: true };

export default function UserSettingsPage() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("helpbridge-seeker-settings");
      if (stored) setSettings({ ...defaults, ...JSON.parse(stored) });
    } catch {
      /* Use defaults when local settings are unavailable. */
    }
  }, []);

  const update = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    localStorage.setItem("helpbridge-seeker-settings", JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/seeker"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Control alerts for your help requests.
            </p>
          </div>
        </div>
        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
          <div className="mt-5 divide-y">
            <SettingRow
              label="Request updates"
              description="Approval, assignment, and completion notifications."
              enabled={settings.notifications}
              onToggle={() => update("notifications")}
            />
            <SettingRow
              label="Message alerts"
              description="Notify me when the assigned provider sends a message."
              enabled={settings.messageAlerts}
              onToggle={() => update("messageAlerts")}
            />
          </div>
          {saved && (
            <p
              role="status"
              className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700"
            >
              <Check size={16} /> Settings saved
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function SettingRow({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div>
        <p className="flex items-center gap-2 font-semibold text-slate-800">
          <Bell size={16} className="text-blue-600" /> {label}
        </p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? "bg-blue-600" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

