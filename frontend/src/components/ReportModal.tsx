"use client";

import { useState } from "react";

const REPORT_REASONS = [
  "Spam or misleading",
  "Misinformation",
  "Hate speech or symbols",
  "Harassment or bullying",
  "Violence or harmful content",
  "Inappropriate content",
  "Other",
];

interface ReportModalProps {
  type: "thread" | "comment";
  onSubmit: (reason: string) => Promise<void>;
  onClose: () => void;
}

export default function ReportModal({ type, onSubmit, onClose }: ReportModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isOther = selected === "Other";
  const finalReason = isOther ? otherText.trim() : selected;
  const canSubmit = !!selected && (!isOther || otherText.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(finalReason!);
      setDone(true);
    } catch {
      // keep modal open so user sees it didn't work
    }
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-5xl" style={{ color: "var(--color-primary)" }}>check_circle</span>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Report submitted</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>We'll review it shortly.</p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Report {type === "thread" ? "Thread" : "Comment"}
              </h2>
              <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-black/10" style={{ color: "var(--text-muted)" }}>
                <span className="material-symbols-outlined !text-[20px]">close</span>
              </button>
            </div>

            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Why are you reporting this {type}?
            </p>

            <div className="flex flex-col gap-1.5">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelected(reason)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-colors"
                  style={selected === reason
                    ? { background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)" }
                    : { background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid transparent" }
                  }
                >
                  <span>{reason}</span>
                  {selected === reason && (
                    <span className="material-symbols-outlined !text-[18px] shrink-0">check</span>
                  )}
                </button>
              ))}
            </div>

            {isOther && (
              <textarea
                autoFocus
                placeholder="Describe the issue…"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full text-sm rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-primary/20"
                style={{ background: "var(--surface-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: "var(--color-primary)" }}
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
