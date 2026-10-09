"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

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
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Droplets,
  Car,
  Ambulance,
  Bike,
  UserRound,
  Phone,
} from "lucide-react";
import { ProviderAvailableWorkflow } from "../../../components/ProviderWorkflow";

type RequestType = "Emergency" | "Non-Emergency";

type Request = {
  id: string;
  type: RequestType;
  title: string;
  location: string;
  distance: number;
  requester: string;
  phone: string;
  requirement: string;
  payment: number;
  priority: "High Priority" | "Normal Priority";
  time: string;
  icon: "blood" | "car" | "medical" | "bike";
};

const requests: Request[] = [
  {
    id: "SOS-2026-0128",
    type: "Emergency",
    title: "Blood Required",
    location: "Ameerpet, Hyderabad",
    distance: 1.8,
    requester: "Rahul Kumar",
    phone: "+91 98765 43210",
    requirement: "O+ Blood",
    payment: 700,
    priority: "High Priority",
    time: "5 min ago",
    icon: "blood",
  },
  {
    id: "REG-2026-0092",
    type: "Non-Emergency",
    title: "Car Breakdown",
    location: "Kondapur, Hyderabad",
    distance: 3.2,
    requester: "Vikram Singh",
    phone: "+91 91234 56789",
    requirement: "Hyundai i20",
    payment: 500,
    priority: "Normal Priority",
    time: "12 min ago",
    icon: "car",
  },
  {
    id: "SOS-2026-0132",
    type: "Emergency",
    title: "Medical Emergency",
    location: "Jubilee Hills, Hyderabad",
    distance: 2.6,
    requester: "Neha Reddy",
    phone: "+91 99876 54321",
    requirement: "Elderly - High Fever",
    payment: 900,
    priority: "High Priority",
    time: "15 min ago",
    icon: "medical",
  },
  {
    id: "REG-2026-0095",
    type: "Non-Emergency",
    title: "Bike Towing",
    location: "Miyapur, Hyderabad",
    distance: 4.5,
    requester: "Suresh Babu",
    phone: "+91 95555 66777",
    requirement: "Bajaj Pulsar 150",
    payment: 350,
    priority: "Normal Priority",
    time: "18 min ago",
    icon: "bike",
  },
];

function LegacyAvailableRequestsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<
    "All" | "Emergency" | "Non-Emergency"
  >("All");

  const [sortBy, setSortBy] = useState<
    "default" | "nearest" | "payment"
  >("default");

  const [acceptedId, setAcceptedId] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    let result = [...requests];

    if (search.trim()) {
      const value = search.toLowerCase();

      result = result.filter(
        (request) =>
          request.title.toLowerCase().includes(value) ||
          request.location.toLowerCase().includes(value) ||
          request.requester.toLowerCase().includes(value) ||
          request.id.toLowerCase().includes(value)
      );
    }

    if (typeFilter !== "All") {
      result = result.filter(
        (request) => request.type === typeFilter
      );
    }

    if (sortBy === "nearest") {
      result.sort((a, b) => a.distance - b.distance);
    }

    if (sortBy === "payment") {
      result.sort((a, b) => b.payment - a.payment);
    }

    return result;
  }, [search, typeFilter, sortBy]);

  const handleAccept = (id: string) => {
    setAcceptedId(id);
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
              <ShieldIcon />
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
        {/* CONTENT */}
        {/* ================================================= */}

        <div className="p-5 sm:p-8">

          {/* PAGE TITLE */}

          <div>

            <h2 className="text-3xl font-bold text-[#10275a]">
              Available Help Requests
            </h2>

            <p className="mt-2 text-slate-500">
              Browse and accept help requests that are
              nearby and match your service.
            </p>

          </div>

          {/* ================================================= */}
          {/* FILTER BAR */}
          {/* ================================================= */}

          <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">

            <div className="flex flex-col gap-3 xl:flex-row">

              {/* SEARCH */}

              <div className="relative flex-1">

                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search requests..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* ALL */}

              <FilterButton
                active={typeFilter === "All"}
                onClick={() => setTypeFilter("All")}
              >
                All
              </FilterButton>

              {/* EMERGENCY */}

              <FilterButton
                active={typeFilter === "Emergency"}
                onClick={() => setTypeFilter("Emergency")}
                icon={
                  <AlertTriangle
                    size={15}
                    className="text-red-500"
                  />
                }
              >
                Emergency
              </FilterButton>

              {/* NON EMERGENCY */}

              <FilterButton
                active={typeFilter === "Non-Emergency"}
                onClick={() =>
                  setTypeFilter("Non-Emergency")
                }
                icon={
                  <AlertTriangle
                    size={15}
                    className="text-orange-500"
                  />
                }
              >
                Non-Emergency
              </FilterButton>

              {/* NEAREST */}

              <button
                onClick={() => setSortBy("nearest")}
                className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                  sortBy === "nearest"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >

                <MapPin size={16} />

                Nearest

                <ChevronDown size={15} />

              </button>

              {/* PAYMENT */}

              <button
                onClick={() => setSortBy("payment")}
                className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                  sortBy === "payment"
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >

                <Wallet size={16} />

                Highest Payment

                <ChevronDown size={15} />

              </button>

              {/* RESET */}

              <button
                onClick={() => {
                  setSearch("");
                  setTypeFilter("All");
                  setSortBy("default");
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >

                <SlidersHorizontal size={16} />

                Filter

              </button>

            </div>

          </div>

          {/* ================================================= */}
          {/* RESULT COUNT */}
          {/* ================================================= */}

          <div className="mt-5 flex items-center justify-between">

            <p className="text-sm text-slate-500">

              Showing{" "}

              <span className="font-bold text-slate-700">
                {filteredRequests.length}
              </span>{" "}

              of 24 requests

            </p>

          </div>

          {/* ================================================= */}
          {/* REQUEST LIST */}
          {/* ================================================= */}

          <div className="mt-3 space-y-4">

            {filteredRequests.length === 0 ? (

              <div className="rounded-xl border bg-white py-16 text-center shadow-sm">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                  <Search size={25} />

                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-700">
                  No requests found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or filters.
                </p>

              </div>

            ) : (

              filteredRequests.map((request) => (

                <RequestCard
                  key={request.id}
                  request={request}
                  accepted={
                    acceptedId === request.id
                  }
                  onAccept={() =>
                    handleAccept(request.id)
                  }
                />

              ))

            )}

          </div>

          {/* ================================================= */}
          {/* PAGINATION */}
          {/* ================================================= */}

          <div className="mt-6 flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Showing 1 to {filteredRequests.length} of 24 requests
            </p>

            <div className="flex items-center gap-2">

              <button className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-slate-500 hover:bg-slate-50">
                <ChevronLeft size={18} />
              </button>

              <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                1
              </button>

              <button className="hidden h-10 w-10 items-center justify-center rounded-lg border bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:flex">
                2
              </button>

              <button className="hidden h-10 w-10 items-center justify-center rounded-lg border bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:flex">
                3
              </button>

              <span className="px-1 text-slate-400">
                ...
              </span>

              <button className="hidden h-10 w-10 items-center justify-center rounded-lg border bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:flex">
                6
              </button>

              <button className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-slate-500 hover:bg-slate-50">
                <ChevronRight size={18} />
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

function RequestCard({
  request,
  accepted,
  onAccept,
}: {
  request: Request;
  accepted: boolean;
  onAccept: () => void;
}) {

  const isEmergency = request.type === "Emergency";

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md">

      <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr_250px] xl:items-center">

        {/* ================================================= */}
        {/* LEFT */}
        {/* ================================================= */}

        <div className="flex gap-4">

          {/* ICON */}

          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
              request.icon === "blood"
                ? "bg-red-50 text-red-500"
                : request.icon === "medical"
                ? "bg-red-50 text-red-500"
                : "bg-orange-50 text-orange-500"
            }`}
          >
            <RequestIcon type={request.icon} />
          </div>

          <div className="min-w-0">

            {/* TYPE */}

            <span
              className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                isEmergency
                  ? "bg-red-50 text-red-600"
                  : "bg-orange-50 text-orange-600"
              }`}
            >
              {request.type}
            </span>

            {/* TITLE */}

            <h3 className="mt-2 text-lg font-bold text-slate-800">
              {request.title}
            </h3>

            {/* REQUEST ID */}

            <p className="mt-1 text-xs text-slate-500">

              Request ID:{" "}

              <span className="font-semibold text-blue-600">
                #{request.id}
              </span>

            </p>

            {/* LOCATION */}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">

              <span className="flex items-center gap-1.5">

                <MapPin
                  size={14}
                  className="text-slate-500"
                />

                {request.location}

              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

              <span>
                {request.distance} km away
              </span>

            </div>

            {/* REQUIREMENT */}

            <p className="mt-2 text-xs text-slate-600">

              {request.type === "Emergency"
                ? "Required: "
                : "Vehicle: "}

              <span className="font-semibold">
                {request.requirement}
              </span>

            </p>

            {/* PRIORITY + TIME */}

            <div className="mt-3 flex flex-wrap gap-3">

              <span
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-bold ${
                  isEmergency
                    ? "bg-red-50 text-red-600"
                    : "bg-orange-50 text-orange-600"
                }`}
              >

                <AlertTriangle size={12} />

                {request.priority}

              </span>

              <span className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[10px] text-slate-500">

                <Clock size={12} />

                Posted {request.time}

              </span>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* REQUESTER */}
        {/* ================================================= */}

        <div className="border-t pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">

          <p className="text-[11px] font-semibold text-slate-400">
            REQUESTER
          </p>

          <div className="mt-3 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <UserRound size={17} />
            </div>

            <div>

              <p className="text-sm font-bold text-slate-700">
                {request.requester}
              </p>

              <p className="text-xs text-slate-500">
                Requester
              </p>

            </div>

          </div>

          <div className="mt-3 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Phone size={16} />
            </div>

            <div>

              <p className="text-[11px] text-slate-400">
                Phone
              </p>

              <p className="text-xs font-semibold text-slate-600">
                {request.phone}
              </p>

            </div>

          </div>

          <div className="mt-3 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              {request.icon === "blood" ? (
                <Droplets size={16} />
              ) : (
                <Car size={16} />
              )}
            </div>

            <div>

              <p className="text-[11px] text-slate-400">
                {request.type === "Emergency"
                  ? "Blood Group"
                  : "Vehicle"}
              </p>

              <p className="text-xs font-semibold text-slate-600">
                {request.requirement}
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* PAYMENT + BUTTONS */}
        {/* ================================================= */}

        <div className="border-t pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">

          <div className="rounded-xl bg-green-50 p-4">

            <p className="text-[11px] text-slate-500">
              Estimated Payment
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              ₹{request.payment}
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              Fixed Amount
            </p>

          </div>

          <div className="mt-3 flex gap-2">

            <Link
              href={`/provider/request/${request.id}`}
              className="flex flex-1 items-center justify-center rounded-lg border border-blue-500 px-3 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50"
            >
              View Details
            </Link>

            <button
              onClick={onAccept}
              disabled={accepted}
              className={`flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-xs font-bold text-white transition ${
                accepted
                  ? "cursor-not-allowed bg-green-500"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {accepted ? "Accepted ✓" : "Accept"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-600"
          : "border-slate-200 text-slate-600 hover:bg-slate-50"
      }`}
    >

      {icon}

      {children}

    </button>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
}) {

  return (
    <Link
      href={href}
      className={`mb-1 flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
        active
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

function RequestIcon({
  type,
}: {
  type: Request["icon"];
}) {

  if (type === "blood") {
    return <Droplets size={27} />;
  }

  if (type === "car") {
    return <Car size={27} />;
  }

  if (type === "medical") {
    return <Ambulance size={27} />;
  }

  return <Bike size={27} />;
}

function ShieldIcon() {

  return (
    <div className="relative">

      <div className="h-7 w-6 rounded-b-xl rounded-t-md border-[3px] border-blue-700" />

      <div className="absolute left-[7px] top-[6px] h-2 w-2 rounded-full bg-blue-700" />

    </div>
  );
}

export default ProviderAvailableWorkflow;
