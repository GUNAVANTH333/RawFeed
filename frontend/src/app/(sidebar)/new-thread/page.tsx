"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { createThread } from "@/lib/api";
import Link from "next/link";

export default function NewThreadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>Loading...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: "var(--background)" }}>
        <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--text-muted)" }}>lock</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Sign in to create a thread</h2>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>You need to be logged in to start a discussion</p>
        <Link href="/login" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Sign In
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await createThread({ title: title.trim() });
      router.push(`/threads/${result.thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex justify-center py-12 px-6 overflow-y-auto" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl w-full">
        <header className="mb-8">
          <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Create a New Thread</h2>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>Start a discussion on any topic you want to share with the community.</p>
        </header>

        <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                {error}
              </div>
            )}

            {/* Thread Title */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold" style={{ color: "var(--text-secondary)" }}>Thread Title</label>
                <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{title.length} / 100</span>
              </div>
              <input
                className="w-full rounded-lg px-4 py-4 text-sm outline-none"
                style={{ background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                placeholder="What do you want to discuss?"
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Content / Description */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold" style={{ color: "var(--text-secondary)" }}>Description (Optional)</label>
                <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{content.length} / 500</span>
              </div>
              <textarea
                className="w-full rounded-lg px-4 py-4 text-sm outline-none resize-none"
                style={{ background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                placeholder="Add more details to your thread..."
                rows={4}
                maxLength={500}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Action Bar */}
            <div className="pt-6 flex items-center justify-end" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <button
                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                type="submit"
                disabled={submitting || !title.trim()}
              >
                {submitting ? "Posting..." : "Post Thread"}
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
