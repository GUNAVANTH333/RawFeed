"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function VaultPage() {
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
        <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--text-muted)" }}>lock</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Sign in to access your Vault</h2>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>Your encrypted identity and reputation storage</p>
        <Link href="/login" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Sign In
        </Link>
      </main>
    );
  }

  const reputationScore = Math.min(100, Math.max(0, 50 + user.shadowScore));

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden relative" style={{ background: "var(--background)" }}>
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>

      <header className="flex-shrink-0 px-8 py-8 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>My Vault</h2>
          <p className="mt-2 text-base md:text-lg max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            End-to-end encrypted storage for your verified identities and archived discourse.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-primary/25 transition-all active:scale-95 group">
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">shield</span>
          <span>Manage Privacy</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-12 z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1600px]">
          {/* Left Column */}
          <div className="xl:col-span-7 flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reputation Score */}
              <div className="rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-lg transition-all" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-8xl text-primary">verified</span>
                </div>
                <p className="font-medium mb-1 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <span className="material-symbols-outlined text-sm">trending_up</span> Reputation Score
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>{reputationScore}</span>
                  <span className="text-xl font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>/100</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-accent-green text-sm font-semibold bg-green-50 w-fit px-2 py-1 rounded-md border border-green-100">
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                  <span>Top {Math.max(1, 100 - reputationScore)}% of users</span>
                </div>
              </div>

              {/* Vault Status */}
              <div className="rounded-2xl p-6 relative overflow-hidden shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-medium" style={{ color: "var(--text-muted)" }}>Vault Status</p>
                  <div className="size-2 bg-accent-green rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2 font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  <span className="material-symbols-outlined text-primary">lock</span>
                  <span>Encrypted</span>
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Last sync: 2 mins ago via AES-256</p>
                <div className="mt-4 w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-hover)" }}>
                  <div className="h-full w-full bg-primary rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Active Masks */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <span className="material-symbols-outlined text-primary">masks</span>
                  Active Masks
                </h3>
                <button className="text-primary text-sm font-semibold hover:text-primary-dark transition-colors">View History</button>
              </div>

              {/* Current Mask */}
              <div className="group relative rounded-2xl p-1 shadow-[0_0_15px_-3px_rgba(14,165,233,0.3)] transition-all" style={{ background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)" }}>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 flex h-6 w-6 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-primary"></span>
                </div>
                <div className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative overflow-hidden" style={{ background: "var(--surface-hover)" }}>
                  <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
                  <div className="relative">
                    <div className="size-16 rounded-xl flex items-center justify-center shadow-md" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                      <span className="material-symbols-outlined text-3xl text-primary">flight</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 rounded-full p-0.5 shadow-sm" style={{ background: "var(--surface)" }}>
                      <span className="material-symbols-outlined text-accent-green" style={{ fontSize: "16px" }}>check_circle</span>
                    </div>
                  </div>
                  <div className="flex-1 z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{user.displayName || user.email.split("@")[0]}</h4>
                      <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">Current</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Source Verified</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--text-muted)" }}></span> Level 4 Clearance</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium hover:text-primary transition-colors shadow-sm z-10" style={{ background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                    Edit Mask
                  </button>
                </div>
              </div>

              {/* Dormant Mask */}
              <div className="rounded-2xl p-5 hover:border-primary/30 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-6 opacity-75 hover:opacity-100 shadow-sm hover:shadow-md" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                <div className="size-14 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-hover)", border: "1px solid var(--border-subtle)" }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: "var(--text-muted)" }}>person_off</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>Ghost Writer</h4>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded" style={{ background: "var(--surface-hover)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>Dormant</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Last active: 14 days ago • Economy & Trade</p>
                </div>
                <button className="px-3 py-2 rounded-lg text-sm font-medium hover:text-primary transition-colors" style={{ color: "var(--text-muted)" }}>
                  Activate
                </button>
              </div>
            </div>
          </div>

          {/* Right Column — Saved Threads */}
          <div className="xl:col-span-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <span className="material-symbols-outlined text-primary">bookmarks</span>
                Saved Threads
              </h3>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg hover:text-primary transition-colors" style={{ color: "var(--text-muted)" }}>
                  <span className="material-symbols-outlined text-xl">filter_list</span>
                </button>
                <button className="p-1.5 rounded-lg hover:text-primary transition-colors" style={{ color: "var(--text-muted)" }}>
                  <span className="material-symbols-outlined text-xl">search</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { source: "reuters.com", time: "2h ago", title: "Analysis of the new encryption protocols impacting global trade markets", desc: "Sources indicate a massive shift in how digital assets are being secured across the oceanic...", tags: ["Cybersec", "Finance"] },
                { source: "bloomberg.com", time: "1d ago", title: "Deep dive into market volatility and shadow banking sectors", desc: "An insider look at the undocumented movements within the shadow banking sector of Southeast...", tags: ["Economics"] },
                { source: "RawFeed Exclusive", time: "3d ago", title: "Whistleblower report: Project Chimera Leaks", desc: "Verified documents surfacing regarding the Chimera project show direct links to government...", tags: ["High Priority"], isExclusive: true },
              ].map((item) => (
                <div key={item.title} className="rounded-xl p-4 transition-all cursor-pointer group shadow-sm hover:shadow-md" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`size-5 rounded flex items-center justify-center overflow-hidden ${item.isExclusive ? "bg-primary" : ""}`} style={!item.isExclusive ? { background: "var(--text-primary)" } : undefined}>
                        {item.isExclusive ? (
                          <span className="material-symbols-outlined text-white text-[10px]">radar</span>
                        ) : (
                          <span className="text-white text-[8px] font-bold">{item.source[0].toUpperCase()}</span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${item.isExclusive ? "text-primary" : ""}`} style={!item.isExclusive ? { color: "var(--text-secondary)" } : undefined}>{item.source}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.time}</span>
                  </div>
                  <h4 className="font-semibold leading-snug mb-2 group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>{item.title}</h4>
                  <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                  <div className="flex items-center justify-between mt-2 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="flex gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-medium ${tag === "High Priority" ? "bg-red-50 text-red-600 border border-red-100" : ""}`} style={tag !== "High Priority" ? { background: "var(--surface-hover)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" } : undefined}>{tag}</span>
                      ))}
                    </div>
                    <span className="material-symbols-outlined text-lg group-hover:text-primary/70 transition-colors" style={{ color: "var(--text-muted)" }}>lock</span>
                  </div>
                </div>
              ))}

              <button className="w-full py-3 rounded-xl border border-dashed transition-all text-sm font-medium flex items-center justify-center gap-2 hover:text-primary hover:border-primary" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                <span className="material-symbols-outlined">history</span>
                Load Archived Threads
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
