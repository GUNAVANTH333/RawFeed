"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeProvider";
import { getNotifications } from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = user?.username
    ? user.username[0].toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setUnreadCount(data.unreadCount);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchUnread();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Reset badge when user visits notifications page
  useEffect(() => {
    if (pathname === "/notifications") setUnreadCount(0);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/new-thread", label: "New Thread", icon: "add_box" },
    { href: "/notifications", label: "Notifications", icon: "notifications", badge: unreadCount },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 flex-shrink-0 h-full"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-none tracking-tight" style={{ color: "var(--text-primary)" }}>
            RawFeed
          </h1>
          <p className="text-primary text-xs font-medium mt-1">Verified Sources</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
              style={isActive
                ? { background: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }
                : { color: "var(--text-secondary)" }
              }
            >
              <span className="relative">
                <span className={`material-symbols-outlined text-[24px] ${isActive ? "fill-1" : ""}`}>
                  {item.icon}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1"
                    style={{ background: "var(--color-primary)", lineHeight: 1 }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-2 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full hover:text-primary"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="material-symbols-outlined text-[24px]">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span className="text-sm font-medium">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:text-primary"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="material-symbols-outlined text-[24px]">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>

      <div className="p-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {user ? (
          <Link href={`/${user.username}`} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.username} className="size-8 rounded-full object-cover" />
            ) : (
              <div className="size-8 rounded-full bg-sky-200 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 opacity-50 bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-sky-900 via-sky-500 to-sky-900"></div>
                <span className="relative text-xs font-bold" style={{ color: "var(--text-primary)" }}>{initials}</span>
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>{user.username || user.email.split("@")[0]}</span>
              <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</span>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
