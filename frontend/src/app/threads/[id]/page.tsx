"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getThread, getComments, createComment, voteComment, type ThreadDetail, type Comment } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeProvider";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ringColors = ["ring-sky-400", "ring-indigo-400", "ring-emerald-400", "ring-orange-400", "ring-red-400", "ring-violet-400"];
const bgColors = ["bg-sky-50", "bg-indigo-50", "bg-emerald-50", "bg-orange-50", "bg-red-50", "bg-violet-50"];
const textColors = ["text-sky-500", "text-indigo-500", "text-emerald-500", "text-orange-500", "text-red-500", "text-violet-500"];

function getColorIdx(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % ringColors.length;
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      getThread(id).then((d) => setThread(d.thread)),
      getComments(id).then((d) => setComments(d.comments)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { comment } = await createComment(id, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch {}
    setSubmitting(false);
  };

  const handleVote = async (commentId: string, type: "up" | "down") => {
    try {
      await voteComment(commentId, type);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          if (type === "up") return { ...c, upvotes: c.upvotes + 1 };
          return { ...c, downvotes: c.downvotes + 1 };
        })
      );
    } catch {}
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = acc[c.parentId] || [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--background)" }}>
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>Loading thread...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: "var(--background)" }}>
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--text-muted)" }}>error</span>
        <p className="text-xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>Thread not found</p>
        <Link href="/" className="text-primary hover:underline mt-2">Back to Feed</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap px-4 md:px-10 py-3 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="size-8 text-primary">
              <span className="material-symbols-outlined !text-[32px]">hub</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight" style={{ color: "var(--text-primary)" }}>RawFeed</h2>
          </div>
          <nav className="hidden md:flex items-center gap-9">
            <Link className="text-sm font-medium transition-colors hover:text-primary" style={{ color: "var(--text-secondary)" }} href="/">Home</Link>
            <Link className="text-primary text-sm font-bold" href="#">Trending</Link>
            <Link className="text-sm font-medium transition-colors hover:text-primary" style={{ color: "var(--text-secondary)" }} href="/vault">Bookmarks</Link>
            <Link className="text-sm font-medium transition-colors hover:text-primary" style={{ color: "var(--text-secondary)" }} href="/vault">Profile</Link>
          </nav>
        </div>
        <div className="flex flex-1 justify-end gap-4 md:gap-8 items-center">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:text-primary transition-colors" style={{ color: "var(--text-secondary)" }}>
            <span className="material-symbols-outlined">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
          </button>
          <label className="hidden md:flex flex-col min-w-40 !h-10 max-w-64">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full transition-all" style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-center pl-4 text-primary/60">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input className="flex w-full min-w-0 flex-1 bg-transparent focus:outline-none h-full px-4 pl-2 text-sm border-none" style={{ color: "var(--text-primary)" }} placeholder="Search topics..." />
            </div>
          </label>
          {user && (
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-transparent hover:ring-primary transition-all cursor-pointer">
              {user.email[0].toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center w-full px-4 md:px-0 pb-24">
        <div className="w-full max-w-[800px] py-8 flex flex-col gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-2 px-2" style={{ color: "var(--text-secondary)" }}>
            <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              <span>Back to Feed</span>
            </Link>
            <span className="opacity-50">/</span>
            <span>{thread.domain || "Discussion"}</span>
            <span className="opacity-50">/</span>
            <span className="font-medium truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>{thread.title}</span>
          </div>

          {/* Thread Article Card */}
          <article className="rounded-xl shadow-sm overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col md:flex-row">
              {thread.imageUrl && (
                <div className="w-full md:w-2/5 h-48 md:h-auto relative group overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${thread.imageUrl}')` }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
                </div>
              )}
              <div className="flex-1 p-5 md:p-6 flex flex-col justify-between" style={{ background: "var(--surface)" }}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">{thread.domain || "Discussion"}</span>
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <span className="material-symbols-outlined !text-[14px] text-primary">verified</span> Source Verified
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(thread.createdAt)}</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold leading-tight mb-3" style={{ color: "var(--text-primary)" }}>{thread.title}</h1>
                  {thread.url && <p className="text-sm line-clamp-2 mb-4" style={{ color: "var(--text-secondary)" }}>{thread.url}</p>}
                </div>
                <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "var(--text-primary)" }}>{thread.domain?.[0]?.toUpperCase() || "R"}</div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{thread.domain || "RawFeed"}</span>
                  </div>
                  {thread.url && (
                    <a href={thread.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                      Read Full Analysis <span className="material-symbols-outlined !text-[16px]">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>

          {/* Discussion Header */}
          <div className="flex items-center justify-between px-2 pt-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              Discussion <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">{comments.length}</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Sort by:</span>
              <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                Top Rated <span className="material-symbols-outlined !text-[16px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="flex flex-col gap-6 px-2">
            {topLevelComments.map((comment, idx) => {
              const ci = getColorIdx(comment.participant.pseudonym);
              const initial = comment.participant.pseudonym[0]?.toUpperCase() || "?";
              const replies = repliesByParent[comment.id] || [];

              return (
                <div key={comment.id} className="relative group/comment">
                  {idx < topLevelComments.length - 1 && replies.length > 0 && <div className="thread-line"></div>}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0 z-10">
                      <div className={`size-10 rounded-full ${ringColors[ci]} ring-2 p-0.5 shadow-sm`} style={{ background: "var(--surface)" }}>
                        <div className={`w-full h-full rounded-full ${bgColors[ci]} flex items-center justify-center ${textColors[ci]} font-bold text-lg select-none`}>
                          {initial}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold hover:text-primary cursor-pointer transition-colors" style={{ color: "var(--text-primary)" }}>
                          {comment.participant.pseudonym}
                        </span>
                        {comment.isMe && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">You</span>
                        )}
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>• {timeAgo(comment.createdAt)}</span>
                      </div>

                      {comment.isHidden ? (
                        <div className="flex items-center gap-3 rounded-lg p-3 my-2" style={{ background: "var(--surface-hover)", border: "1px dashed var(--border)" }}>
                          <div className="size-8 rounded-full flex items-center justify-center" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                            <span className="material-symbols-outlined !text-[18px]">visibility_off</span>
                          </div>
                          <p className="text-sm font-medium italic" style={{ color: "var(--text-secondary)" }}>[Hidden by Community Standards]</p>
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{comment.content}</div>
                      )}

                      <div className="flex items-center gap-6">
                        <button onClick={() => handleVote(comment.id, "up")} className="flex items-center gap-1.5 hover:text-primary transition-colors group" style={{ color: "var(--text-muted)" }}>
                          <span className="material-symbols-outlined !text-[18px] group-hover:scale-110 transition-transform">thumb_up</span>
                          <span className="text-xs font-medium">{comment.upvotes}</span>
                        </button>
                        <button onClick={() => handleVote(comment.id, "down")} className="flex items-center gap-1.5 hover:text-red-400 transition-colors group" style={{ color: "var(--text-muted)" }}>
                          <span className="material-symbols-outlined !text-[18px] group-hover:scale-110 transition-transform">thumb_down</span>
                          <span className="text-xs font-medium">{comment.downvotes}</span>
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-primary transition-colors" style={{ color: "var(--text-muted)" }}>
                          <span className="material-symbols-outlined !text-[18px]">chat_bubble</span>
                          <span className="text-xs font-medium">Reply</span>
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-primary transition-colors ml-auto" style={{ color: "var(--text-muted)" }}>
                          <span className="material-symbols-outlined !text-[18px]">more_horiz</span>
                        </button>
                      </div>

                      {replies.length > 0 && (
                        <div className="mt-6 flex flex-col gap-6 relative">
                          {replies.map((reply) => {
                            const ri = getColorIdx(reply.participant.pseudonym);
                            const replyInitial = reply.participant.pseudonym[0]?.toUpperCase() || "?";
                            return (
                              <div key={reply.id} className="relative flex gap-4">
                                <div className="thread-line-curved"></div>
                                <div className="flex flex-col items-center shrink-0 z-10">
                                  <div className={`size-8 rounded-full ${ringColors[ri]} ring-2 p-0.5 shadow-sm`} style={{ background: "var(--surface)" }}>
                                    <div className={`w-full h-full rounded-full ${bgColors[ri]} flex items-center justify-center ${textColors[ri]} font-bold text-sm select-none`}>
                                      {replyInitial}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold hover:text-primary cursor-pointer transition-colors" style={{ color: "var(--text-primary)" }}>{reply.participant.pseudonym}</span>
                                    {reply.isMe && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">You</span>}
                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>• {timeAgo(reply.createdAt)}</span>
                                  </div>
                                  {reply.isHidden ? (
                                    <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "var(--surface-hover)", border: "1px dashed var(--border)" }}>
                                      <span className="material-symbols-outlined !text-[18px]" style={{ color: "var(--text-muted)" }}>visibility_off</span>
                                      <p className="text-sm font-medium italic" style={{ color: "var(--text-secondary)" }}>[Hidden by Community Standards]</p>
                                    </div>
                                  ) : (
                                    <div className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>{reply.content}</div>
                                  )}
                                  <div className="flex items-center gap-6">
                                    <button onClick={() => handleVote(reply.id, "up")} className="flex items-center gap-1.5 hover:text-primary transition-colors" style={{ color: "var(--text-muted)" }}>
                                      <span className="material-symbols-outlined !text-[16px]">thumb_up</span>
                                      <span className="text-xs font-medium">{reply.upvotes}</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors" style={{ color: "var(--text-muted)" }}>
                                      <span className="text-xs font-medium">Reply</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {comments.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl" style={{ color: "var(--text-muted)" }}>chat</span>
                <p className="mt-3" style={{ color: "var(--text-secondary)" }}>No comments yet. Be the first to share your perspective!</p>
              </div>
            )}

            <div className="flex justify-center py-6">
              <div className="w-2 h-2 rounded-full bg-primary/30 mx-1"></div>
              <div className="w-2 h-2 rounded-full bg-primary/30 mx-1"></div>
              <div className="w-2 h-2 rounded-full bg-primary/30 mx-1"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Comment Composer Footer */}
      {user && (
        <footer className="fixed bottom-0 left-0 w-full backdrop-blur-lg z-40 py-4 px-4 shadow-[0_-4px_20px_rgba(14,165,233,0.1)]" style={{ background: "color-mix(in srgb, var(--surface) 95%, transparent)", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-[800px] mx-auto w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Replying as</span>
              <div className="flex items-center gap-2 rounded-full px-2 py-1 pr-3" style={{ background: "var(--surface-hover)" }}>
                <div className="size-5 rounded-full ring-1 ring-primary flex items-center justify-center text-[10px] text-primary font-bold" style={{ background: "var(--surface)" }}>
                  {thread.myPseudonym?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{thread.myPseudonym || "Anonymous"}</span>
              </div>
            </div>
            <div className="flex items-end gap-3 w-full">
              <div className="relative flex-1">
                <textarea
                  className="w-full text-sm rounded-xl px-4 py-3 resize-none h-12 min-h-[48px] focus:h-24 transition-all duration-200 ease-out outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  placeholder="Share your perspective..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                />
                <div className="absolute right-2 bottom-2 flex gap-1" style={{ color: "var(--border)" }}>
                  <button className="p-1 hover:text-primary transition-colors rounded"><span className="material-symbols-outlined !text-[18px]">format_bold</span></button>
                  <button className="p-1 hover:text-primary transition-colors rounded"><span className="material-symbols-outlined !text-[18px]">link</span></button>
                </div>
              </div>
              <button onClick={handleComment} disabled={submitting || !newComment.trim()} className="h-12 w-12 flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100">
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
