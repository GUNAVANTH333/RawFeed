"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center gap-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--color-primary)" }}>
          admin_panel_settings
        </span>
        <nav className="flex gap-1">
          <a href="/admin/reports"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}>
            Reports
          </a>
          <a href="/admin/users"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}>
            Users
          </a>
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
