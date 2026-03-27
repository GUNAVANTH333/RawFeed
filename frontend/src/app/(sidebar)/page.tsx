"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getThreads, likeThread, type Thread, type Pagination } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const categories = ["For You", "Global News", "Tech & Science", "Finance"];

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
  const [activeCategory, setActiveCategory] = useState("For You");
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

    // Optimistic UI update
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            isLiked: !t.isLiked,
            likeCount: t.isLiked ? t.likeCount - 1 : t.likeCount + 1,
          };
        }
        return t;
      })
    );

    try {
      const { liked, likeCount } = await likeThread(threadId);
      // Ensure backend sync
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, isLiked: liked, likeCount } : t))
      );
    } catch {
      // Revert optimistic update on failure
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === threadId) {
            return {
              ...t,
              isLiked: !t.isLiked,
              likeCount: !t.isLiked ? t.likeCount - 1 : t.likeCount + 1,
            };
          }
          return t;
        })
      );
    }
  }, [user]);

  return (
    <>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative" style={{ background: "var(--background)" }}>
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 backdrop-blur-md"
          style={{ background: "color-mix(in srgb, var(--surface) 80%, transparent)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 className="text-xl font-bold md:hidden" style={{ color: "var(--text-primary)" }}>RawFeed</h2>
          <div className="flex-1 max-w-xl mx-auto w-full">
            <label className="relative flex w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" style={{ color: "var(--text-muted)" }}>
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                className="w-full py-2.5 pl-10 pr-4 text-sm rounded-lg border-none outline-none transition-all"
                style={{ background: "var(--surface-hover)", color: "var(--text-primary)" }}
                placeholder="Search topics, sources, or verified threads..."
                type="text"
              />
            </label>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <Link
              href="/new-thread"
              className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="hidden sm:inline">New Thread</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scroll-smooth">
          <div className="max-w-[700px] mx-auto flex flex-col gap-6 pb-20">
            {/* Category Filter Tabs */}
            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : ""
                  }`}
                  style={activeCategory !== cat ? {
                    background: "var(--surface)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  } : undefined}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Thread Cards */}
            {loading ? (
              <div className="flex flex-col gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                    <div className="h-64" style={{ background: "var(--surface-hover)" }}></div>
                    <div className="p-6 space-y-3">
                      <div className="h-4 rounded w-1/3" style={{ background: "var(--surface-hover)" }}></div>
                      <div className="h-6 rounded w-3/4" style={{ background: "var(--surface-hover)" }}></div>
                      <div className="h-4 rounded w-full" style={{ background: "var(--surface-hover)" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl" style={{ color: "var(--text-muted)" }}>forum</span>
                <p className="mt-4 text-lg" style={{ color: "var(--text-secondary)" }}>No threads yet</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Be the first to start a discussion</p>
              </div>
            ) : (
              threads.map((thread) => {
                return (
                  <Link key={thread.id} href={`/threads/${thread.id}`}>
                    <article
                      className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
                      style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
                    >
                      {thread.imageUrl && (
                        <div className="relative h-64 w-full overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                          <div
                            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url('${thread.imageUrl}')` }}
                          ></div>
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-2xl font-bold mb-2 leading-tight hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                          {thread.title}
                        </h3>
                        {thread.url && (
                          <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {thread.url}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded relative overflow-hidden ring-2" style={{ background: "var(--surface-hover)", "--tw-ring-color": "var(--surface)" } as React.CSSProperties}>
                              <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,_#BAE6FD_0%,_#38BDF8_50%,_#BAE6FD_100%)]"></div>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                              {thread.isAnonymous ? "Anonymous" : (thread.creator?.username || "Anonymous")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            {/* Like button */}
                            <button
                              onClick={(e) => handleLike(e, thread.id)}
                              className="flex items-center gap-1.5 transition-colors group"
                              style={{ color: thread.isLiked ? "var(--color-primary)" : "var(--text-muted)" }}
                              aria-label={thread.isLiked ? "Unlike" : "Like"}
                            >
                              <span
                                className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${thread.isLiked ? "fill-1" : ""}`}
                              >
                                favorite
                              </span>
                              {thread.likeCount > 0 && (
                                <span className="text-xs font-medium">{thread.likeCount}</span>
                              )}
                            </button>
                            {/* Comment count */}
                            <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                              <span className="text-xs font-medium">{thread._count?.comments || 0}</span>
                            </div>
                            <button style={{ color: "var(--text-muted)" }} className="hover:text-primary transition-colors" onClick={(e) => e.preventDefault()}>
                              <span className="material-symbols-outlined text-[18px]">ios_share</span>
                            </button>
                            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{timeAgo(thread.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })
            )}

            {/* Loading dots */}
            {pagination && pagination.page < pagination.totalPages && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-primary animate-pulse">
                  <span className="size-2 bg-current rounded-full"></span>
                  <span className="size-2 bg-current rounded-full"></span>
                  <span className="size-2 bg-current rounded-full"></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
