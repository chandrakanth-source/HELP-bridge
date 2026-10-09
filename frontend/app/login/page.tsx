"use client";

import Link from "next/link";
import { useState } from "react";
import {User,ShieldCheck,Crown,Lock,Mail,Eye,EyeOff,HeartHandshake,} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
type Role="user"|"manager"|"administrator";
export default function LoginPage() {
  const [role, setRole]=useState<Role>("user");
  const [showPassword, setShowPassword]=useState(false);
  const [email, setEmail]=useState("");
  const [password, setPassword]=useState("");
  const [error, setError]=useState("");
  const [loading, setLoading]=useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      const dashboard = data.user.role === "manager"
        ? "/manager/dashboard"
        : data.user.role === "admin"
          ? "/admin/dashboard"
          : data.user.role === "provider"
            ? "/provider/dashboard"
            : "/dashboard/seeker";
      router.push(dashboard);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="grid min-h-[680px] lg:grid-cols-2">

          <div className="relative hidden overflow-hidden bg-emerald-700 lg:flex">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-900" />
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-400/20" />
            <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-teal-300/10" />
            <div className="relative z-10 flex flex-col justify-between p-12 text-white">

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><HeartHandshake size={27} /></div>
                <div>
                  <h1 className="text-2xl font-bold">HelpBridge</h1>
                  <p className="text-xs text-emerald-100"> Bridging Help. Changing Lives.</p>
                </div>
              </div>
              <div>
                <p className="mb-4 text-lg font-medium text-emerald-100">Together,</p>
                <h2 className="text-5xl font-extrabold leading-tight">We Can
                  <br />
                  Make a
                  <br />
                  Difference
                </h2>
                <p className="mt-6 max-w-md leading-7 text-emerald-50">HelpBridge connects people who need help with trusted people who are ready to help.</p>

                <div className="mt-8 space-y-4">
                  <Feature text="Emergency & Non-Emergency Help" />
                  <Feature text="Verified & Trusted Providers" />
                  <Feature text="Secure, Fast & Reliable" />
                </div>
              </div>
              <p className="text-sm text-emerald-100">© 2026 HelpBridge</p>
            </div>
          </div>

         <div className="flex items-center justify-center p-8 sm:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white"><HeartHandshake size={24} /></div>
                <div>
                  <h1 className="text-xl font-bold text-emerald-700">HelpBridge</h1>
                  <p className="text-xs text-slate-500"> Bridging Help. Changing Lives.</p>
                </div>
              </div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Welcome Back!</h2>
                <p className="mt-2 text-slate-500">Login to your HelpBridge account</p>
              </div>
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">Select Your Role</label>
                <div className="grid grid-cols-3 gap-3">
                  <RoleButton selected={role === "user"} onClick={() => setRole("user")} icon={<User size={24} />}
                     title="USER"subtitle="Help Seeker / Provider"/>
                  <RoleButton selected={role === "manager"} onClick={() => setRole("manager")} icon={<ShieldCheck size={24} />}
                    title="MANAGER" subtitle="Verify & Manage Requests"/>
                  <RoleButton selected={role === "administrator"} onClick={() => setRole("administrator")} icon={<Crown size={24} />}
                    title="ADMIN" subtitle="Manage Platform"/>
                </div>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <Link href="/forgot_password"className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Forgot Password?</Link>
                  </div>
                  <div className="relative">
                    <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                    <button type="button" onClick={() =>setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? (<EyeOff size={19} /> ) : (<Eye size={19} />)}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600"/>
                  <span className="text-sm text-slate-500">Remember me</span>
                </div>
                {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button disabled={loading} type="submit"className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                  Login as{" "}
                  {loading ? "..." : role === "user"? "User": role === "manager"? "Manager": "Administrator"}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-500">
                <p> Don{"'"}t have an account?{" "} </p>
                    <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-700">Register as User</Link>
                <p className="mt-3"> Want to become a Manager?{" "}
                    <Link href="/manager_register" className="font-bold text-emerald-600 hover:text-emerald-700"> Apply for Manager Access</Link>
                </p>
                <p className="mt-3"> First administrator?{" "}
                  <Link href="/admin/setup" className="font-bold text-emerald-600 hover:text-emerald-700">Set up Admin Access</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">✓</div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
function RoleButton({ selected,onClick,icon,title,subtitle}: {selected: boolean;onClick: () => void;icon: React.ReactNode;title: string;subtitle: string;}) {
  return (
    <button type="button" onClick={onClick} className={`relative min-h-[125px] rounded-xl border-2 p-3 text-center transition ${selected
          ? "border-emerald-500 bg-emerald-50 text-emerald-700": "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}>
      <div className="flex justify-center">{icon}</div>
      <p className="mt-2 text-xs font-bold">{title}</p>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">{subtitle}</p>
      {selected && (
        <div className="absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">✓</div>
      )}
    </button>
  );
}
