"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  LayoutDashboard,
  ClipboardList,
  Activity,
  CheckCircle,
  Wallet,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin,
  Clock,
  Ambulance,
  Car,
  ShieldCheck,
  ChevronRight,
  CircleCheck,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { ProviderDashboardWorkflow } from "../../../components/ProviderWorkflow";

function LegacyProviderDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [available, setAvailable] = useState(true);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[245px] bg-[#06295f] text-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* LOGO */}

        <div className="flex h-[88px] items-center border-b border-white/10 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700">
              <ShieldCheck size={27} />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                HelpBridge
              </h1>

              <p className="text-xs text-blue-200">
                Provider Panel
              </p>
            </div>

          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden"
          >
            <X size={22} />
          </button>

        </div>

        {/* NAVIGATION */}

        <nav className="px-3 py-6">

          {/* Back to Seeker Dashboard */}
          <Link
            href="/dashboard/seeker"
            className="mb-3 flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-white/20"
          >
            <ArrowLeft size={17} />
            Seeker Dashboard
          </Link>

          <div className="mb-3 border-t border-white/10" />

          <SidebarItem
            href="/provider/dashboard"
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
            active
          />

          <SidebarItem
            href="/provider/available-requests"
            icon={<ClipboardList size={19} />}
            label="Available Requests"
          />

          <SidebarItem
            href="/provider/active-help"
            icon={<Activity size={19} />}
            label="My Active Help"
          />

          <SidebarItem
            href="/provider/completed-help"
            icon={<CheckCircle size={19} />}
            label="Completed Help"
          />

          <SidebarItem
            href="/provider/earnings"
            icon={<Wallet size={19} />}
            label="Earnings"
          />

          <SidebarItem
            href="/provider/notifications"
            icon={<Bell size={19} />}
            label="Notifications"
            badge="5"
          />

          <SidebarItem
            href="/provider/profile"
            icon={<User size={19} />}
            label="Profile"
          />

          <SidebarItem
            href="/provider/settings"
            icon={<Settings size={19} />}
            label="Settings"
          />

        </nav>

        {/* LOGOUT */}

        <div className="absolute bottom-0 left-3 right-3 border-t border-white/10 py-5">

          <Link
            href="/login"
            className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-white/10"
          >
            <LogOut size={20} />
            Logout
          </Link>

        </div>

      </aside>

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= MAIN ================= */}

      <main className="lg:ml-[245px]">

        {/* HEADER */}

        <header className="flex h-[88px] items-center border-b bg-white px-5 sm:px-8">

          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu size={25} />
          </button>

          <div className="ml-auto flex items-center gap-6">

            {/* NOTIFICATION */}

            <button className="relative text-slate-600">

              <Bell size={23} />

              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                5
              </span>

            </button>

            {/* PROFILE */}

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                AK
              </div>

              <div className="hidden sm:block">

                <p className="text-sm font-bold text-slate-800">
                  Arjun Kumar
                </p>

                <p className="text-xs text-slate-500">
                  Medical Volunteer
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* ================= PAGE CONTENT ================= */}

        <div className="p-5 sm:p-8">

          {/* GREETING */}

          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">

            <div>

              <h2 className="text-3xl font-bold text-[#10275a]">
                Good Morning, Arjun 👋
              </h2>

              <p className="mt-2 text-slate-500">
                You are currently available for help requests.
              </p>

            </div>

            {/* AVAILABILITY */}

            <div className="flex items-center justify-between rounded-xl border bg-white px-6 py-4 shadow-sm sm:min-w-[310px]">

              <div className="flex items-center gap-3">

                <span
                  className={`h-3 w-3 rounded-full ${
                    available
                      ? "bg-green-500"
                      : "bg-slate-400"
                  }`}
                />

                <div>

                  <p className="text-xs text-slate-500">
                    You are
                  </p>

                  <p
                    className={`text-lg font-bold ${
                      available
                        ? "text-green-600"
                        : "text-slate-500"
                    }`}
                  >
                    {available ? "Available" : "Offline"}
                  </p>

                </div>

              </div>

              {/* TOGGLE */}

              <button
                onClick={() => setAvailable(!available)}
                className={`relative h-7 w-12 rounded-full transition ${
                  available
                    ? "bg-green-500"
                    : "bg-slate-300"
                }`}
              >

                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    available
                      ? "left-6"
                      : "left-1"
                  }`}
                />

              </button>

            </div>

          </div>

          {/* ================= STATISTICS ================= */}

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon={<ClipboardList size={24} />}
              value="12"
              title="Available Requests"
              subtitle="Nearby requests"
              type="blue"
            />

            <StatCard
              icon={<Activity size={24} />}
              value="2"
              title="Active Help"
              subtitle="Requests in progress"
              type="green"
            />

            <StatCard
              icon={<CheckCircle size={24} />}
              value="48"
              title="Completed Help"
              subtitle="All time completed"
              type="purple"
            />

            <StatCard
              icon={<Wallet size={24} />}
              value="₹12,850"
              title="Total Earnings"
              subtitle="All time earnings"
              type="orange"
            />

          </div>

          {/* ================= MAIN GRID ================= */}

          <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_390px]">

            {/* LEFT SIDE */}

            <div>

              {/* RECENT REQUESTS */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <h3 className="text-lg font-bold text-[#10275a]">
                    Recent Available Requests
                  </h3>

                  <Link
                    href="/provider/available-requests"
                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All Requests
                    <ChevronRight size={16} />
                  </Link>

                </div>

                <div className="mt-5 space-y-4">

                  {/* REQUEST 1 */}

                  <RequestCard
                    type="emergency"
                    title="Accident Assistance"
                    location="Madhapur, Hyderabad"
                    distance="2.4 km away"
                    description="Accident reported near Cyber Towers. Need immediate assistance."
                    payment="₹850"
                    priority="High Priority"
                    time="5 min ago"
                  />

                  {/* REQUEST 2 */}

                  <RequestCard
                    type="non-emergency"
                    title="Car Breakdown"
                    location="Kondapur, Hyderabad"
                    distance="4.1 km away"
                    description="Car not starting. Need mechanic assistance."
                    payment="₹450"
                    priority="Normal Priority"
                    time="12 min ago"
                  />

                </div>

              </section>

              {/* SAFETY BANNER */}

              <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 sm:flex-row sm:items-center">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <ShieldCheck size={25} />
                  </div>

                  <div>

                    <h4 className="font-bold text-[#10275a]">
                      Stay Safe While Helping
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Your safety is our priority. Please follow all
                      safety guidelines while providing help.
                    </p>

                  </div>

                </div>

                <button className="rounded-lg border border-blue-400 bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50">
                  View Safety Guidelines
                </button>

              </div>

            </div>

            {/* RIGHT SIDE */}

            <div className="space-y-5">

              {/* AVAILABILITY STATUS */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  Availability Status
                </h3>

                <div className="mt-4 rounded-xl border border-green-200 bg-green-50/50 p-5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CircleCheck size={25} />
                    </div>

                    <div>

                      <p className="font-bold text-green-700">
                        You are Online
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        You will receive new help requests
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={() => setAvailable(false)}
                    className="mt-5 w-full rounded-lg border border-green-300 bg-white py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    Go Offline
                  </button>

                </div>

              </section>

              {/* TODAY'S SUMMARY */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  Today&apos;s Summary
                </h3>

                <div className="mt-4 divide-y">

                  <SummaryRow
                    label="Earnings Today"
                    value="₹1,250"
                    icon={<Wallet size={17} />}
                  />

                  <SummaryRow
                    label="Jobs Completed"
                    value="3"
                    icon={<CheckCircle size={17} />}
                  />

                  <SummaryRow
                    label="Distance Travelled"
                    value="28 km"
                    icon={<TrendingUp size={17} />}
                  />

                  <SummaryRow
                    label="Rating"
                    value="4.8 ⭐"
                    icon={<span className="text-yellow-500">★</span>}
                  />

                </div>

              </section>

              {/* UPCOMING TASKS */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  Upcoming Tasks
                </h3>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">

                  <div className="flex items-start justify-between">

                    <div className="flex gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <ClipboardList size={19} />
                      </div>

                      <div>

                        <p className="text-sm font-bold">
                          Blood Delivery
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Today, 11:30 AM
                        </p>

                        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={13} />
                          Ameerpet, Hyderabad
                        </p>

                      </div>

                    </div>

                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                      Upcoming
                    </span>

                  </div>

                </div>

              </section>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`mb-1 flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
        isActive
          ? "bg-blue-600 text-white shadow-lg"
          : "text-blue-50 hover:bg-white/10"
      }`}
    >

      <span className="flex items-center gap-4">
        {icon}
        {label}
      </span>

      {badge && (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}

    </Link>
  );
}

function StatCard({
  icon,
  value,
  title,
  subtitle,
  type,
}: {
  icon: React.ReactNode;
  value: string;
  title: string;
  subtitle: string;
  type: "blue" | "green" | "purple" | "orange";
}) {

  const styles = {
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
    },

    green: {
      bg: "bg-green-50",
      icon: "bg-green-100 text-green-600",
    },

    purple: {
      bg: "bg-purple-50",
      icon: "bg-purple-100 text-purple-600",
    },

    orange: {
      bg: "bg-orange-50",
      icon: "bg-orange-100 text-orange-600",
    },
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-3xl font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-1 font-bold text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>

        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${styles[type].icon}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

function RequestCard({
  type,
  title,
  location,
  distance,
  description,
  payment,
  priority,
  time,
}: {
  type: "emergency" | "non-emergency";
  title: string;
  location: string;
  distance: string;
  description: string;
  payment: string;
  priority: string;
  time: string;
}) {

  const emergency = type === "emergency";

  return (
    <div className="rounded-xl border p-4 transition hover:shadow-md">

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* REQUEST INFO */}

        <div className="flex gap-4">

          {/* ICON */}

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              emergency
                ? "bg-red-100 text-red-600"
                : "bg-orange-100 text-orange-600"
            }`}
          >

            {emergency ? (
              <Ambulance size={24} />
            ) : (
              <Car size={24} />
            )}

          </div>

          <div>

            {/* TYPE */}

            <span
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                emergency
                  ? "bg-red-50 text-red-600"
                  : "bg-orange-50 text-orange-600"
              }`}
            >
              {emergency
                ? "Emergency"
                : "Non-Emergency"}
            </span>

            {/* TITLE */}

            <h4 className="mt-2 text-base font-bold text-slate-800">
              {title}
            </h4>

            {/* LOCATION */}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">

              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {location}
              </span>

              <span className="hidden text-blue-500 sm:block">
                ●
              </span>

              <span>
                {distance}
              </span>

            </div>

            {/* DESCRIPTION */}

            <p className="mt-2 max-w-[550px] text-xs text-slate-500">
              {description}
            </p>

            {/* PRIORITY + TIME */}

            <div className="mt-4 flex flex-wrap gap-3">

              <span
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${
                  emergency
                    ? "bg-red-50 text-red-600"
                    : "bg-orange-50 text-orange-600"
                }`}
              >
                {priority}
              </span>

              <span className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-[11px] text-slate-500">
                <Clock size={13} />
                {time}
              </span>

            </div>

          </div>

        </div>

        {/* PAYMENT + ACTIONS */}

        <div className="flex flex-col gap-4 lg:min-w-[205px]">

          {/* PAYMENT */}

          <div className="rounded-xl bg-green-50 p-4">

            <p className="text-xs text-slate-500">
              Estimated Payment
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {payment}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Fixed Amount
            </p>

          </div>

          {/* BUTTONS */}

          <div className="flex gap-2">

            <Link
              href="/provider/request/1"
              className="flex flex-1 items-center justify-center rounded-lg border border-blue-500 px-3 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50"
            >
              View Details
            </Link>

            <button className="flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
              Accept
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

function SummaryRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {

  return (
    <div className="flex items-center justify-between py-3">

      <div className="flex items-center gap-3">

        <div className="text-blue-600">
          {icon}
        </div>

        <span className="text-sm text-slate-600">
          {label}
        </span>

      </div>

      <span className="text-sm font-bold text-green-600">
        {value}
      </span>

    </div>
  );
}

export default ProviderDashboardWorkflow;
