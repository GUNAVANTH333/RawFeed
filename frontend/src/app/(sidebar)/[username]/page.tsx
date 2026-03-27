"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  getPublicProfile,
  getUserThreads,
  likeThread,
  updateProfile,
  type User,
  type Thread,
  type Pagination,
} from "@/lib/api";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ProfilePage() {
  const params = useParams();
  const username = Array.isArray(params.username) ? params.username[0] : params.username;

  const { user: currentUser, refreshProfile } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const isMyProfile = currentUser?.username === profileUser?.username;

  // Initial Data Fetch
  useEffect(() => {
    if (!username) return;

    setProfileLoading(true);
    getPublicProfile(username)
      .then((data) => {
        setProfileUser(data.user);
        setEditBio(data.user.bio || "");
        setEditPhoto(data.user.profilePhoto || "");
      })
      .catch((err) => {
        setProfileError(err.message || "User not found");
      })
      .finally(() => setProfileLoading(false));

    setThreadsLoading(true);
    getUserThreads(username, 1, 20)
      .then((data) => {
        setThreads(data.threads);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setThreadsLoading(false));
  }, [username]);

  const handleLike = useCallback(
    async (e: React.MouseEvent, threadId: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!currentUser) {
        alert("Please sign in to like threads.");
        return;
      }

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
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, isLiked: liked, likeCount } : t))
        );
      } catch {
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
    },
    [currentUser]
  );

  const handleSaveProfile = async () => {
    setSavingSettings(true);
    try {
      const data = await updateProfile({
        bio: editBio.trim() || null,
        profilePhoto: editPhoto.trim() || null,
      });
      setProfileUser(data.user);
      setIsEditing(false);
      await refreshProfile();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingSettings(false);
    }
  };

  if (profileLoading) {
    return (
      <main className="flex-1 flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="animate-pulse flex flex-col items-center gap-4 text-primary">
          <div className="size-16 rounded-full bg-current/20"></div>
          <div className="h-6 w-32 rounded bg-current/20"></div>
        </div>
      </main>
    );
  }

  if (profileError || !profileUser) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: "var(--background)" }}>
        <span className="material-symbols-outlined text-6xl text-red-500">error</span>
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Profile Not Found</h2>
        <p style={{ color: "var(--text-secondary)" }}>{profileError || "The requested user does not exist."}</p>
        <Link href="/" className="text-primary hover:underline font-medium mt-4">Return Home</Link>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
      {/* Profile Header */}
      <section className="relative px-6 py-12 md:px-12 md:py-16" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          {/* Avatar Area */}
          <div className="relative shrink-0 flex items-center justify-center mb-6 md:mb-0">
            {profileUser.profilePhoto ? (
              <img
                src={profileUser.profilePhoto}
                alt={`${profileUser.username}'s profile`}
                className="size-28 md:size-36 rounded-full object-cover shadow-lg ring-[3px]"
                style={{ "--tw-ring-color": "var(--border-subtle)" } as React.CSSProperties}
              />
            ) : (
              <div
                className="size-28 md:size-36 rounded-full shadow-lg ring-[3px] flex items-center justify-center relative overflow-hidden"
                style={{ background: "var(--surface-hover)", "--tw-ring-color": "var(--border-subtle)" } as React.CSSProperties}
              >
                <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,_#818CF8_0%,_#C084FC_50%,_#818CF8_100%)] opacity-80"></div>
                <span className="relative text-5xl md:text-6xl font-bold text-white uppercase tracking-wider drop-shadow-md">
                  {profileUser.username[0]}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center items-center md:items-start text-center md:text-left">
            {/* Username & Edit Button Row */}
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black truncate tracking-tight" style={{ color: "var(--text-primary)" }}>
                {profileUser.username}
              </h1>
              {isMyProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 border"
                  style={{ color: "var(--text-primary)", borderColor: "var(--border-subtle)", background: "var(--surface)" }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Joined Date */}
            <span className="text-xs font-semibold mb-5 opacity-60 uppercase tracking-widest inline-block" style={{ color: "var(--text-secondary)" }}>
              Joined {new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </span>

            {/* Editing Form or Bio */}
            {isEditing ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 w-full max-w-lg">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full text-sm rounded-lg px-4 py-3 outline-none resize-none transition-all"
                    style={{ background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                    placeholder="Tell everyone a little about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Profile Photo URL</label>
                  <input
                    type="url"
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    className="w-full text-sm rounded-lg px-4 py-3 outline-none transition-all"
                    style={{ background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingSettings}
                    className="px-6 py-2 rounded-lg font-bold text-sm bg-primary hover:bg-primary-dark text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {savingSettings ? "Saving..." : "Save Profile"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditBio(profileUser.bio || "");
                      setEditPhoto(profileUser.profilePhoto || "");
                    }}
                    className="px-6 py-2 rounded-lg font-bold text-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1 max-w-2xl w-full">
                {profileUser.bio ? (
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)", opacity: 0.9 }}>
                    {profileUser.bio}
                  </p>
                ) : (
                  <p className="text-sm italic opacity-50" style={{ color: "var(--text-secondary)" }}>No bio provided yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* User Threads Feed */}
      <section className="px-6 py-8 md:px-12 md:py-12 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
          <span className="material-symbols-outlined text-primary">forum</span>
          Threads by {profileUser.username}
        </h3>

        {threadsLoading ? (
            <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse h-32" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}></div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-xl border border-dashed" style={{ borderColor: "var(--border-subtle)", background: "color-mix(in srgb, var(--surface) 50%, transparent)" }}>
            <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "var(--text-muted)" }}>history_edu</span>
            <p className="font-medium text-lg" style={{ color: "var(--text-secondary)" }}>No threads found</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>This user hasn't posted anything yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {threads.map((thread) => (
              <Link key={thread.id} href={`/threads/${thread.id}`}>
                <article
                  className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col sm:flex-row group"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
                >
                  {thread.imageUrl && (
                    <div
                      className="h-40 sm:h-auto sm:w-48 bg-cover bg-center shrink-0 border-b sm:border-b-0 sm:border-r border-black/10 dark:border-white/10"
                      style={{ backgroundImage: `url('${thread.imageUrl}')` }}
                    ></div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <h4 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2" style={{ color: "var(--text-primary)" }}>
                      {thread.title}
                    </h4>
                    {thread.url && (
                      <p className="text-xs line-clamp-1 mb-3" style={{ color: "var(--text-muted)" }}>
                        {thread.url}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-auto pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center gap-1.5 transition-colors" style={{ color: thread.isLiked ? "var(--color-primary)" : "var(--text-muted)" }}>
                        <span className={`material-symbols-outlined text-[16px] ${thread.isLiked ? "fill-1" : ""}`}>favorite</span>
                        <span className="text-xs font-medium">{thread.likeCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                        <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                        <span className="text-xs font-medium">{thread._count?.comments || 0}</span>
                      </div>
                      <span className="text-xs font-medium ml-auto" style={{ color: "var(--text-muted)" }}>{timeAgo(thread.createdAt)}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {pagination && pagination.page < pagination.totalPages && (
          <div className="flex justify-center py-8">
            <button className="text-sm font-semibold px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
              Load More
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
