"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import {
    Activity,
    BarChart3,
    Bell,
    CheckCircle,
    ChevronDown,
    ClipboardCheck,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    ShieldCheck,
    Siren,
    User,
    Users,
    Wrench,
    X,
    Headphones,
} from "lucide-react";

const NAV_ITEMS = [
    { href: "/manager/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/manager/emergency_requests", icon: Siren, label: "Emergency Requests" },
    { href: "/manager/non-emergency-requests", icon: Wrench, label: "Non-Emergency Help" },
    { href: "/manager/pending-verification", icon: ClipboardCheck, label: "Pending Verification" },
    { href: "/manager/active-requests", icon: Activity, label: "Active Requests" },
    { href: "/manager/completed-requests", icon: CheckCircle, label: "Completed Requests" },
    { href: "/manager/providers", icon: Users, label: "Providers" },
    { href: "/manager/notifications", icon: Bell, label: "Notifications" },
    { href: "/manager/reports", icon: BarChart3, label: "Reports & Analytics" },
    { href: "/manager/profile", icon: User, label: "Profile" },
    { href: "/manager/settings", icon: Settings, label: "Settings" },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState<{ total_count: number; pending_count: number; active_count: number; unread_notifications: number } | null>(null);
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        apiRequest("/manager/dashboard/stats", {}, token)
            .then(setStats)
            .catch(() => setStats(null));
    }, []);

    return (
        <div className="min-h-screen bg-[#f7f9fc]">
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col bg-[#082b63] text-white transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0`}
            >
                <div className="flex h-[90px] items-center border-b border-white/10 px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0b63e5]">
                            <ShieldCheck size={27} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">HelpBridge</h1>
                            <p className="text-xs text-blue-200">Manager Panel</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto lg:hidden"
                        aria-label="Close navigation"
                    >
                        <X size={22} />
                    </button>
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                    {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                        const active = pathname === href || pathname.startsWith(href + "/");
                        const badge = href === "/manager/emergency_requests" ? stats?.total_count :
                            href === "/manager/pending-verification" ? stats?.pending_count :
                                href === "/manager/active-requests" ? stats?.active_count :
                                    href === "/manager/notifications" ? stats?.unread_notifications : undefined;
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setSidebarOpen(false)}
                                className={`mb-1 flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${active
                                        ? "bg-[#1769e8] text-white"
                                        : "text-blue-50 hover:bg-white/10"
                                    }`}
                            >
                                <span className="flex items-center gap-4">
                                    <Icon size={20} />
                                    {label}
                                </span>
                                {badge !== undefined && badge > 0 && (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white text-blue-600" : "bg-red-500 text-white"}`}>
                                        {badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mx-4 mb-4 shrink-0 rounded-xl bg-white/10 p-4 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                        <Headphones size={22} />
                    </div>
                    <p className="mt-3 font-semibold">Need Help?</p>
                    <p className="mt-1 text-xs text-blue-200">Contact support anytime</p>
                    <button className="mt-3 w-full rounded-lg bg-[#1769e8] py-2 text-sm font-semibold hover:bg-[#0d5ed7]">
                        Contact Support
                    </button>
                </div>
            </aside>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main */}
            <main className="lg:ml-[260px]">
                <header className="flex h-[90px] items-center justify-between border-b bg-white px-5 sm:px-8">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-slate-600 lg:hidden"
                        aria-label="Open navigation"
                    >
                        <Menu size={25} />
                    </button>
                    <div className="ml-auto flex items-center gap-5">
                        <button className="relative text-slate-600" aria-label="Notifications">
                            <Bell size={23} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                M
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-bold text-slate-800">Manager</p>
                                <p className="text-xs text-slate-500">HelpBridge Manager</p>
                            </div>
                            <ChevronDown size={18} className="text-slate-500" />
                        </div>
                        <Link
                            href="/login"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                            <LogOut size={17} />
                            <span className="hidden sm:inline">Logout</span>
                        </Link>
                    </div>
                </header>

                <div className="p-5 sm:p-8">{children}</div>
            </main>
        </div>
    );
}

