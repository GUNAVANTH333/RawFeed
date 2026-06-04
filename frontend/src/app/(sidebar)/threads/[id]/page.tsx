"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getThread, getComments, createComment, voteComment, deleteThread, deleteComment, updateThread, type ThreadDetail, type Comment, likeThread } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { bgColors, textColors, getColorIdx } from "@/lib/avatar";
import { IncognitoIcon } from "@/components/IncognitoIcon";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [myPseudonym, setMyPseudonym] = useState<string | null>(null);
  const [identityChoice, setIdentityChoice] = useState<boolean | null>(null);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    // Reset state when navigating to a new thread
    setThread(null);
    setComments([]);
    setMyPseudonym(null);
    setIdentityChoice(null);
    setLoading(true);

    Promise.all([
      getThread(id).then((d) => {
        setThread(d.thread);
        setMyPseudonym(d.thread.myPseudonym ?? null);
      }),
      getComments(id).then((d) => setComments(d.comments)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelectIdentity = (useRealName: boolean) => {
    setIdentityChoice(useRealName);
    setShowIdentityModal(false);
    if (useRealName) {
      setMyPseudonym(user?.username || user?.email?.split("@")[0] || "You");
    } else {
      setMyPseudonym("Anonymous (assigned on send)");
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || submitting) return;

    const hasExistingParticipation = !!thread?.myPseudonym || !!myPseudonym;
    if (!hasExistingParticipation && identityChoice === null) {
      setShowIdentityModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const useRealName = identityChoice !== null ? identityChoice : undefined;
      const { comment } = await createComment(id, newComment.trim(), undefined, useRealName);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      // Lock in the pseudonym forever for this session — never reset identityChoice
      if (!myPseudonym) setMyPseudonym(comment.participant.pseudonym);
    } catch {}
    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || submitting) return;

    // Same rule: show identity modal only if this is absolutely the first interaction
    const hasExistingParticipation = !!thread?.myPseudonym || !!myPseudonym;
    if (!hasExistingParticipation && identityChoice === null) {
      setShowIdentityModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const useRealName = identityChoice !== null ? identityChoice : undefined;
      const { comment } = await createComment(id, replyText.trim(), parentId, useRealName);
      setComments((prev) => [...prev, comment]);
      setReplyText("");
      setReplyingTo(null);
      // Lock in the pseudonym — never reset identityChoice
      if (!myPseudonym) setMyPseudonym(comment.participant.pseudonym);
    } catch {}
    setSubmitting(false);
  };

  const handleDeleteThread = async () => {
    if (!confirm("Are you sure you want to delete this thread? This will remove all comments and cannot be undone.")) return;
    try {
      await deleteThread(id);
      router.push("/");
    } catch {}
  };

  const handleEditThread = () => {
    if (!thread) return;
    setEditTitle(thread.title);
    setEditUrl(thread.url || "");
    setEditMode(true);
    setShowThreadMenu(false);
  };

  const handleUpdateThread = async () => {
    if (!editTitle.trim()) return;
    try {
      const { thread: updated } = await updateThread(id, {
        title: editTitle.trim(),
        url: editUrl.trim() || undefined,
      });
      setThread((prev) => prev ? { ...prev, title: updated.title, url: updated.url } : prev);
      setEditMode(false);
    } catch {}
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    } catch {}
  };

  const handleVote = async (commentId: string, type: "up" | "down") => {
    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const currentVote = comment.myVote;

      // Optimistic update
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;

          // If already voted the same way, remove the vote
          if (currentVote === type) {
            return {
              ...c,
              upvotes: type === "up" ? c.upvotes - 1 : c.upvotes,
              downvotes: type === "down" ? c.downvotes - 1 : c.downvotes,
              myVote: null,
            };
          }

          // If voted the opposite way, switch the vote
          if (currentVote && currentVote !== type) {
            return {
              ...c,
              upvotes: type === "up" ? c.upvotes + 1 : c.upvotes - 1,
              downvotes: type === "down" ? c.downvotes + 1 : c.downvotes - 1,
              myVote: type,
            };
          }

          // If not voted, add the vote
          return {
            ...c,
            upvotes: type === "up" ? c.upvotes + 1 : c.upvotes,
            downvotes: type === "down" ? c.downvotes + 1 : c.downvotes,
            myVote: type,
          };
        })
      );

      await voteComment(commentId, type);
    } catch {
      // Revert on error
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? comment : c))
        );
      }
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = acc[c.parentId] || [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {} as Record<string, Comment[]>);

  const renderComment = (comment: Comment, depth: number = 0) => {
    const ci = getColorIdx(comment.participant.pseudonym);
    const initial = comment.participant.pseudonym[0]?.toUpperCase() || "?";
    const replies = repliesByParent[comment.id] || [];
    const isTopLevel = depth === 0;
    const avatarSize = isTopLevel ? "size-10" : "size-8";
    const fontSize = isTopLevel ? "text-lg" : "text-sm";
    const iconSize = isTopLevel ? "!text-[18px]" : "!text-[16px]";

    return (
      <div key={comment.id} className={isTopLevel ? "relative group/comment" : "relative"}>
        {/* Vertical thread line descending from this comment's avatar through its replies */}
        {replies.length > 0 && (
          <div
            className="absolute"
            style={{ left: isTopLevel ? "19px" : "15px", top: isTopLevel ? "30px" : "30px", bottom: "0", width: "2px", background: "var(--border)", zIndex: 0 }}
          />
        )}
        {/* Horizontal elbow connecting the parent's line to this reply's avatar */}
        {!isTopLevel && (
          <div
            className="absolute"
            style={{ left: "-21px", top: "15px", width: "21px", height: "2px", background: "var(--border)", zIndex: 0 }}
          />
        )}
        <div className="flex gap-3">
          <div className="shrink-0 z-10">
            {comment.participant.profilePhoto && !comment.participant.isAnonymous ? (
              <img
                src={comment.participant.profilePhoto}
                alt={`${comment.participant.pseudonym}'s profile`}
                className={`${avatarSize} rounded-full object-cover`}
              />
            ) : (
              <div className={`${avatarSize} ${comment.participant.isAnonymous ? "rounded-md" : "rounded-full"} ${bgColors[ci]} flex items-center justify-center ${textColors[ci]} font-bold ${fontSize} select-none`}>
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {!comment.participant.isAnonymous ? (
                <Link
                  href={`/${comment.participant.pseudonym}`}
                  className="text-sm font-semibold hover:underline cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                >
                  {comment.participant.pseudonym}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {comment.participant.pseudonym}
                  <IncognitoIcon title="Anonymous" className="size-[14px] shrink-0" style={{ color: "var(--text-muted)" }} />
                </span>
              )}
              {comment.isCreator && !comment.isMe && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>Author</span>
              )}
              {comment.isMe && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>You</span>
              )}
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {timeAgo(comment.createdAt)}</span>
            </div>

            {comment.isHidden ? (
              <div className="flex items-center gap-3 rounded-lg p-3 my-2" style={{ background: "var(--surface-hover)", border: "1px dashed var(--border)" }}>
                <div className="size-8 rounded-full flex items-center justify-center" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                  <span className="material-symbols-outlined !text-[18px]">visibility_off</span>
                </div>
                <p className="text-sm font-medium italic" style={{ color: "var(--text-secondary)" }}>[Hidden by Community Standards]</p>
              </div>
            ) : (
              <div className="text-[15px] leading-relaxed mb-2.5" style={{ color: "var(--text-primary)", opacity: 0.92 }}>{comment.content}</div>
            )}

            <div className="flex items-center gap-6">
              <button
                onClick={() => handleVote(comment.id, "up")}
                className="flex items-center gap-1.5 hover:text-primary transition-colors group"
                style={{ color: comment.myVote === "up" ? "var(--color-primary)" : "var(--text-muted)" }}
              >
                <span className={`material-symbols-outlined ${iconSize} group-hover:scale-110 transition-transform ${comment.myVote === "up" ? "fill-1" : ""}`}>
                  thumb_up
                </span>
                <span className="text-xs font-medium">{comment.upvotes}</span>
              </button>
              <button
                onClick={() => handleVote(comment.id, "down")}
                className="flex items-center gap-1.5 hover:text-red-400 transition-colors group"
                style={{ color: comment.myVote === "down" ? "#f87171" : "var(--text-muted)" }}
              >
                <span className={`material-symbols-outlined ${iconSize} group-hover:scale-110 transition-transform ${comment.myVote === "down" ? "fill-1" : ""}`}>
                  thumb_down
                </span>
                <span className="text-xs font-medium">{comment.downvotes}</span>
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    alert("Please sign in to reply to comments.");
                    return;
                  }
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                }}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
                style={{ color: replyingTo === comment.id ? "var(--color-primary)" : "var(--text-muted)" }}
              >
                <span className="material-symbols-outlined !text-[18px]">chat_bubble</span>
                <span className="text-xs font-medium">Reply</span>
              </button>
              {comment.isMe && (
                <button onClick={() => handleDeleteComment(comment.id)} className="flex items-center gap-1.5 hover:text-red-400 transition-colors ml-auto" style={{ color: "var(--text-muted)" }}>
                  <span className="material-symbols-outlined !text-[18px]">delete</span>
                  <span className="text-xs font-medium">Delete</span>
                </button>
              )}
            </div>

            {/* Reply Input Box */}
            {user && replyingTo === comment.id && (
              <div className="mt-4 flex gap-3 items-start">
                <div className={`size-8 rounded-full ring-2 ring-primary p-0.5 shadow-sm`} style={{ background: "var(--surface)" }}>
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {user?.email[0].toUpperCase() || "?"}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    className="w-full text-sm rounded-lg px-3 py-2 resize-none min-h-[80px] outline-none focus:ring-2 focus:ring-primary/20"
                    style={{ background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    placeholder="Write your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                      style={{ color: "var(--text-muted)", background: "var(--surface-hover)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyText.trim() || submitting}
                      className="px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Sending..." : "Reply"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Nested Replies — vertical guide line aligned under the parent avatar's
                center. marginLeft pulls the group left so the border sits on the
                avatar centerline (top-level avatar 40px → center 20, indent 52 → -32;
                nested avatar 32px → center 16, indent 44 → -28). */}
            {replies.length > 0 && (
              <div
                className="mt-3 flex flex-col gap-4"
                style={{
                  marginLeft: isTopLevel ? "-32px" : "-28px",
                  paddingLeft: "21px",
                }}
              >
                {replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>Loading thread...</div>
      </main>
    );
  }

  if (!thread) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center" style={{ background: "var(--surface)" }}>
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--text-muted)" }}>error</span>
        <p className="text-xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>Thread not found</p>
        <Link href="/" className="text-primary hover:underline mt-2">Back to Feed</Link>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto flex flex-col" style={{ background: "var(--surface)" }}>
      {/* Slim sticky header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{ background: "color-mix(in srgb, var(--surface) 85%, transparent)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(8px)" }}
      >
        <Link href="/" className="flex items-center justify-center size-9 rounded-full transition-colors hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }} aria-label="Back to feed">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Thread</h2>
      </header>

      <div className="flex flex-col gap-5 px-4 sm:px-5 py-5">

          {/* Thread Article Card */}
          <article style={{ background: "var(--surface)" }}>
            <div>
              <div className="px-1 flex flex-col justify-between">
                <div>
                  {editMode ? (
                    <div className="flex flex-col gap-3">
                      <input
                        className="text-xl font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                        style={{ background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Thread title"
                      />
                      <input
                        className="text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                        style={{ background: "var(--surface-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="Source URL (optional)"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleUpdateThread} className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Save</button>
                        <button onClick={() => setEditMode(false)} className="text-sm font-medium px-4 py-2 rounded-lg transition-colors" style={{ color: "var(--text-muted)", background: "var(--surface-hover)" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Author */}
                      {!thread.isAnonymous && thread.creator?.username ? (
                        <Link href={`/${thread.creator.username}`} className="flex items-center gap-2.5 mb-4 w-fit group">
                          <div className="size-9 rounded-full relative overflow-hidden shrink-0" style={{ background: "var(--surface-hover)" }}>
                            {thread.creator.profilePhoto ? (
                              <img src={thread.creator.profilePhoto} alt={thread.creator.username} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold uppercase" style={{ background: "var(--color-primary)" }}>
                                {thread.creator.username.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="leading-tight">
                            <span className="block text-sm font-semibold group-hover:underline" style={{ color: "var(--text-primary)" }}>{thread.creator.username}</span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(thread.createdAt)}</span>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="size-9 rounded-md relative overflow-hidden shrink-0" style={{ background: "var(--surface-hover)" }}>
                            <div className={`absolute inset-0 flex items-center justify-center ${bgColors[getColorIdx(thread.creatorPseudonym || "Anonymous")]} ${textColors[getColorIdx(thread.creatorPseudonym || "Anonymous")]} text-sm font-bold uppercase`}>
                              {(thread.creatorPseudonym || "A").charAt(0)}
                            </div>
                          </div>
                          <div className="leading-tight">
                            <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                              {thread.creatorPseudonym || "Anonymous"}
                              <IncognitoIcon title="Anonymous" className="size-[14px] shrink-0" style={{ color: "var(--text-muted)" }} />
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(thread.createdAt)}</span>
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <h1 className="text-2xl md:text-[28px] font-bold leading-tight tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>{thread.title}</h1>

                      {/* Description */}
                      {thread.description && (
                        <p className="text-[15px] md:text-base leading-relaxed whitespace-pre-wrap mb-4" style={{ color: "var(--text-secondary)" }}>
                          {thread.description}
                        </p>
                      )}

                      {/* Source link */}
                      {thread.url && (
                        <a href={thread.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-sm font-medium mb-4 max-w-full" style={{ color: "var(--text-primary)" }}>
                          <span className="material-symbols-outlined !text-[18px] shrink-0">link</span>
                          <span className="truncate group-hover:underline">{thread.url}</span>
                          <span className="material-symbols-outlined !text-[16px] shrink-0">open_in_new</span>
                        </a>
                      )}

                      {/* Image */}
                      {thread.imageUrl && (
                        <div className="rounded-lg overflow-hidden aspect-[16/9] mb-4" style={{ border: "1px solid var(--border)" }}>
                          <img src={thread.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!user) {
                          alert("Please sign in to like threads.");
                          return;
                        }
                        
                        // Optimistic
                        setThread(prev => prev ? {
                          ...prev,
                          isLiked: !prev.isLiked,
                          likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
                        } : null);
                        
                        try {
                          const { liked, likeCount } = await likeThread(thread.id);
                          setThread(prev => prev ? { ...prev, isLiked: liked, likeCount } : null);
                        } catch {
                          setThread(prev => prev ? { ...prev, isLiked: !prev.isLiked, likeCount: !prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1} : null);
                        }
                      }}
                      className={`flex items-center gap-1.5 group px-2 py-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#F43F5E] ${thread.isLiked ? "text-[#F43F5E]" : "text-[color:var(--text-muted)]"}`}
                      aria-label="Like Thread"
                    >
                      <span className={`material-symbols-outlined !text-[20px] transition-transform group-hover:scale-110 ${thread.isLiked ? "fill-1" : ""}`}>
                        favorite
                      </span>
                      {thread.likeCount > 0 && <span className="text-sm font-medium">{thread.likeCount}</span>}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(window.location.href);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        } catch {
                          alert("Could not copy link.");
                        }
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: copied ? "var(--text-primary)" : "var(--text-muted)" }}
                      aria-label="Copy link"
                    >
                      <span className="material-symbols-outlined !text-[20px]">{copied ? "check" : "ios_share"}</span>
                      <span className="text-sm font-medium">{copied ? "Copied" : "Share"}</span>
                    </button>
                    <div className="relative ml-auto">
                      <button onClick={() => setShowThreadMenu((v) => !v)} className="p-1.5 rounded-lg hover:text-primary transition-colors" style={{ color: "var(--text-muted)" }}>
                        <span className="material-symbols-outlined !text-[20px]">more_horiz</span>
                      </button>
                      {showThreadMenu && (
                        <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl shadow-2xl py-1 z-[60]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                          {thread.isOwner ? (
                            <>
                              <button onClick={handleEditThread} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors text-left" style={{ color: "var(--text-primary)" }}>
                                <span className="material-symbols-outlined !text-[18px]">edit</span> Edit Thread
                              </button>
                              <button onClick={() => { setShowThreadMenu(false); handleDeleteThread(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-500/5 transition-colors text-left text-red-400">
                                <span className="material-symbols-outlined !text-[18px]">delete</span> Delete Thread
                              </button>
                            </>
                          ) : (
                            <button onClick={() => { setShowThreadMenu(false); alert("Thread reported. We'll review it shortly."); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-500/5 transition-colors text-left" style={{ color: "var(--text-primary)" }}>
                              <span className="material-symbols-outlined !text-[18px] text-red-400">flag</span> Report Thread
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
          </article>

          {/* Discussion Header */}
          <div className="flex items-center justify-between px-2 pt-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              Discussion <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>{comments.length}</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Sort by:</span>
              <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                Top Rated <span className="material-symbols-outlined !text-[16px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="px-1">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl" style={{ color: "var(--text-muted)" }}>chat</span>
                <p className="mt-3" style={{ color: "var(--text-secondary)" }}>No comments yet. Be the first to share your perspective!</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[color:var(--border-subtle)]">
                {topLevelComments.map((comment) => (
                  <div key={comment.id} className="py-5 first:pt-1">{renderComment(comment)}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      {/* Comment Composer — sticky to the bottom of the column */}
      {user && (
        <footer className="sticky bottom-0 z-30 mt-auto py-3 px-4" style={{ background: "color-mix(in srgb, var(--surface) 92%, transparent)", borderTop: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
          <div className="w-full flex flex-col gap-2">
            <div className="relative flex items-center gap-2 px-2">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Replying as</span>
              <button
                onClick={() => !thread?.myPseudonym && setShowIdentityModal((v) => !v)}
                className={`flex items-center gap-2 rounded-full px-2 py-1 pr-3 transition-all ${!thread?.myPseudonym ? "cursor-pointer hover:ring-2 hover:ring-primary/30" : ""}`}
                style={{ background: "var(--surface-hover)" }}
              >
                <div className="size-5 rounded-full ring-1 ring-primary flex items-center justify-center text-[10px] text-primary font-bold" style={{ background: "var(--surface)" }}>
                  {myPseudonym?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{myPseudonym || "Choose identity..."}</span>
                {!thread?.myPseudonym && (
                  <span className="material-symbols-outlined !text-[14px] transition-transform" style={{ color: "var(--text-muted)", transform: showIdentityModal ? "rotate(180deg)" : "rotate(0deg)" }}>expand_less</span>
                )}
              </button>

              {/* Inline Identity Dropdown */}
              {showIdentityModal && (
                <div className="absolute bottom-full left-0 mb-2 w-80 rounded-xl shadow-2xl p-3 z-50" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text-muted)" }}>Choose your thread identity</p>
                  <button
                    onClick={() => handleSelectIdentity(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-sm group"
                    style={{ background: identityChoice === true ? "color-mix(in srgb, var(--color-primary) 8%, var(--surface-hover))" : "var(--surface-hover)", border: identityChoice === true ? "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)" : "1px solid var(--border-subtle)" }}
                  >
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <span className="material-symbols-outlined !text-[18px]">badge</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{user.username || user.email.split("@")[0]}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Use real name</p>
                    </div>
                    {identityChoice === true && <span className="material-symbols-outlined text-primary !text-[18px]">check_circle</span>}
                  </button>
                  <button
                    onClick={() => handleSelectIdentity(false)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-sm group mt-2"
                    style={{ background: identityChoice === false ? "color-mix(in srgb, var(--color-accent-green) 8%, var(--surface-hover))" : "var(--surface-hover)", border: identityChoice === false ? "1px solid color-mix(in srgb, var(--color-accent-green) 30%, transparent)" : "1px solid var(--border-subtle)" }}
                  >
                    <div className="size-8 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green flex-shrink-0 group-hover:bg-accent-green/20 transition-colors">
                      <span className="material-symbols-outlined !text-[18px]">masks</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Stay Anonymous</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Random pseudonym for this thread</p>
                    </div>
                    {identityChoice === false && <span className="material-symbols-outlined text-accent-green !text-[18px]">check_circle</span>}
                  </button>
                </div>
              )}
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
              <button onClick={() => handleComment()} disabled={submitting || !newComment.trim()} className="h-12 w-12 flex items-center justify-center text-white rounded-xl transition-all active:scale-95 disabled:opacity-50" style={{ background: "var(--color-primary)" }}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}
