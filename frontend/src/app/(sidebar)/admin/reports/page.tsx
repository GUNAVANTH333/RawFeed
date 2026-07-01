"use client";

import { useEffect, useState } from "react";
import { getAdminReports, resolveReport, banUser, adjustShadowScore, adminDeleteThread, adminDeleteComment, type AdminReport } from "@/lib/api";

type Filter = "open" | "resolved";
type ActionType = "DISMISSED" | "SHADOW_SCORE_INCREASED" | "CONTENT_DELETED" | "USER_BANNED";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [filter, setFilter] = useState<Filter>("open");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(f: Filter, p: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminReports(p, f === "resolved" ? true : false);
      setReports(data.reports);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    }
    setLoading(false);
  }

  useEffect(() => { load(filter, page); }, [filter, page]);

  async function handleResolve(report: AdminReport, action: ActionType) {
    setActing(report.id);
    try {
      if (action === "SHADOW_SCORE_INCREASED") {
        await adjustShadowScore(report.reportedUser.id, 10, `Report: ${report.reason}`);
      }
      if (action === "CONTENT_DELETED") {
        if (report.thread) await adminDeleteThread(report.thread.id);
        else if (report.comment) await adminDeleteComment(report.comment.id);
      }
      if (action === "USER_BANNED") {
        await banUser(report.reportedUser.id, report.reason);
      }
      await resolveReport(report.id, action);
      await load(filter, page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
    setActing(null);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Reports</h1>
        <div className="flex gap-2">
          {(["open", "resolved"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors"
              style={filter === f
                ? { background: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }
                : { color: "var(--text-secondary)" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm px-4 py-3 rounded-lg" style={{ background: "color-mix(in srgb, red 12%, transparent)", color: "red", border: "1px solid color-mix(in srgb, red 25%, transparent)" }}>
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</div>
      ) : reports.length === 0 ? (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>No {filter} reports.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Reported by</span>{" "}
                    @{report.reporter.username}{" "}
                    <span style={{ color: "var(--text-muted)" }}>against</span>{" "}
                    @{report.reportedUser.username}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Shadow score: {report.reportedUser.shadowScore} ·{" "}
                    {report.reportedUser.isBanned ? "Banned" : "Active"}
                  </div>
                  {report.thread && (
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Thread: <a href={`/threads/${report.thread.id}`} className="underline">{report.thread.title}</a>
                    </div>
                  )}
                  {report.comment && (
                    <div className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
                      Comment: "{report.comment.content.slice(0, 120)}{report.comment.content.length > 120 ? "…" : ""}"
                    </div>
                  )}
                  <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                    Reason: {report.reason}
                  </div>
                </div>

                {report.resolved ? (
                  <span className="text-xs px-2 py-1 rounded-full shrink-0"
                    style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", color: "var(--color-primary)" }}>
                    {report.action ?? "Resolved"}
                  </span>
                ) : (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      disabled={acting === report.id}
                      onClick={() => handleResolve(report, "DISMISSED")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: "var(--surface-raised)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      Dismiss
                    </button>
                    <button
                      disabled={acting === report.id}
                      onClick={() => handleResolve(report, "SHADOW_SCORE_INCREASED")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: "color-mix(in srgb, #a855f7 15%, transparent)", color: "#a855f7", border: "1px solid color-mix(in srgb, #a855f7 30%, transparent)" }}>
                      Warn (+10 score)
                    </button>
                    <button
                      disabled={acting === report.id}
                      onClick={() => handleResolve(report, "CONTENT_DELETED")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: "color-mix(in srgb, orange 15%, transparent)", color: "orange", border: "1px solid color-mix(in srgb, orange 30%, transparent)" }}>
                      Delete Content
                    </button>
                    <button
                      disabled={acting === report.id}
                      onClick={() => handleResolve(report, "USER_BANNED")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: "color-mix(in srgb, red 15%, transparent)", color: "red", border: "1px solid color-mix(in srgb, red 30%, transparent)" }}>
                      Ban User
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
