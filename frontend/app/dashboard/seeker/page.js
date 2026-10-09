"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  ClipboardList,
  CreditCard,
  DollarSign,
  Headphones,
  History,
  Home,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  Settings,
  Siren,
  ShieldCheck,
  User,
  Wrench,
  X,
} from "lucide-react";
import { apiRequest } from "../../../lib/api";
import { formatRelativeTime } from "../../../lib/datetime";
import BargainModal from "../../../components/BargainModal";

const statusLabels = {
  pending_verification: "Pending verification",
  approved: "Approved",
  rejected: "Rejected",
  assigned: "Assigned",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  bargaining: "Negotiating price",
};

const requestTypeLabels = {
  emergency: "Emergency",
  non_emergency: "Non-emergency",
};

const statusClassMap = {
  pending_verification: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-cyan-50 text-cyan-700 border-cyan-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-200 text-slate-700 border-slate-300",
  bargaining: "bg-amber-50 text-amber-800 border-amber-300",
};

export default function SeekerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bargainRequestId, setBargainRequestId] = useState(null);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login first.");
          setLoading(false);
          return;
        }

        const data = await apiRequest("/help-requests/my", {}, token);
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch (loadError) {
        console.error(loadError);
        setError(
          loadError.message || "Unable to load your requests right now.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const stats = useMemo(() => {
    const active = requests.filter((request) =>
      [
        "pending_verification",
        "approved",
        "assigned",
        "accepted",
        "in_progress",
      ].includes(request.status),
    ).length;
    const emergency = requests.filter(
      (request) => request.request_type === "emergency",
    ).length;
    const completed = requests.filter(
      (request) => request.status === "completed",
    ).length;

    return {
      total: requests.length,
      active,
      emergency,
      completed,
    };
  }, [requests]);

  const hasCompletedRequest = requests.some(
    (request) => request.status === "completed",
  );

  const activeAssignedRequests = requests.filter((r) =>
    ["assigned", "accepted", "in_progress"].includes(r.status),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-800">
            Unable to access dashboard
          </p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex items-center justify-between border-b bg-white px-5 py-4 lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-slate-700">
          <Menu size={25} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck size={21} />
          </div>
          <span className="text-lg font-bold text-blue-600">HelpBridge</span>
        </div>
        <Link href="/user/notifications" className="relative text-slate-600">
          <Bell size={22} />
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {requests.length > 0 ? 1 : 0}
          </span>
        </Link>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 transform border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
          <SidebarItem
            href="/dashboard/seeker"
            icon={<Home size={20} />}
            text="Dashboard"
            active
          />
          <SidebarItem
            href="/user/emergency"
            icon={<Siren size={20} />}
            text="Emergency SOS"
            emergency
          />
          <SidebarItem
            href="/user/non-emergency"
            icon={<Wrench size={20} />}
            text="Non-Emergency Help"
          />
          <SidebarItem
            href="/requests"
            icon={<ClipboardList size={20} />}
            text="My Requests"
          />
          <SidebarItem
            href="/user/history"
            icon={<History size={20} />}
            text="Request History"
          />
          <SidebarItem
            href="/user/active-requests"
            icon={<Activity size={20} />}
            text="Active Requests"
          />
          <SidebarItem
            href="/user/messages"
            icon={<MessageSquare size={20} />}
            text="Messages"
          />
          <SidebarItem
            href="/user/payments"
            icon={<CreditCard size={20} />}
            text="Payments"
          />
          <SidebarItem
            href="/user/notifications"
            icon={<Bell size={20} />}
            text="Notifications"
            badge={requests.length > 0 ? "1" : undefined}
          />
          <SidebarItem
            href="/user/profile"
            icon={<User size={20} />}
            text="Profile"
          />
          <SidebarItem
            href="/user/settings"
            icon={<Settings size={20} />}
            text="Settings"
          />
          <SidebarItem
            href="/provider/dashboard"
            icon={<BriefcaseBusiness size={20} />}
            text="Provider Workspace"
          />
        </nav>

        <div className="absolute bottom-0 w-full border-t p-3">
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
          >
            <LogOut size={20} />
            Logout
          </Link>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="hidden h-20 items-center justify-between border-b bg-white px-8 lg:flex">
          <div />
          <div className="flex items-center gap-6">
            <Link
              href="/user/notifications"
              className="relative text-slate-600"
            >
              <Bell size={23} />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {requests.length > 0 ? 1 : 0}
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                S
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Seeker</p>
                <p className="text-xs text-slate-500">User account</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome back, Seeker!
              </h1>
              <p className="mt-2 text-slate-500">
                Track your requests and get help when you need it most.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl border bg-white px-4 py-3 shadow-sm">
              <MapPin size={19} className="text-blue-600" />
              <span className="text-sm font-medium text-slate-700">
                Hyderabad, Telangana
              </span>
            </div>
          </div>
          {/* Dual-Role Provider Banner */}
          <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <BriefcaseBusiness size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">
                    Dual-Role Member: Provider Workspace
                  </h3>
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
                    Active
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-blue-100">
                  You can both seek help and provide help! Browse requests in
                  your neighborhood, accept emergency alerts, and earn.
                </p>
              </div>
            </div>
            <Link
              href="/provider/dashboard"
              className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow hover:bg-blue-50 transition"
            >
              Open Provider Workspace →
            </Link>
          </div>

          {/* Active assignment alerts */}
          {activeAssignedRequests.length > 0 && (
            <div className="mb-6 space-y-3">
              {activeAssignedRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-bold text-emerald-800">
                        {r.status === "in_progress"
                          ? "🟢 Provider is helping you now"
                          : r.status === "accepted"
                          ? "🔵 Provider is on the way!"
                          : "🟡 Provider has been assigned"}
                      </p>
                      <p className="text-xs text-emerald-700">{r.title}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/requests/${r.id}/chat`}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <MessageSquare size={13} /> Chat
                    </Link>
                    <Link
                      href="/user/notifications"
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      <Bell size={13} /> View Notifications
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <ActionCard
              title="Emergency SOS"
              description="Request urgent support for critical incidents"
              href="/user/emergency"
              accent="red"
              icon={<Siren size={30} />}
            />
            <ActionCard
              title="Non-Emergency Help"
              description="Request assistance for regular support and services"
              href="/user/non-emergency"
              accent="blue"
              icon={<Wrench size={30} />}
            />
          </div>

          <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total requests"
              value={String(stats.total)}
              detail="All submissions"
              color="blue"
            />
            <StatCard
              label="Active"
              value={String(stats.active)}
              detail="Currently tracking"
              color="amber"
            />
            <StatCard
              label="Emergency"
              value={String(stats.emergency)}
              detail="Urgent support"
              color="red"
            />
            <StatCard
              label="Completed"
              value={String(stats.completed)}
              detail="Resolved requests"
              color="green"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <section className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    My help requests
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest updates on your support requests
                  </p>
                </div>
                <Link
                  href="/requests"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>

              <div className="divide-y">
                {requests.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <ClipboardList size={28} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-800">
                      No requests yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Your requests will appear here after you submit one.
                    </p>
                    <Link
                      href="/user/non-emergency"
                      className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Create a request
                    </Link>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div key={request.id} className="px-6 py-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-800">
                              {request.title || "Help request"}
                            </h3>
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                              {requestTypeLabels[request.request_type] ||
                                request.request_type}
                            </span>
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                            {request.description || "No description added yet."}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            {request.address ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={13} className="text-blue-500" />
                                {request.address}
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={13} className="text-slate-400" />
                              {request.created_at
                                ? formatRelativeTime(request.created_at)
                                : "Just now"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              statusClassMap[request.status] ||
                              "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {statusLabels[request.status] || request.status}
                          </span>

                          <div className="flex items-center gap-2">
                            {request.status === "completed" ? (
                              <Link
                                href={`/payment?requestId=${request.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                              >
                                <CreditCard size={15} />
                                Pay for Help
                              </Link>
                            ) : null}
                            {request.request_type === "non_emergency" &&
                             ["approved", "bargaining"].includes(request.status) ? (
                              <button
                                type="button"
                                onClick={() => setBargainRequestId(request.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-400 shadow-sm transition"
                              >
                                <DollarSign size={15} />
                                Negotiate
                                {request.status === "bargaining" && (
                                  <span className="ml-0.5 h-2 w-2 rounded-full bg-white animate-pulse" />
                                )}
                              </button>
                            ) : null}
                            {(request.status === "assigned" ||
                            request.status === "accepted" ||
                            request.status === "in_progress") ? (
                              <Link
                                href="/user/notifications"
                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                <Bell size={15} />
                                Notifications
                              </Link>
                            ) : null}
                            <Link
                              href={`/requests/${request.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-800"
                            >
                              Details
                              <ChevronRight size={16} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                {hasCompletedRequest ? (
                  <Link
                    href={`/payment?requestId=${requests.find((request) => request.status === "completed")?.id ?? ""}`}
                    className="inline-flex items-center rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                  >
                    Pay
                  </Link>
                ) : null}
                <h3 className="text-lg font-bold text-slate-900">
                  Quick actions
                </h3>
                <div className="mt-5 space-y-3">
                  <QuickAction
                    href="/user/emergency"
                    icon={<Siren size={18} />}
                    title="Send SOS"
                    color="red"
                  />
                  <QuickAction
                    href="/user/non-emergency"
                    icon={<Wrench size={18} />}
                    title="Request help"
                    color="blue"
                  />
                  <QuickAction
                    href="/requests"
                    icon={<ClipboardList size={18} />}
                    title="Review requests"
                    color="green"
                  />
                  <QuickAction
                    href="/user/notifications"
                    icon={<Bell size={18} />}
                    title="View alerts"
                    color="purple"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Headphones size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Need support?</h3>
                    <p className="text-sm text-slate-600">
                      Reach our team anytime
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@helpbridge.com"}`}
                  className="mt-5 inline-block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Contact support
                </a>
              </div>
            </aside>
          </div>
        </div>
      </main>
      {bargainRequestId !== null && (
        <BargainModal
          requestId={bargainRequestId}
          isOpen={true}
          onClose={() => setBargainRequestId(null)}
          onAgreed={() => setBargainRequestId(null)}
        />
      )}
    </div>
  );
}

function SidebarItem({
  href,
  icon,
  text,
  active = false,
  emergency = false,
  badge,
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-600"
          : emergency
            ? "text-slate-700 hover:bg-red-50 hover:text-red-600"
            : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={
            emergency && !active
              ? "text-red-500"
              : active
                ? "text-blue-600"
                : "text-slate-500"
          }
        >
          {icon}
        </span>
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

function StatCard({ label, value, detail, color }) {
  const colors = {
    blue: { bg: "bg-blue-50", number: "text-blue-600" },
    amber: { bg: "bg-amber-50", number: "text-amber-600" },
    red: { bg: "bg-red-50", number: "text-red-600" },
    green: { bg: "bg-emerald-50", number: "text-emerald-600" },
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className={`mt-3 text-3xl font-bold ${colors[color].number}`}>
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${colors[color].bg}`}
        >
          <Activity size={22} className={colors[color].number} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">{detail}</p>
        <ChevronRight size={16} className="text-slate-400" />
      </div>
    </div>
  );
}

function ActionCard({ title, description, href, accent, icon }) {
  const styles = {
    red: "border-red-100 bg-gradient-to-br from-red-50 to-white",
    blue: "border-blue-100 bg-gradient-to-br from-blue-50 to-white",
  };

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${styles[accent]}`}>
      <div className="flex items-start gap-5">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
            accent === "red"
              ? "bg-red-500 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {icon}
        </div>
        <div>
          <h2
            className={`text-xl font-bold ${accent === "red" ? "text-red-600" : "text-blue-600"}`}
          >
            {title}
          </h2>
          <p className="mt-2 max-w-md text-slate-600">{description}</p>
        </div>
      </div>

      <Link
        href={href}
        className={`mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white transition ${
          accent === "red"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {title}
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function QuickAction({ href, icon, title, color }) {
  const styles = {
    red: "border-red-100 bg-red-50 text-red-600 hover:bg-red-100",
    blue: "border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "border-green-100 bg-green-50 text-green-600 hover:bg-green-100",
    purple:
      "border-purple-100 bg-purple-50 text-purple-600 hover:bg-purple-100",
  };

  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm font-semibold transition ${styles[color]}`}
    >
      <span className="flex items-center gap-3">
        {icon}
        {title}
      </span>
      <ChevronRight size={16} />
    </Link>
  );
}

