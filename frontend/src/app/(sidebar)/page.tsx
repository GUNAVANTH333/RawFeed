"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getThreads, type Thread, type Pagination } from "@/lib/api";

const categories = ["For You", "Global News", "Tech & Science", "Finance"];

const trendingTopics = [
  { tag: "#Politics", title: "Senate Bill 402", count: "12.5k discussions" },
  { tag: "#Tech", title: "OpenAI Dev Day", count: "8.2k discussions" },
];

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
  }, []);

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
              threads.map((thread) => (
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
                        {thread.domain && thread.domain !== "user-submitted" && (
                          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <span className="material-symbols-outlined text-primary text-[16px] fill-1">verified_user</span>
                            <span className="text-white text-xs font-semibold tracking-wide uppercase">{thread.domain}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          <span className="text-primary">{thread.domain || "Discussion"}</span>
                          <span className="size-1 rounded-full" style={{ background: "var(--text-muted)" }}></span>
                          <span>{timeAgo(thread.createdAt)}</span>
                        </div>
                        <button
                          className="hover:text-primary transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onClick={(e) => e.preventDefault()}
                        >
                          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                        </button>
                      </div>
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
                            {thread.myPseudonym || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: "var(--surface-hover)" }}>
                            <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--text-muted)" }}>arrow_upward</span>
                            <span className="text-xs font-bold min-w-[20px] text-center" style={{ color: "var(--text-secondary)" }}>
                              {thread._count?.comments || 0}
                            </span>
                            <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--text-muted)" }}>arrow_downward</span>
                          </div>
                          <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                            <span className="text-xs font-medium">{thread._count?.comments || 0}</span>
                          </div>
                          <button style={{ color: "var(--text-muted)" }} className="hover:text-primary transition-colors" onClick={(e) => e.preventDefault()}>
                            <span className="material-symbols-outlined text-[18px]">ios_share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))
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

      {/* Right Sidebar */}
      <aside className="hidden xl:flex flex-col w-80 p-6 overflow-y-auto" style={{ background: "var(--surface)", borderLeft: "1px solid var(--border-subtle)" }}>
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Trending Topics</h3>
          <div className="flex flex-col gap-3">
            {trendingTopics.map((topic) => (
              <a
                key={topic.title}
                className="group p-3 rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                style={{ background: "var(--surface-hover)", border: "1px solid var(--border-subtle)" }}
                href="#"
              >
                <p className="text-xs text-primary font-medium mb-1">{topic.tag}</p>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>{topic.title}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{topic.count}</p>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>New Verified Sources</h3>
          <div className="flex flex-col gap-4">
            {["CNN", "BBC News"].map((source) => (
              <div key={source} className="flex items-center gap-3">
                <div className="size-10 rounded-full flex items-center justify-center p-1" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{source[0]}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{source}</span>
                    <span className="material-symbols-outlined text-[14px] text-primary fill-1">verified</span>
                  </div>
                  <button className="text-xs text-primary hover:underline text-left">Follow</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-8 flex flex-wrap gap-x-4 gap-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <a className="hover:underline hover:text-primary" href="#">Privacy</a>
          <a className="hover:underline hover:text-primary" href="#">Terms</a>
          <a className="hover:underline hover:text-primary" href="#">About RawFeed</a>
          <a className="hover:underline hover:text-primary" href="#">Verification</a>
          <span className="w-full mt-2">© 2025 RawFeed Inc.</span>
        </div>
      </aside>
    </>
  );
}
