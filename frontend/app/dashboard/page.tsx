"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === "manager") {
          router.replace("/manager/dashboard");
          return;
        }
        if (user.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
        if (user.role === "provider") {
          router.replace("/provider/dashboard");
          return;
        }
        router.replace("/user/dashboard");
        return;
      }
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Redirecting to your Dashboard...</h1>
        <p className="mt-3 text-slate-600">Please wait while we route you based on your role.</p>
      </div>
    </main>
  );
}
