"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, banUser, unbanUser, adjustShadowScore, type AdminUser } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});

  async function load(p: number) {
    setLoading(true);
    try {
      const data = await getAdminUsers(p);
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(page); }, [page]);

  async function handleBanToggle(user: AdminUser) {
    setActing(user.id);
    try {
      if (user.isBanned) {
        await unbanUser(user.id);
      } else {
        await banUser(user.id, "Admin action");
      }
      await load(page);
    } catch {}
    setActing(null);
  }

  async function handleScoreAdjust(user: AdminUser) {
    const raw = scoreInputs[user.id];
    const delta = parseInt(raw ?? "");
    if (isNaN(delta) || delta === 0) return;
    setActing(user.id);
    try {
      await adjustShadowScore(user.id, delta, "Manual admin adjustment");
      setScoreInputs(prev => ({ ...prev, [user.id]: "" }));
      await load(page);
    } catch {}
    setActing(null);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Users</h1>

      {loading ? (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      @{user.username}
                    </span>
                    {user.role === "ADMIN" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                        style={{ background: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }}>
                        Admin
                      </span>
                    )}
                    {user.isBanned && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                        style={{ background: "color-mix(in srgb, red 15%, transparent)", color: "red" }}>
                        Banned
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{user.email}</div>
                  <div className="text-xs flex gap-3" style={{ color: "var(--text-muted)" }}>
                    <span>Shadow score: <strong style={{ color: user.shadowScore > 50 ? "red" : "var(--text-secondary)" }}>{user.shadowScore}</strong></span>
                    <span>Reports: {user._count.reportsReceived}</span>
                  </div>
                </div>

                {user.role !== "ADMIN" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="±score"
                        value={scoreInputs[user.id] ?? ""}
                        onChange={e => setScoreInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                        className="w-20 px-2 py-1.5 rounded-lg text-xs"
                        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                      />
                      <button
                        disabled={acting === user.id || !scoreInputs[user.id]}
                        onClick={() => handleScoreAdjust(user)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                        style={{ background: "var(--surface-raised)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        Apply
                      </button>
                    </div>
                    <button
                      disabled={acting === user.id}
                      onClick={() => handleBanToggle(user)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                      style={user.isBanned
                        ? { background: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)" }
                        : { background: "color-mix(in srgb, red 15%, transparent)", color: "red", border: "1px solid color-mix(in srgb, red 30%, transparent)" }
                      }>
                      {user.isBanned ? "Unban" : "Ban"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3 justify-center pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            Previous
          </button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
