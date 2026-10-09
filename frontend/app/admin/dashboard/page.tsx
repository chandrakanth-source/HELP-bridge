"use client";
import { useState } from "react";
import Link from "next/link";
import {ShieldCheck,Users,UserCheck,UserX,Clock,CheckCircle,XCircle,LogOut,Search,MapPin,Mail,Phone,Briefcase,Menu,X,} from "lucide-react";
import { useEffect } from "react";
import { apiRequest } from "../../../lib/api";
type ApplicationStatus = "Pending" | "Approved" | "Rejected";
type ManagerApplication = {id: number;name: string;email: string;phone: string;occupation: string;department: string;designation: string;location: string;status: ApplicationStatus;};
type ViewFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminDashboard() {
  const [applications, setApplications] =useState<ManagerApplication[]>([]);
  const [selectedApplication, setSelectedApplication] =useState<ManagerApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ViewFilter>("all");
  const [error, setError] = useState("");
  const loadApplications = async () => {
    try {
      const data = await apiRequest("/admin/managers", {}, localStorage.getItem("token"));
      setApplications(data.managers.map((manager: { id: number; name: string; email: string; phone: string; occupation: string; address: string; verification_status: string }) => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        occupation: manager.occupation || "Manager applicant",
        department: "HelpBridge",
        designation: "Manager applicant",
        location: manager.address || "Not provided",
        status: manager.verification_status === "verified" ? "Approved" : manager.verification_status === "rejected" ? "Rejected" : "Pending",
      })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load manager applications.");
    }
  };
  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadApplications();
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, []);
  const updateApplication = async (id: number, status: "verified" | "rejected") => {
    try {
      await apiRequest(`/admin/managers/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, localStorage.getItem("token"));
      setApplications((current) => current.map((application) => application.id === id ? { ...application, status: status === "verified" ? "Approved" : "Rejected" } : application));
      setSelectedApplication(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update application.");
    }
  };
  const approveApplication = (id: number) => { void updateApplication(id, "verified"); };
  const rejectApplication = (id: number) => { void updateApplication(id, "rejected"); };
  const pendingCount = applications.filter((application) => application.status === "Pending").length;
  const approvedCount = applications.filter((application) => application.status === "Approved").length;
  const rejectedCount = applications.filter((application) => application.status === "Rejected").length;

  const filteredApplications = applications.filter((application) => {
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "pending" && application.status === "Pending") ||
      (selectedFilter === "approved" && application.status === "Approved") ||
      (selectedFilter === "rejected" && application.status === "Rejected");

    const matchesSearch = `${application.name} ${application.email} ${application.location}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex items-center justify-between bg-white px-5 py-4 shadow-sm lg:hidden">
        <button onClick={() => setSidebarOpen(true)}className="text-slate-700">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="font-bold text-emerald-700">HelpBridge</span>
        </div>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 text-white transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h1 className="font-bold">HelpBridge</h1>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            <NavItem icon={<ShieldCheck size={19} />} text="Dashboard" active={selectedFilter === "all"} onClick={() => setSelectedFilter("all")} />
            <NavItem icon={<Users size={19} />} text="Users" active={selectedFilter === "all"} onClick={() => setSelectedFilter("all")} />
            <NavItem icon={<Clock size={19} />} text="Manager Applications" active={selectedFilter === "pending"} badge={pendingCount} onClick={() => setSelectedFilter("pending")} />
            <NavItem icon={<CheckCircle size={19} />} text="Approved Managers" active={selectedFilter === "approved"} onClick={() => setSelectedFilter("approved")} />
            <NavItem icon={<XCircle size={19} />} text="Rejected Applications" active={selectedFilter === "rejected"} onClick={() => setSelectedFilter("rejected")} />
          </nav>

          <div className="border-t border-slate-700 p-4">
            <Link href="/login" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
              <LogOut size={19} />Logout
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:ml-64">
        <div className="p-5 sm:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-600"> Administrator Panel </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">  Dashboard</h1>
              <p className="mt-1 text-slate-500"> Manage users and verify manager applications.</p>
            </div>
            <div className="rounded-xl bg-white px-5 py-3 shadow-sm">
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="font-semibold text-slate-800">Administrator</p>
            </div>
          </div>
          {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Applications" value={applications.length} icon={<Users size={22} />}/>
            <StatCard title="Pending" value={pendingCount} icon={<Clock size={22} />}/>
            <StatCard title="Approved" value={approvedCount} icon={<UserCheck size={22} />}/>
            <StatCard title="Rejected" value={rejectedCount} icon={<UserX size={22} />}/>
          </div>
          <div className="mt-8 rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900"> Manager Applications </h2>
                  <p className="mt-1 text-sm text-slate-500">Review and verify manager registration requests.</p>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchTerm} onChange={(event) =>setSearchTerm(event.target.value)}placeholder="Search applications..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 md:w-64"/>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredApplications.map((application) => (
                <div key={application.id} className="p-5 transition hover:bg-slate-50 sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                        {application.name.split(" ") .map((name) => name[0]).join("") .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{application.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{application.designation}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail size={13} />{application.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} />{application.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="text-xs text-slate-400"> Department </p>
                      <p className="mt-1 font-semibold text-slate-700"> {application.department}</p>
                    </div>
                    <StatusBadge status={application.status} />
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedApplication(application)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">View</button>
                      {application.status === "Pending" && ( <>
                          <button onClick={() => approveApplication(application.id)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"> Approve</button>
                          <button onClick={() => rejectApplication(application.id)}className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"> Reject</button></>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredApplications.length === 0 && (
                <div className="p-12 text-center">
                  <Users size={40} className="mx-auto text-slate-300"/>
                  <p className="mt-4 font-semibold text-slate-700"> No applications found</p>
                  <p className="mt-1 text-sm text-slate-500">Try changing your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedApplication && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manager Application</h2>
                <p className="mt-1 text-sm text-slate-500">Review applicant information</p>
              </div>
              <button onClick={() => setSelectedApplication(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
                  {selectedApplication.name.split(" ").map((name) => name[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedApplication.name}</h3>
                  <StatusBadge status={selectedApplication.status} />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <DetailItem icon={<Mail size={17} />} label="Email" value={selectedApplication.email}/>
                <DetailItem icon={<Phone size={17} />}label="Phone" value={selectedApplication.phone} />
                <DetailItem icon={<Briefcase size={17} />}label="Occupation" value={selectedApplication.occupation}/>
                <DetailItem icon={<Briefcase size={17} />} label="Designation" value={selectedApplication.designation}/>
                <DetailItem  icon={<Users size={17} />} label="Department" value={selectedApplication.department}/>
                <DetailItem icon={<MapPin size={17} />} label="Location" value={selectedApplication.location}/>
              </div>
              {selectedApplication.status === "Pending" && (
                <div className="flex gap-3 border-t border-slate-100 pt-6">
                  <button onClick={() => approveApplication(selectedApplication.id)} className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"> ✓ Approve Application </button>
                  <button onClick={() => rejectApplication(selectedApplication.id) }className="flex-1 rounded-xl bg-red-500 py-3 font-bold text-white hover:bg-red-600"> ✕ Reject Application</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
function StatCard({title,value,icon,}: {title: string;value: number;icon: React.ReactNode;}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">{icon}</div>
      </div>
    </div>
  );
}
function NavItem({icon,text,active = false,badge,onClick}: {icon: React.ReactNode;text: string;active?: boolean;badge?: number;onClick?: () => void;}){
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition ${
        active? "bg-emerald-600 text-white": "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
      <span className="flex items-center gap-3">{icon}{text}</span>
      {badge !== undefined && badge > 0 && (<span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>)}
    </button>
  );
}
function StatusBadge({status,}: {status: ApplicationStatus;}) {
  if (status === "Approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle size={14} />Approved
      </span>
    );
  }
  if (status === "Rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
        <XCircle size={14} />Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
      <Clock size={14} />Pending
    </span>
  );
}

function DetailItem({icon,label,value,}: {icon: React.ReactNode;label: string;value: string;}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">{icon}{label}</div>
      <p className="mt-2 break-words font-semibold text-slate-700">{value}</p>
    </div>
  );
}
