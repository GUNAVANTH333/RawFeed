"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getThreads, likeThread, type Thread, type Pagination } from "@/lib/api";
import { bgColors, textColors, getColorIdx } from "@/lib/avatar";
import { IncognitoIcon } from "@/components/IncognitoIcon";
import { useAuth } from "@/lib/AuthContext";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function HomePage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getThreads(1, 20)
      .then((data) => {
        setThreads(data.threads);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleLike = useCallback(async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please sign in to like threads.");
      return;
    }

    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, isLiked: !t.isLiked, likeCount: t.isLiked ? t.likeCount - 1 : t.likeCount + 1 }
          : t
      )
    );

    try {
      const { liked, likeCount } = await likeThread(threadId);
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, isLiked: liked, likeCount } : t))
      );
    } catch {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, isLiked: !t.isLiked, likeCount: !t.isLiked ? t.likeCount - 1 : t.likeCount + 1 }
            : t
        )
      );
    }
  }, [user]);

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "var(--surface)" }}>
      {/* The feed fills the framed column provided by the sidebar layout. */}
      <div className="min-h-full">
        {/* Top bar — search + new thread */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
          style={{ background: "color-mix(in srgb, var(--surface) 85%, transparent)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(8px)" }}
        >
          <label className="relative flex flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center justify-center pl-3 pointer-events-none" style={{ color: "var(--text-muted)" }}>
              <span className="material-symbols-outlined text-[20px] leading-none">search</span>
            </span>
            <input
              className="w-full py-2 pl-10 pr-4 text-sm rounded-lg outline-none transition-colors"
              style={{ background: "var(--surface-hover)", color: "var(--text-primary)" }}
              placeholder="Search threads, sources, topics…"
              type="text"
            />
          </label>
          <Link
            href="/new-thread"
            className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1.5 shrink-0"
            style={{ background: "var(--color-primary)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">New</span>
          </Link>
        </header>

        {loading ? (
          <div className="divide-y divide-[color:var(--border-subtle)]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-full" style={{ background: "var(--surface-hover)" }}></div>
                  <div className="space-y-2">
                    <div className="h-3 w-28 rounded" style={{ background: "var(--surface-hover)" }}></div>
                    <div className="h-2.5 w-16 rounded" style={{ background: "var(--surface-hover)" }}></div>
                  </div>
                </div>
                <div className="h-5 w-3/4 rounded mb-3" style={{ background: "var(--surface-hover)" }}></div>
                <div className="h-3 w-full rounded mb-2" style={{ background: "var(--surface-hover)" }}></div>
                <div className="h-3 w-5/6 rounded" style={{ background: "var(--surface-hover)" }}></div>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-24 px-6">
            <span className="material-symbols-outlined text-5xl" style={{ color: "var(--text-muted)" }}>forum</span>
            <p className="mt-4 text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>No threads yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Be the first to start a discussion.</p>
          </div>
        ) : (
          <div className="divide-y divide-[color:var(--border-subtle)]">
            {threads.map((thread) => {
              const isAnon = thread.isAnonymous;
              const displayName = isAnon
                ? (thread.creatorPseudonym || "Anonymous")
                : (thread.creator?.username || "Anonymous");
              const ci = getColorIdx(thread.creatorPseudonym || displayName);

              return (
                <Link key={thread.id} href={`/threads/${thread.id}`} className="block">
                  <article className="p-5 cursor-pointer transition-colors hover:bg-[var(--surface-hover)]">
                    {/* Author row */}
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className={`size-10 relative overflow-hidden shrink-0 ${isAnon ? "rounded-md" : "rounded-full"}`} style={{ background: "var(--surface-hover)" }}>
                        {isAnon ? (
                          <div className={`absolute inset-0 flex items-center justify-center ${bgColors[ci]} ${textColors[ci]} text-base font-bold uppercase`}>
                            {(thread.creatorPseudonym || "A").charAt(0)}
                          </div>
                        ) : thread.creator?.profilePhoto ? (
                          <img src={thread.creator.profilePhoto} alt={displayName} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white text-base font-bold uppercase" style={{ background: "var(--color-primary)" }}>
                            {displayName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{displayName}</span>
                          {isAnon && (
                            <IncognitoIcon title="Anonymous" className="size-[15px] shrink-0" style={{ color: "var(--text-muted)" }} />
                          )}
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(thread.createdAt)}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg md:text-xl font-bold leading-snug tracking-tight mb-1.5" style={{ color: "var(--text-primary)" }}>
                      {thread.title}
                    </h3>

                    {/* Description + read more */}
                    {thread.description && (() => {
                      const words = thread.description.split(" ");
                      const isLong = words.length > 50;
                      const preview = isLong ? words.slice(0, 50).join(" ") + "…" : thread.description;
                      return (
                        <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {preview}
                          {isLong && (
                            <span className="font-semibold ml-1 hover:underline" style={{ color: "var(--text-primary)" }}>Read more →</span>
                          )}
                        </p>
                      );
                    })()}

                    {/* Image */}
                    {thread.imageUrl && (
                      <div className="mt-3.5 rounded-lg overflow-hidden aspect-[16/9]" style={{ border: "1px solid var(--border)" }}>
                        <img src={thread.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Footer actions */}
                    <div className="flex items-center gap-6 mt-4">
                      <button
                        onClick={(e) => handleLike(e, thread.id)}
                        className={`-ml-2 flex items-center gap-1.5 group px-2 py-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#F43F5E] ${thread.isLiked ? "text-[#F43F5E]" : "text-[color:var(--text-muted)]"}`}
                        aria-label={thread.isLiked ? "Unlike" : "Like"}
                      >
                        <span className={`material-symbols-outlined !text-[20px] transition-transform group-hover:scale-110 ${thread.isLiked ? "fill-1" : ""}`}>favorite</span>
                        {thread.likeCount > 0 && <span className="text-sm font-medium">{thread.likeCount}</span>}
                      </button>
                      <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                        <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                        <span className="text-xs font-medium">{thread._count?.comments || 0}</span>
                      </div>
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="ml-auto flex items-center transition-opacity hover:opacity-70"
                        style={{ color: "var(--text-muted)" }}
                        aria-label="Share"
                      >
                        <span className="material-symbols-outlined text-[20px]">ios_share</span>
                      </button>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination indicator */}
        {pagination && pagination.page < pagination.totalPages && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-1.5 animate-pulse" style={{ color: "var(--text-muted)" }}>
              <span className="size-1.5 bg-current rounded-full"></span>
              <span className="size-1.5 bg-current rounded-full"></span>
              <span className="size-1.5 bg-current rounded-full"></span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
