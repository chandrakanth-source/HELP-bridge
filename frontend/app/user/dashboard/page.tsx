"use client";

import Link from "next/link";
import {Home,Siren,Wrench,ClipboardList,History,MessageSquare,CreditCard,User,Settings,LogOut,Bell,MapPin,Phone,Mail,Droplet,ChevronRight,Headphones,ShieldCheck,Menu,X,ArrowRight,} from "lucide-react";
import { useState } from "react";
export default function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-between border-b bg-white px-5 py-4 lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-slate-700"><Menu size={25} /></button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck size={21} />
          </div>
          <span className="text-lg font-bold text-blue-600">HelpBridge</span>
        </div>
        <Bell size={22} className="text-slate-600" />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)}/>
      )}
      <aside className={`fixed left-0 top-0 z-50 h-screen w-64 transform border-r bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck size={23} />
            </div>
            <span className="text-xl font-bold text-blue-600">HelpBridge</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={22} />
          </button>
        </div>
        <nav className="space-y-1 px-3 py-6">
          <SidebarItem href="/user/dashboard" icon={<Home size={20} />} text="Dashboard" active/>
          <SidebarItem href="/user/emergency" icon={<Siren size={20} />} text="Emergency SOS" emergency />
          <SidebarItem href="/user/non-emergency" icon={<Wrench size={20} />} text="Non-Emergency Help"/>
          <SidebarItem href="/user/active-requests" icon={<ClipboardList size={20} />} text="Active Requests"/>
          <SidebarItem href="/user/history"icon={<History size={20} />} text="Request History"/>
          <SidebarItem href="/user/messages" icon={<MessageSquare size={20} />} text="Messages" badge="2"/>
          <SidebarItem href="/user/payments"  icon={<CreditCard size={20} />} text="Payments"/>
          <SidebarItem href="/user/profile" icon={<User size={20} />} text="Profile"/>
          <SidebarItem href="/user/settings" icon={<Settings size={20} />} text="Settings"/>
        </nav>

        <div className="absolute bottom-0 w-full border-t p-3">
          <Link href="/login" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50">
            <LogOut size={20} />Logout
          </Link>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="hidden h-20 items-center justify-between border-b bg-white px-8 lg:flex">
          <div />
          <div className="flex items-center gap-6">
            <Link href="/user/notifications" className="relative text-slate-600">
              <Bell size={23} />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">3</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">C</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Chandrakanth</p>
                <p className="text-xs text-slate-500">User</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome, Chandrakanth!</h1>
              <p className="mt-2 text-slate-500"></p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl border bg-white px-4 py-3 shadow-sm">
              <MapPin size={19} className="text-blue-600"/>
              <span className="text-sm font-medium text-slate-700">Hyderabad, Telangana</span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-6">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                  <Siren size={31} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-600">Emergency SOS</h2>
                  <p className="mt-2 max-w-sm text-slate-600">Get immediate help in critical situations.</p>
                </div>
              </div>
              <Link href="/user/emergency" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600">Send SOS Now
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Wrench size={31} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-600">Non-Emergency Help</h2>
                  <p className="mt-2 max-w-sm text-slate-600">  Request assistance for general help and services.</p>
                </div>
              </div>
              <Link href="/user/non-emergency" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700">Request Hello<ArrowRight size={18} /></Link>
            </div>
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Active Requests</h2>
                  <p className="mt-1 text-sm text-slate-500">Track your ongoing help requests.</p>
                </div>
                <Link href="/user/active-requests" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</Link>
              </div>
              <div className="m-6 rounded-xl border-2 border-dashed border-blue-100 bg-blue-50/30 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <ClipboardList size={27} />
                </div>
                <h3 className="mt-4 font-bold text-slate-800">You have no active requests</h3>
                <p className="mt-1 text-sm text-slate-500">Your active requests will appear here.</p>
                <Link href="/user/non-emergency" className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Send a Request</Link>
              </div>
              <div className="border-t px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-state-900">Recent Requests</h2>
                  <Link href="/user/history" className="text-sm font-semibold text-blue-600">View All</Link>
                </div>
                <div className="py-10 text-center">
                  <History size={38} className="mx-auto text-slate-300"/>
                  <p className="mt-3 font-semibold text-slate-600">No recent requests</p>
                  <p className="mt-1 text-sm text-slate-400">Your request history will appear here.</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-900">My Profile</h2>
                  <Link href="/user/profile" className="text-sm font-semibold text-blue-600">View Profile</Link>
                </div>
                <div className="mt-5 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">C</div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">Chandrakanth</h3>
                </div>
                <div className="mt-5 space-y-4">
                  <ProfileItem icon={<Phone size={17} />}text="+91 9876543210"/>
                  <ProfileItem icon={<Mail size={17} />} text="chandu@example.com"/>
                  <ProfileItem icon={<MapPin size={17} />} text="Hyderabad, Telangana"/>
                  <ProfileItem icon={<Droplet size={17} />} text="O+ Blood Group"/>
                </div>
              </div>

              <div className="rounded-2xl border bg-white shadow-sm">
                <div className="border-b px-6 py-5">
                  <h2 className="font-bold text-slate-900">Quick Actions</h2>
                </div>
                <QuickAction icon={<ClipboardList size={19} />} text="Track My Requests" href="/user/active-requests"/>
                <QuickAction icon={<MessageSquare size={19} />} text="Message Support" href="/user/messages"/>
                <QuickAction icon={<CreditCard size={19} />} text="Payment History" href="/user/payments"/>
                <QuickAction icon={<User size={19} />} text="Update Profile" href="/user/profile"/>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Headphones size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-800">Need Help? </h3>
                    <p className="text-sm text-emerald-700">Contact our support team.</p>
                  </div>
                </div>
                <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@helpbridge.com"}`} className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Contact Support</a>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
            <ShieldCheck size={21} className="mt-0.5 shrink-0 text-purple-600"/>
            <p className="text-sm text-purple-700">
              <span className="font-semibold"> Your safety is our priority. </span>{" "}
              In case of a life-threatening emergency, please contact local emergency services directly.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
function SidebarItem({href,icon,text,active = false,emergency = false,badge,}: {href: string;icon: React.ReactNode;text: string;active?: boolean;emergency?: boolean;badge?: string;}) {
  return (
    <Link href={href} className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${active? "bg-blue-50 text-blue-600": emergency? "text-slate-700 hover:bg-red-50 hover:text-red-600": "text-slate-700 hover:bg-slate-100"}`}>
      <span className="flex items-center gap-3">
        <span className={emergency && !active? "text-red-500": active? "text-blue-600": "text-slate-500"} >{icon}</span>
        {text}
      </span>
      {badge && (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
function ProfileItem({icon,text,}: {icon: React.ReactNode;text: string;}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <span className="text-slate-400">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
function QuickAction({icon,text,href}: {icon: React.ReactNode;text: string;href: string;}) {
  return (
    <Link href={href} className="flex items-center justify-between border-b px-6 py-4 text-sm font-medium text-slate-700 transition last:border-b-0 hover:bg-slate-50">
      <span className="flex items-center gap-3">
        <span className="text-blue-600">{icon}</span>
        {text}
      </span>
      <ChevronRight size={17} className="text-slate-400"/>
    </Link>
  );
}
