"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function NotificationsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>Loading...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: "var(--background)" }}>
        <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--text-muted)" }}>notifications</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Sign in to see notifications</h2>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>Stay updated with replies, mentions, and more</p>
        <Link href="/login" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto flex flex-col items-center" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-3xl flex flex-col min-h-full">
        <header
          className="sticky top-0 z-10 backdrop-blur-md px-8 py-6 flex items-center justify-between"
          style={{ background: "color-mix(in srgb, var(--background) 95%, transparent)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Notifications</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Updates from your network</p>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <span className="material-symbols-outlined text-6xl" style={{ color: "var(--text-muted)" }}>notifications_none</span>
          <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>No notifications yet</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>You're all caught up!</p>
        </div>
      </div>
    </main>
  );
}
