"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeProvider";
import Link from "next/link";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [desktopNotifs, setDesktopNotifs] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(false);

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
        <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--text-muted)" }}>settings</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Sign in to access settings</h2>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>Control your preferences</p>
        <Link href="/login" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Sign In
        </Link>
      </main>
    );
  }

  function handleThemeSelect(selected: "dark" | "light") {
    if ((selected === "dark" && theme !== "dark") || (selected === "light" && theme !== "light")) {
      toggleTheme();
    }
  }

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
      <div className="p-8 lg:p-12 max-w-4xl">
        <header className="mb-10">
          <h2 className="text-4xl font-black tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Settings</h2>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>Control your application preferences.</p>
        </header>

        {/* ══════════ ACCOUNT ══════════ */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">account_circle</span>
            <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Account</h3>
          </div>
          <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
            {/* Email */}
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Email Address</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</p>
              </div>
            </div>
            {/* Password */}
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Password</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Last updated 4 months ago</p>
              </div>
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ background: "var(--surface-hover)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                Change
              </button>
            </div>
          </div>
        </section>

        {/* ══════════ APPLICATION ══════════ */}
        <section className="mb-12 pb-20">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined" style={{ color: "var(--text-muted)" }}>phone_iphone</span>
            <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Application</h3>
          </div>
          <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
            {/* Theme Selection */}
            <div className="p-6" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <p className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Theme Selection</p>
              <div className="grid grid-cols-2 gap-4">
                {/* Dark */}
                <button
                  onClick={() => handleThemeSelect("dark")}
                  className="p-4 rounded-lg text-left relative overflow-hidden transition-all"
                  style={{
                    border: theme === "dark" ? "2px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                    background: "var(--surface-hover)",
                    opacity: theme === "dark" ? 1 : 0.6,
                  }}
                >
                  {theme === "dark" && (
                    <div className="absolute top-2 right-2 text-primary">
                      <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                    </div>
                  )}
                  <div className="w-full h-12 rounded mb-3 flex flex-col gap-1 p-2" style={{ background: "#0F172A", border: "1px solid #334155" }}>
                    <div className="h-1 w-2/3 rounded" style={{ background: "#334155" }} />
                    <div className="h-1 w-full rounded" style={{ background: "#1E293B" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme === "dark" ? "var(--color-primary)" : "var(--text-muted)" }}>Dark</p>
                </button>

                {/* Light */}
                <button
                  onClick={() => handleThemeSelect("light")}
                  className="p-4 rounded-lg text-left relative overflow-hidden transition-all"
                  style={{
                    border: theme === "light" ? "2px solid var(--color-primary)" : "1px solid var(--border-subtle)",
                    background: theme === "light" ? "var(--surface)" : "#FFFFFF",
                    opacity: theme === "light" ? 1 : 0.6,
                  }}
                >
                  {theme === "light" && (
                    <div className="absolute top-2 right-2 text-primary">
                      <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                    </div>
                  )}
                  <div className="w-full h-12 rounded mb-3 flex flex-col gap-1 p-2" style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}>
                    <div className="h-1 w-2/3 rounded" style={{ background: "#CBD5E1" }} />
                    <div className="h-1 w-full rounded" style={{ background: "#E2E8F0" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme === "light" ? "var(--color-primary)" : "#64748B" }}>Light</p>
                </button>
              </div>
            </div>

            {/* Desktop Notifications */}
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Desktop Notifications</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Get real-time alerts for activity in your threads.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={desktopNotifs}
                  onChange={() => setDesktopNotifs(!desktopNotifs)}
                />
                <div className="w-11 h-6 rounded-full transition-colors duration-300 peer" style={{ background: desktopNotifs ? "var(--color-primary)" : "var(--surface-hover)" }} />
                <div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300"
                  style={{ left: "4px", transform: desktopNotifs ? "translateX(20px)" : "translateX(0)" }}
                />
              </label>
            </div>

            {/* Critical Alerts Only */}
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-muted)" }}>Critical Alerts Only</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Only notify for important updates.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={criticalAlerts}
                  onChange={() => setCriticalAlerts(!criticalAlerts)}
                />
                <div className="w-11 h-6 rounded-full transition-colors duration-300 peer" style={{ background: criticalAlerts ? "var(--color-primary)" : "var(--surface-hover)" }} />
                <div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300"
                  style={{ left: "4px", transform: criticalAlerts ? "translateX(20px)" : "translateX(0)" }}
                />
              </label>
            </div>

            {/* Logout */}
            <div className="p-6 flex justify-between items-center" style={{ background: "color-mix(in srgb, var(--surface-hover) 50%, transparent)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Sign Out</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sign out of your account on this device.</p>
              </div>
              <button
                className="px-6 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all active:scale-95"
                onClick={() => logout()}
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
