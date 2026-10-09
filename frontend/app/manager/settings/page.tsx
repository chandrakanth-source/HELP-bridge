"use client";

import { useEffect, useState } from "react";
import { Bell, Check, LockKeyhole, Save, ShieldCheck, UserRound } from "lucide-react";

type SettingsState = {
  emailAlerts: boolean;
  requestAlerts: boolean;
  providerAlerts: boolean;
  compactView: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  emailAlerts: true,
  requestAlerts: true,
  providerAlerts: true,
  compactView: false,
};

export default function ManagerSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      const stored = localStorage.getItem("helpbridge-manager-settings");
      if (stored) {
        try {
          if (!cancelled) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        } catch {
          localStorage.removeItem("helpbridge-manager-settings");
        }
      }
    };
    void loadSettings();
    return () => { cancelled = true; };
  }, []);

  const updateSetting = (key: keyof SettingsState) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem("helpbridge-manager-settings", JSON.stringify(settings));
    setSaved(true);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div><h1 className="text-3xl font-bold text-[#12234b]">Settings</h1><p className="mt-2 text-slate-500">Manage your manager workspace and notification preferences.</p></div>
        <button onClick={saveSettings} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"><Save size={17} /> Save changes</button>
      </div>

      {saved && <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"><Check size={17} /> Settings saved successfully.</div>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5"><div className="flex items-center gap-3"><Bell className="text-blue-600" size={21} /><div><h2 className="font-bold text-[#12234b]">Notifications</h2><p className="mt-1 text-xs text-slate-500">Choose which updates appear in your manager workspace.</p></div></div></div>
          <div className="divide-y px-6">
            <SettingToggle title="Email alerts" description="Receive important HelpBridge updates by email." checked={settings.emailAlerts} onChange={() => updateSetting("emailAlerts")} />
            <SettingToggle title="Request alerts" description="Notify me when emergency requests need verification." checked={settings.requestAlerts} onChange={() => updateSetting("requestAlerts")} />
            <SettingToggle title="Provider alerts" description="Notify me about provider registrations and status changes." checked={settings.providerAlerts} onChange={() => updateSetting("providerAlerts")} />
          </div>
        </section>

        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5"><div className="flex items-center gap-3"><ShieldCheck className="text-green-600" size={21} /><div><h2 className="font-bold text-[#12234b]">Workspace</h2><p className="mt-1 text-xs text-slate-500">Adjust how manager pages are displayed.</p></div></div></div>
          <div className="px-6"><SettingToggle title="Compact view" description="Use tighter spacing in request lists and tables." checked={settings.compactView} onChange={() => updateSetting("compactView")} /></div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border bg-white shadow-sm"><div className="border-b px-6 py-5"><div className="flex items-center gap-3"><UserRound className="text-blue-600" size={21} /><div><h2 className="font-bold text-[#12234b]">Account & security</h2><p className="mt-1 text-xs text-slate-500">Quick links for manager account actions.</p></div></div></div><div className="flex flex-wrap gap-3 px-6 py-5"><a href="/manager/profile" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><UserRound size={17} /> Edit profile</a><a href="/forgot_password" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LockKeyhole size={17} /> Change password</a></div></section>
    </div>
  );
}

function SettingToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: () => void }) {
  return <div className="flex items-center justify-between gap-5 py-5"><div><p className="text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div><button type="button" role="switch" aria-checked={checked} aria-label={title} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-blue-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} /></button></div>;
}

