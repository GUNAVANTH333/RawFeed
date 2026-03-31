"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "@/lib/api";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const router = useRouter();

  const handleClick = () => {
    if (!n.isRead) onRead(n.id);
    router.push(`/threads/${n.threadId}`);
  };

  const icon = n.type === "REPLY_TO_COMMENT" ? "reply" : "chat_bubble";
  const label =
    n.type === "REPLY_TO_COMMENT"
      ? `replied to your comment`
      : `commented on your thread`;

  return (
    <button
      onClick={handleClick}
      className="w-full text-left flex items-start gap-4 px-6 py-5 transition-all hover:opacity-90 active:scale-[0.99]"
      style={{
        background: n.isRead ? "transparent" : "color-mix(in srgb, var(--color-primary) 6%, var(--surface))",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Icon */}
      <div
        className="mt-0.5 size-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: n.isRead ? "var(--surface-hover)" : "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color: n.isRead ? "var(--text-muted)" : "var(--color-primary)" }}
        >
          {icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
          <span className="font-bold">{n.actorPseudonym}</span>
          {" "}{label}
        </p>
        <p className="text-sm mt-0.5 truncate font-medium" style={{ color: "var(--text-secondary)" }}>
          &ldquo;{n.threadTitle}&rdquo;
        </p>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{timeAgo(n.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!n.isRead && (
        <div className="mt-2 size-2 rounded-full flex-shrink-0" style={{ background: "var(--color-primary)" }} />
      )}
    </button>
  );
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) fetchNotifications();
  }, [authLoading, fetchNotifications]);

  const handleRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationRead(id).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsRead().catch(() => {});
  };

  if (authLoading || loading) {
    return (
      <main className="flex-1 flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>Loading...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: "var(--background)" }}>
        <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--text-muted)" }}>notifications</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Sign in to see notifications</h2>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>Stay updated with replies, mentions, and more</p>
        <Link href="/login" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto flex flex-col" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-2xl mx-auto flex flex-col min-h-full">
        {/* Header */}
        <header
          className="sticky top-0 z-10 backdrop-blur-md px-6 py-5 flex items-center justify-between"
          style={{ background: "color-mix(in srgb, var(--background) 92%, transparent)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--color-primary)" }}>
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Replies and comments on your content</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}
            >
              Mark all read
            </button>
          )}
        </header>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
            <span className="material-symbols-outlined text-6xl" style={{ color: "var(--text-muted)" }}>notifications_none</span>
            <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>No notifications yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>You&apos;re all caught up!</p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden mx-4 mt-4 shadow-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            {notifications.map((n) => (
              <NotificationItem key={n.id} n={n} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
