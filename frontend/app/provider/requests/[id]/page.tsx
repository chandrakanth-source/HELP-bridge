"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { ProviderRequestWorkflow } from "../../../../components/ProviderWorkflow";

function LegacyRequestDetailsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const request = {
    id: "SOS-2026-0128",
    type: "Emergency",
    title: "Blood Required",
    status: "Verified",
    urgency: "High",
    posted: "5 min ago",

    seeker: {
      name: "Rahul Kumar",
      phone: "+91 98765 43210",
      bloodGroup: "O+",
      age: 28,
      gender: "Male",
    },

    location: "Ameerpet, Hyderabad",
    address:
      "Ameerpet, Hyderabad, Telangana 500016, India",

    required: "O+ Blood",

    description:
      "Patient is in need of O+ blood urgently. Please help as soon as possible.",

    notes: "Hospital: Apollo Hospitals, Ameerpet",

    category: "Emergency - Blood",

    distance: "1.8 km",
    estimatedTime: "6 min",

    baseAmount: 650,
    helpbridgeFee: 50,
    totalPayment: 700,
  };

  const handleAccept = () => {
    setAccepted(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

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
            active
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

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

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

        {/* ================================================= */}
        {/* PAGE CONTENT */}
        {/* ================================================= */}

        <div className="p-5 sm:p-8">

          {/* BACK */}

          <Link
            href="/provider/available-requests"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Back to Available Requests
          </Link>

          {/* TITLE */}

          <div className="mt-5">

            <h2 className="text-3xl font-bold text-[#10275a]">
              Request Details
            </h2>

            <p className="mt-2 text-slate-500">
              View request information and accept to start helping.
            </p>

          </div>

          {/* ================================================= */}
          {/* MAIN GRID */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_390px]">

            {/* ================================================= */}
            {/* LEFT */}
            {/* ================================================= */}

            <div className="space-y-5">

              {/* REQUEST HEADER */}

              <section className="rounded-xl border bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                  {/* ICON */}

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <Droplets size={32} />
                  </div>

                  <div className="flex-1">

                    <span className="rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase text-red-600">
                      Emergency
                    </span>

                    <h3 className="mt-2 text-2xl font-bold text-slate-800">
                      {request.title}
                    </h3>

                  </div>

                </div>

                {/* REQUEST META */}

                <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-4">

                  <Meta
                    label="Request ID"
                    value={`#${request.id}`}
                    blue
                  />

                  <Meta
                    label="Status"
                    value={request.status}
                    green
                  />

                  <Meta
                    label="Urgency"
                    value={request.urgency}
                    red
                  />

                  <Meta
                    label="Posted"
                    value={request.posted}
                  />

                </div>

              </section>

              {/* ================================================= */}
              {/* SEEKER INFORMATION */}
              {/* ================================================= */}

              <section className="rounded-xl border bg-white p-6 shadow-sm">

                <SectionTitle
                  icon={<User size={18} />}
                  title="Help Seeker Information"
                />

                <div className="mt-5 divide-y">

                  <InfoRow
                    icon={<User size={17} />}
                    label="Name"
                    value={request.seeker.name}
                  />

                  <InfoRow
                    icon={<Phone size={17} />}
                    label="Phone"
                    value={request.seeker.phone}
                    action={
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50">
                        <Phone size={14} />
                      </button>
                    }
                  />

                  <InfoRow
                    icon={<Droplets size={17} />}
                    label="Blood Group"
                    value={request.seeker.bloodGroup}
                  />

                  <InfoRow
                    icon={<User size={17} />}
                    label="Age"
                    value={`${request.seeker.age} Years`}
                  />

                  <InfoRow
                    icon={<User size={17} />}
                    label="Gender"
                    value={request.seeker.gender}
                  />

                </div>

              </section>

              {/* ================================================= */}
              {/* REQUEST INFORMATION */}
              {/* ================================================= */}

              <section className="rounded-xl border bg-white p-6 shadow-sm">

                <SectionTitle
                  icon={<ClipboardList size={18} />}
                  title="Request Information"
                />

                <div className="mt-5 divide-y">

                  <InfoRow
                    icon={<MapPin size={17} />}
                    label="Location"
                    value={request.location}
                  />

                  <InfoRow
                    icon={<Droplets size={17} />}
                    label="Required"
                    value={request.required}
                  />

                  <InfoRow
                    icon={<AlertTriangle size={17} />}
                    label="Description"
                    value={request.description}
                  />

                  <InfoRow
                    icon={<ClipboardList size={17} />}
                    label="Additional Notes"
                    value={request.notes}
                  />

                  <InfoRow
                    icon={<Clock size={17} />}
                    label="Posted Time"
                    value="14 Aug 2026, 10:30 AM"
                  />

                  <InfoRow
                    icon={<HeartHandshake size={17} />}
                    label="Category"
                    value={request.category}
                  />

                </div>

              </section>

              {/* SAFETY WARNING */}

              <section className="rounded-xl border border-red-200 bg-red-50 p-5">

                <div className="flex gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <ShieldCheck size={23} />
                  </div>

                  <div>

                    <h4 className="font-bold text-red-700">
                      Please ensure your safety first!
                    </h4>

                    <p className="mt-1 text-xs text-red-600">
                      Only accept requests if you are in a safe
                      condition to help.
                    </p>

                  </div>

                </div>

              </section>

            </div>

            {/* ================================================= */}
            {/* RIGHT */}
            {/* ================================================= */}

            <div className="space-y-5">

              {/* REQUEST OVERVIEW */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  Request Overview
                </h3>

                <div className="mt-4 divide-y">

                  <OverviewRow
                    label="Type"
                    value="Blood Requirement"
                    red
                  />

                  <OverviewRow
                    label="Urgency"
                    value="High Priority"
                    red
                  />

                  <OverviewRow
                    label="Distance"
                    value={request.distance}
                    blue
                  />

                  <OverviewRow
                    label="Estimated Payment"
                    value={`₹${request.totalPayment}`}
                    green
                  />

                </div>

                {/* MANAGER VERIFIED */}

                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">

                  <div className="flex gap-3">

                    <CheckCircle2
                      size={22}
                      className="shrink-0 text-green-600"
                    />

                    <div>

                      <p className="text-sm font-bold text-green-700">
                        Manager Verified
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        This request has been verified by
                        the manager and is available for providers.
                      </p>

                    </div>

                  </div>

                </div>

              </section>

              {/* ================================================= */}
              {/* MAP */}
              {/* ================================================= */}

              <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

                <div className="p-5">

                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#10275a]">

                    <MapPin
                      size={19}
                      className="text-blue-600"
                    />

                    Location Map

                  </h3>

                </div>

                {/* MAP PLACEHOLDER */}

                <div className="relative mx-4 mb-4 h-[270px] overflow-hidden rounded-xl bg-[#e8f0e8]">

                  {/* Grid */}

                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "linear-gradient(#b8cbb8 1px, transparent 1px), linear-gradient(90deg, #b8cbb8 1px, transparent 1px)",
                      backgroundSize: "35px 35px",
                    }}
                  />

                  {/* Road */}

                  <div className="absolute left-[18%] top-[20%] h-[4px] w-[70%] rotate-[25deg] rounded-full bg-white" />

                  <div className="absolute left-[20%] top-[50%] h-[4px] w-[70%] -rotate-[20deg] rounded-full bg-white" />

                  <div className="absolute left-[45%] top-[15%] h-[80%] w-[4px] rotate-[20deg] rounded-full bg-white" />

                  {/* Route */}

                  <div className="absolute left-[25%] top-[25%] h-[160px] w-[170px] rotate-[25deg] rounded-full border-[5px] border-blue-500 border-r-transparent border-b-transparent" />

                  {/* Requester */}

                  <div className="absolute left-[23%] top-[18%]">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-lg">

                      <MapPin size={20} />

                    </div>

                    <span className="absolute left-8 top-1 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-bold shadow">
                      Requester Location
                    </span>

                  </div>

                  {/* Provider */}

                  <div className="absolute bottom-[18%] right-[25%]">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg">

                      <Navigation size={15} />

                    </div>

                    <span className="absolute right-8 top-1 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-bold shadow">
                      Your Location
                    </span>

                  </div>

                  {/* Distance */}

                  <div className="absolute left-[52%] top-[47%] rounded-lg bg-white px-3 py-2 text-center shadow-md">

                    <p className="text-sm font-bold text-slate-800">
                      {request.distance}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      {request.estimatedTime}
                    </p>

                  </div>

                </div>

              </section>

              {/* ADDRESS */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="flex items-center gap-2 text-lg font-bold text-[#10275a]">

                  <User
                    size={18}
                    className="text-blue-600"
                  />

                  Help Seeker Address

                </h3>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {request.address}
                </p>

                <button className="mt-4 flex items-center gap-2 rounded-lg border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">

                  <MapPin size={16} />

                  Open in Maps

                </button>

              </section>

              {/* ================================================= */}
              {/* PAYMENT */}
              {/* ================================================= */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  Trip & Payment Details
                </h3>

                <div className="mt-4 divide-y">

                  <PaymentRow
                    label="Estimated Distance"
                    value={request.distance}
                  />

                  <PaymentRow
                    label="Estimated Time"
                    value={request.estimatedTime}
                  />

                  <PaymentRow
                    label="Base Amount"
                    value={`₹${request.baseAmount}`}
                  />

                  <PaymentRow
                    label="HelpBridge Fee (10%)"
                    value={`₹${request.helpbridgeFee}`}
                  />

                  <div className="flex items-center justify-between pt-4">

                    <span className="font-bold text-slate-800">
                      You Will Receive
                    </span>

                    <span className="text-xl font-bold text-green-600">
                      ₹{request.totalPayment}
                    </span>

                  </div>

                </div>

              </section>

              {/* ================================================= */}
              {/* ACCEPT */}
              {/* ================================================= */}

              <section className="rounded-xl border bg-white p-5 shadow-sm">

                <h3 className="text-lg font-bold text-[#10275a]">
                  {accepted
                    ? "Request Accepted"
                    : "Accept This Request"}
                </h3>

                <p className="mt-3 text-xs leading-5 text-slate-500">

                  {accepted
                    ? "You have accepted this request. You can now contact the help seeker and start providing assistance."
                    : "By accepting, you agree to help the requester and follow our safety guidelines."}

                </p>

                {!accepted ? (

                  <button
                    onClick={handleAccept}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
                  >

                    <HeartHandshake size={19} />

                    Accept Help Request

                  </button>

                ) : (

                  <Link
                    href="/provider/active-help"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-green-700"
                  >

                    <CheckCircle2 size={19} />

                    Go to Active Help

                  </Link>

                )}

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

function Meta({
  label,
  value,
  blue,
  green,
  red,
}: {
  label: string;
  value: string;
  blue?: boolean;
  green?: boolean;
  red?: boolean;
}) {

  return (
    <div>

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-bold ${
          blue
            ? "text-blue-600"
            : green
            ? "text-green-600"
            : red
            ? "text-red-600"
            : "text-slate-700"
        }`}
      >
        {green ? (
          <span className="rounded-md bg-green-50 px-2 py-1 text-xs">
            {value}
          </span>
        ) : red ? (
          <span className="rounded-md bg-red-50 px-2 py-1 text-xs">
            {value}
          </span>
        ) : (
          value
        )}
      </p>

    </div>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {

  return (
    <h3 className="flex items-center gap-2 text-lg font-bold text-[#10275a]">

      <span className="text-blue-600">
        {icon}
      </span>

      {title}

    </h3>
  );
}

function InfoRow({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {

  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[170px_1fr_auto] sm:items-center">

      <div className="flex items-center gap-2 text-xs text-slate-500">

        <span className="text-slate-400">
          {icon}
        </span>

        {label}

      </div>

      <p className="text-sm font-semibold text-slate-700">
        {value}
      </p>

      {action}

    </div>
  );
}

function OverviewRow({
  label,
  value,
  red,
  green,
  blue,
}: {
  label: string;
  value: string;
  red?: boolean;
  green?: boolean;
  blue?: boolean;
}) {

  return (
    <div className="flex items-center justify-between py-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-bold ${
          red
            ? "text-red-600"
            : green
            ? "text-green-600"
            : blue
            ? "text-blue-600"
            : "text-slate-700"
        }`}
      >
        {value}
      </span>

    </div>
  );
}

function PaymentRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="flex items-center justify-between py-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-700">
        {value}
      </span>

    </div>
  );
}

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return <ProviderRequestWorkflow requestId={id} />;
}
