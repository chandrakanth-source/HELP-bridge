"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export default function SeekerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.id) {
          router.replace(`/user/${user.id}/dashboard`);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    router.replace("/user/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm flex items-center gap-3">
        <LoaderCircle size={22} className="animate-spin text-blue-600" />
        <span className="font-semibold text-sm">Redirecting to your dashboard...</span>
      </div>
    </div>
  );
}
