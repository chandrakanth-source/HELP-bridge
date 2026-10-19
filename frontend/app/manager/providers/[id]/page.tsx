"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "../../../../lib/api";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  LoaderCircle,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  FileText,
} from "lucide-react";

type Provider = {
  id: number;
  name: string;
  email: string;
  phone: string;
  occupation: string | null;
  address: string | null;
  availability_status: string;
  verification_status: "pending" | "verified" | "rejected" | string;
  document_url?: string | null;
  created_at: string;
};

export default function ProviderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const data = await apiRequest(
          `/manager/providers/${encodeURIComponent(id)}`,
          {},
          localStorage.getItem("token")
        );
        setProvider(data.provider);
      } catch (providerError) {
        setError(
          providerError instanceof Error
            ? providerError.message
            : "Unable to load provider."
        );
      }
    };
    if (id) void loadProvider();
  }, [id]);

  const handleUpdateStatus = async (status: "verified" | "rejected" | "pending") => {
    if (!provider) return;
    setIsUpdating(true);
    setError("");
    setSuccessMessage("");
    try {
      const data = await apiRequest(
        `/manager/providers/${provider.id}/verification`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        localStorage.getItem("token")
      );
      setProvider(data.provider || { ...provider, verification_status: status });
      setSuccessMessage(
        status === "verified"
          ? "Provider has been successfully verified!"
          : status === "rejected"
          ? "Provider verification has been marked as rejected."
          : "Provider status reset to pending."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update verification status."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (error && !provider) {
    return (
      <DetailShell>
        <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </p>
      </DetailShell>
    );
  }

  if (!provider) {
    return (
      <DetailShell>
        <div className="flex items-center gap-2 text-slate-500">
          <LoaderCircle className="animate-spin" size={18} /> Loading provider...
        </div>
      </DetailShell>
    );
  }

  const isVerified = provider.verification_status === "verified";
  const isRejected = provider.verification_status === "rejected";
  const isPending = !isVerified && !isRejected;

  return (
    <DetailShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/manager/providers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} /> Back to providers
        </Link>

        {/* Action toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {isPending && (
            <>
              <button
                onClick={() => handleUpdateStatus("verified")}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Approve & Verify
              </button>
              <button
                onClick={() => handleUpdateStatus("rejected")}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle size={16} />
                Reject
              </button>
            </>
          )}

          {isVerified && (
            <button
              onClick={() => handleUpdateStatus("rejected")}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle size={16} />
              Revoke Verification
            </button>
          )}

          {isRejected && (
            <button
              onClick={() => handleUpdateStatus("verified")}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {isUpdating ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Re-approve & Verify
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      {/* Header Profile Info */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700">
            {provider.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[#12234b]">{provider.name}</h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  isVerified
                    ? "bg-green-100 text-green-700"
                    : isRejected
                    ? "bg-red-100 text-red-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {isVerified ? "Verified" : isRejected ? "Rejected" : "Pending Verification"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Provider #{provider.id} · {provider.occupation || "General Assistance"}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <InfoCard title="Contact information">
          <Detail label="Phone" value={provider.phone} icon={<Phone size={16} />} />
          <Detail label="Email" value={provider.email} />
          <Detail
            label="Address"
            value={provider.address || "Address unavailable"}
            icon={<MapPin size={16} />}
          />
        </InfoCard>

        <InfoCard title="Account status & verification">
          <Detail
            label="Verification status"
            value={provider.verification_status}
            icon={
              isVerified ? (
                <ShieldCheck size={16} className="text-emerald-600" />
              ) : isRejected ? (
                <ShieldAlert size={16} className="text-red-600" />
              ) : (
                <Clock size={16} className="text-purple-600" />
              )
            }
          />
          <Detail
            label="Availability"
            value={provider.availability_status}
            icon={<CheckCircle size={16} />}
          />
          <Detail
            label="Joined"
            value={new Date(provider.created_at).toLocaleDateString()}
            icon={<Clock size={16} />}
          />
        </InfoCard>
      </div>

      {/* Verification Document Card */}
      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#12234b]">Verification Document</h2>
            <p className="text-xs text-slate-500">Government ID, license, or credentials submitted during registration</p>
          </div>
          <FileText className="text-slate-400" size={24} />
        </div>

        <div className="mt-5">
          {provider.document_url ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {provider.document_url.endsWith(".pdf") ? "Verification Document (PDF)" : "Verification Document (Image)"}
                  </p>
                  <p className="text-xs text-slate-500">Uploaded for identity / trade verification</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={provider.document_url.startsWith("http") ? provider.document_url : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"}${provider.document_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  View Document
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-slate-400">
              No verification document was attached during registration.
            </p>
          )}
        </div>
      </div>
    </DetailShell>
  );
}

function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#12234b]">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-sm capitalize text-slate-700">
        {icon}
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}
