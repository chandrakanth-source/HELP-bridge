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
  ArrowLeft,
  MapPin,
  Phone,
  Droplets,
  Clock,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  MessageCircle,
  Send,
  Play,
  Pause,
  Route,
  Car,
} from "lucide-react";
import { ProviderActiveWorkflow } from "../../../components/ProviderWorkflow";

function LegacyActiveHelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [helpStatus, setHelpStatus] = useState<
    "On The Way" | "Helping" | "Completed"
  >("On The Way");

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "Rahul Kumar",
      text: "Thank you so much for accepting my request. 🙏",
      time: "10:36 AM",
      own: false,
    },
    {
      sender: "You",
      text: "I am on my way. Will reach soon.",
      time: "10:36 AM",
      own: true,
    },
    {
      sender: "Rahul Kumar",
      text: "Okay, thank you! I am waiting at the hospital.",
      time: "10:37 AM",
      own: false,
    },
  ]);

  const activeHelp = {
    id: "SOS-2026-0128",
    type: "Emergency",
    category: "Blood Requirement",
    title: "Blood Required",

    seeker: {
      name: "Rahul Kumar",
      phone: "+91 98765 43210",
      bloodGroup: "O+",
      hospital: "Aster Prime Hospital, Ameerpet",
    },

    location: "Aster Prime Hospital, Ameerpet",

    distance: "1.8 km",
    eta: "6 min",

    acceptedAt: "10:35 AM, 14 Aug 2026",

    baseAmount: 700,
    helpbridgeFee: 70,
    receiveAmount: 630,
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      {
        sender: "You",
        text: message,
        time: "Now",
        own: true,
      },
    ]);

    setMessage("");
  };

  const startHelping = () => {
    setHelpStatus("Helping");
  };

  const completeHelp = () => {
    setHelpStatus("Completed");
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[245px] bg-[#06295f] text-white transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
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

          <SidebarItem
            href="/provider/dashboard"
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
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
            active
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

      {/* =====================================================
          MAIN
      ===================================================== */}

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

            <button className="relative text-slate-600">

              <Bell size={23} />

              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                5
              </span>

            </button>

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

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="p-5 sm:p-8">

          {/* BACK BUTTON */}

          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

          {/* TITLE */}

          <div className="mt-5">

            <h2 className="text-3xl font-bold text-[#10275a]">
              My Active Help
            </h2>

            <p className="mt-2 text-slate-500">
              Track, communicate and complete the help you have accepted.
            </p>

          </div>

          {/* =====================================================
              REQUEST HEADER
          ===================================================== */}

          <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-6 xl:flex-row xl:items-center">

              {/* REQUEST TYPE */}

              <div className="flex flex-1 items-center gap-5">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">

                  <Droplets size={32} />

                </div>

                <div>

                  <span className="rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase text-red-600">
                    Emergency
                  </span>

                  <h3 className="mt-2 text-2xl font-bold text-slate-800">
                    {activeHelp.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Request ID:{" "}
                    <span className="font-semibold text-blue-600">
                      #{activeHelp.id}
                    </span>
                  </p>

                </div>

              </div>

              {/* DETAILS */}

              <div className="grid gap-5 sm:grid-cols-3 xl:min-w-[550px]">

                <div>

                  <p className="text-xs text-slate-400">
                    Accepted At
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {activeHelp.acceptedAt}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-slate-400">
                    Help Seeker
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {activeHelp.seeker.name}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-slate-400">
                    Phone
                  </p>

                  <p className="mt-2 text-sm font-bold text-blue-600">
                    {activeHelp.seeker.phone}
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* =====================================================
              GRID
          ===================================================== */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">

            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <div className="space-y-6">

              {/* LIVE MAP */}

              <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

                <div className="flex items-center justify-between p-5">

                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#10275a]">

                    <MapPin
                      size={19}
                      className="text-blue-600"
                    />

                    Live Location & Route

                  </h3>

                  <div className="flex items-center gap-2 text-xs font-semibold text-green-600">

                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />

                    Live Tracking

                  </div>

                </div>

                {/* MAP */}

                <div className="relative mx-5 mb-5 h-[330px] overflow-hidden rounded-xl bg-[#e7efe8]">

                  {/* MAP GRID */}

                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      backgroundImage:
                        "linear-gradient(#b7c9b7 1px, transparent 1px), linear-gradient(90deg, #b7c9b7 1px, transparent 1px)",
                      backgroundSize: "35px 35px",
                    }}
                  />

                  {/* ROADS */}

                  <div className="absolute left-[5%] top-[35%] h-[5px] w-[90%] rotate-[12deg] rounded-full bg-white" />

                  <div className="absolute left-[10%] top-[65%] h-[5px] w-[85%] -rotate-[16deg] rounded-full bg-white" />

                  <div className="absolute left-[50%] top-[5%] h-[90%] w-[5px] rotate-[20deg] rounded-full bg-white" />

                  <div className="absolute left-[20%] top-[10%] h-[80%] w-[4px] -rotate-[35deg] rounded-full bg-white" />

                  {/* ROUTE */}

                  <div className="absolute left-[22%] top-[35%] h-[135px] w-[270px] rotate-[8deg] rounded-full border-[5px] border-blue-500 border-r-transparent border-b-transparent" />

                  {/* PROVIDER */}

                  <div className="absolute bottom-[25%] left-[20%]">

                    <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg">

                      <Navigation size={20} />

                    </div>

                    <div className="absolute left-8 top-1 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-bold shadow-md">

                      You (Provider)

                      <span className="block text-[10px] font-normal text-slate-500">
                        1.8 km away
                      </span>

                    </div>

                  </div>

                  {/* SEEKER */}

                  <div className="absolute right-[20%] top-[28%]">

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow-lg">

                      <MapPin size={22} />

                    </div>

                    <div className="absolute right-8 top-1 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-bold shadow-md">

                      Help Seeker Location

                      <span className="block text-[10px] font-normal text-slate-500">
                        Aster Prime Hospital
                      </span>

                    </div>

                  </div>

                  {/* DISTANCE */}

                  <div className="absolute left-[52%] top-[46%] rounded-xl bg-white px-4 py-3 text-center shadow-lg">

                    <p className="text-lg font-bold text-slate-800">
                      {activeHelp.distance}
                    </p>

                    <p className="text-xs text-slate-500">
                      {activeHelp.eta} ETA
                    </p>

                  </div>

                </div>

                {/* MAP INFO */}

                <div className="grid gap-4 border-t px-5 py-5 sm:grid-cols-3">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Route size={18} />
                    </div>

                    <div>

                      <p className="text-xs text-slate-400">
                        Distance
                      </p>

                      <p className="font-bold text-slate-700">
                        {activeHelp.distance}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <Clock size={18} />
                    </div>

                    <div>

                      <p className="text-xs text-slate-400">
                        ETA
                      </p>

                      <p className="font-bold text-slate-700">
                        {activeHelp.eta}
                      </p>

                    </div>

                  </div>

                  <button className="flex items-center justify-center gap-2 rounded-lg border border-blue-300 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50">

                    <Navigation size={17} />

                    Navigate

                  </button>

                </div>

              </section>

              {/* COMMUNICATION */}

              <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

                <div className="border-b p-5">

                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#10275a]">

                    <MessageCircle
                      size={19}
                      className="text-blue-600"
                    />

                    Communication

                  </h3>

                </div>

                <div className="h-[330px] overflow-y-auto p-5">

                  <div className="space-y-4">

                    {messages.map((msg, index) => (

                      <div
                        key={index}
                        className={`flex ${
                          msg.own
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-3 ${
                            msg.own
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >

                          <p className="text-sm">
                            {msg.text}
                          </p>

                          <p
                            className={`mt-1 text-[10px] ${
                              msg.own
                                ? "text-blue-100"
                                : "text-slate-400"
                            }`}
                          >
                            {msg.time}
                          </p>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

                {/* MESSAGE INPUT */}

                <div className="border-t p-4">

                  <div className="flex gap-3">

                    <input
                      type="text"
                      value={message}
                      onChange={(e) =>
                        setMessage(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      onClick={sendMessage}
                      className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >

                      <Send size={18} />

                    </button>

                  </div>

                </div>

              </section>

            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="space-y-6">

              {/* STATUS */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <h3 className="text-lg font-bold text-[#10275a]">
                    Request Status
                  </h3>

                  <StatusBadge status={helpStatus} />

                </div>

                <div className="mt-6">

                  <div className="relative">

                    {/* LINE */}

                    <div className="absolute left-[12%] right-[12%] top-5 h-1 bg-slate-200" />

                    {/* PROGRESS */}

                    <div
                      className={`absolute left-[12%] top-5 h-1 bg-blue-600 transition-all ${
                        helpStatus === "On The Way"
                          ? "w-[25%]"
                          : helpStatus === "Helping"
                          ? "w-[58%]"
                          : "w-[76%]"
                      }`}
                    />

                    <div className="relative flex justify-between">

                      <ProgressStep
                        active
                        label="Accepted"
                        time="10:35 AM"
                      />

                      <ProgressStep
                        active={
                          helpStatus === "On The Way" ||
                          helpStatus === "Helping" ||
                          helpStatus === "Completed"
                        }
                        label="On The Way"
                        time="10:40 AM"
                      />

                      <ProgressStep
                        active={
                          helpStatus === "Helping" ||
                          helpStatus === "Completed"
                        }
                        label="Helping"
                        time={
                          helpStatus === "Helping" ||
                          helpStatus === "Completed"
                            ? "Now"
                            : "--"
                        }
                      />

                      <ProgressStep
                        active={helpStatus === "Completed"}
                        label="Completed"
                        time={
                          helpStatus === "Completed"
                            ? "Done"
                            : "--"
                        }
                      />

                    </div>

                  </div>

                </div>

              </section>

              {/* SEEKER DETAILS */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  Help Seeker Details
                </h3>

                <div className="mt-5 flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                    RK
                  </div>

                  <div>

                    <p className="font-bold text-slate-800">
                      {activeHelp.seeker.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      🩸 Blood Group:{" "}
                      <span className="font-bold">
                        {activeHelp.seeker.bloodGroup}
                      </span>
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">

                      <MapPin size={12} />

                      {activeHelp.seeker.hospital}

                    </p>

                  </div>

                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <button className="flex items-center justify-center gap-2 rounded-lg border border-blue-300 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50">

                    <Phone size={16} />

                    Call

                  </button>

                  <button className="flex items-center justify-center gap-2 rounded-lg border border-blue-300 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50">

                    <MessageCircle size={16} />

                    Chat

                  </button>

                </div>

              </section>

              {/* ACTIONS */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  Actions
                </h3>

                <div className="mt-4 space-y-3">

                  {/* START HELP */}

                  {helpStatus === "On The Way" && (

                    <button
                      onClick={startHelping}
                      className="flex w-full items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-left hover:bg-green-100"
                    >

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white">

                        <Play size={17} />

                      </div>

                      <div>

                        <p className="text-sm font-bold text-green-700">
                          Start Help
                        </p>

                        <p className="text-[10px] text-slate-500">
                          I have reached the location
                        </p>

                      </div>

                    </button>

                  )}

                  {/* REQUEST ASSISTANCE */}

                  <button className="flex w-full items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-left hover:bg-yellow-100">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500 text-white">

                      <Pause size={17} />

                    </div>

                    <div>

                      <p className="text-sm font-bold text-yellow-700">
                        Request Assistance
                      </p>

                      <p className="text-[10px] text-slate-500">
                        Need additional support
                      </p>

                    </div>

                  </button>

                  {/* COMPLETE */}

                  {helpStatus === "Helping" && (

                    <button
                      onClick={completeHelp}
                      className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-left hover:bg-red-100"
                    >

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white">

                        <CheckCircle2 size={17} />

                      </div>

                      <div>

                        <p className="text-sm font-bold text-red-700">
                          Mark Help as Completed
                        </p>

                        <p className="text-[10px] text-slate-500">
                          Help provided successfully
                        </p>

                      </div>

                    </button>

                  )}

                  {helpStatus === "Completed" && (

                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">

                      <div className="flex items-center gap-3">

                        <CheckCircle2
                          size={24}
                          className="text-green-600"
                        />

                        <div>

                          <p className="font-bold text-green-700">
                            Help Completed
                          </p>

                          <p className="text-xs text-slate-500">
                            Thank you for helping!
                          </p>

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              </section>

              {/* PAYMENT */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  Payment Information
                </h3>

                <div className="mt-5 grid grid-cols-3 divide-x">

                  <div className="pr-3">

                    <p className="text-[10px] text-slate-400">
                      Estimated Amount
                    </p>

                    <p className="mt-2 text-lg font-bold text-green-600">
                      ₹{activeHelp.baseAmount}
                    </p>

                  </div>

                  <div className="px-3">

                    <p className="text-[10px] text-slate-400">
                      HelpBridge Fee
                    </p>

                    <p className="mt-2 text-lg font-bold text-slate-700">
                      ₹{activeHelp.helpbridgeFee}
                    </p>

                  </div>

                  <div className="pl-3">

                    <p className="text-[10px] text-slate-400">
                      You Receive
                    </p>

                    <p className="mt-2 text-lg font-bold text-green-600">
                      ₹{activeHelp.receiveAmount}
                    </p>

                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between border-t pt-4">

                  <span className="text-xs text-slate-500">
                    Payment Status
                  </span>

                  <span className="rounded-md bg-yellow-50 px-3 py-1 text-[10px] font-bold text-yellow-700">
                    PENDING
                  </span>

                </div>

                <p className="mt-3 text-[10px] text-slate-400">
                  Payment will be released after the help is successfully completed.
                </p>

              </section>

              {/* EMERGENCY */}

              <section className="rounded-xl border border-red-200 bg-red-50 p-5">

                <div className="flex gap-3">

                  <AlertTriangle
                    size={22}
                    className="shrink-0 text-red-600"
                  />

                  <div>

                    <h4 className="font-bold text-red-700">
                      Emergency Assistance
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-red-600">
                      If the situation becomes dangerous, request
                      additional assistance immediately.
                    </p>

                  </div>

                </div>

                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700">

                  <AlertTriangle size={17} />

                  Request Emergency Support

                </button>

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
  active?: boolean;
  badge?: string;
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
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold">
          {badge}
        </span>
      )}

    </Link>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {

  const styles = {
    "On The Way":
      "bg-blue-50 text-blue-600",
    Helping:
      "bg-green-50 text-green-600",
    Completed:
      "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase ${
        styles[status as keyof typeof styles]
      }`}
    >
      {status}
    </span>
  );
}

function ProgressStep({
  active,
  label,
  time,
}: {
  active: boolean;
  label: string;
  time: string;
}) {

  return (
    <div className="relative z-10 flex w-1/4 flex-col items-center">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow ${
          active
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-400"
        }`}
      >

        {active ? (
          <CheckCircle2 size={17} />
        ) : (
          <Clock size={16} />
        )}

      </div>

      <p
        className={`mt-2 text-center text-[10px] font-bold ${
          active
            ? "text-slate-700"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-[9px] text-slate-400">
        {time}
      </p>

    </div>
  );
}

export default ProviderActiveWorkflow;
