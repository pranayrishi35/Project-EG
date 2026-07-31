"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessagesSquare,
  Plus,
  Sparkles,
  MessageCircle,
  ShieldAlert,
  X,
  Loader2,
} from "lucide-react";
import {
  createDoubtPost,
  setUsername,
  type DoubtPostSummary,
  type ExamTrack,
} from "@/app/actions/doubtBoard";

const TRACKS: ExamTrack[] = ["AFCAT", "NDA", "CDS"];

export default function DoubtBoardClient({
  initialTrack,
  initialPosts,
  loadError,
  myHandle,
}: {
  initialTrack: ExamTrack;
  initialPosts: DoubtPostSummary[];
  loadError: string | null;
  myHandle: string | null;
}) {
  const router = useRouter();
  const [track, setTrack] = useState<ExamTrack>(initialTrack);
  const [showAsk, setShowAsk] = useState(false);
  const [handle, setHandle] = useState<string | null>(myHandle);

  function switchTrack(t: ExamTrack) {
    setTrack(t);
    router.push(`/doubts?track=${t}`);
  }

  return (
    <div className="flex flex-col gap-5 p-4 pt-6 pb-24 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-accent-500/15" aria-hidden="true">
            <MessagesSquare size={22} strokeWidth={1.9} className="text-brand-accent-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-ink-inverse">Doubt Board</h1>
            <p className="text-xs text-brand-ink-muted">
              Ask the community. Get an instant AI draft from Tejas.
            </p>
          </div>
        </div>
        <button
          type="button"
          id="ask-doubt-btn"
          onClick={() => setShowAsk(true)}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-brand-accent-500 px-4 py-2.5 text-sm font-bold text-brand-accent-ink transition-all hover:bg-brand-accent-400 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          Ask
        </button>
      </header>

      {/* Guidelines banner */}
      <Link
        href="/community-guidelines"
        className="flex items-center gap-2 rounded-xl border border-brand-border-subtle bg-brand-bg-elevated px-4 py-2.5 text-xs text-brand-ink-muted transition-colors hover:text-brand-ink-inverse"
      >
        <ShieldAlert size={15} strokeWidth={1.9} className="text-brand-accent-500 flex-shrink-0" aria-hidden="true" />
        This is a public, moderated space. Please read our community guidelines before posting.
      </Link>

      {/* Track tabs */}
      <div role="tablist" aria-label="Exam track" className="flex gap-2">
        {TRACKS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={track === t}
            onClick={() => switchTrack(t)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              track === t
                ? "bg-brand-accent-500/15 text-brand-accent-500"
                : "text-brand-ink-muted hover:bg-brand-bg-elevated"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Post list */}
      {initialPosts.length === 0 && !loadError ? (
        <EmptyState track={track} onAsk={() => setShowAsk(true)} />
      ) : (
        <ul className="flex flex-col gap-3">
          {initialPosts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      {showAsk && (
        <AskModal
          track={track}
          hasHandle={!!handle}
          onHandleSet={(h) => setHandle(h)}
          onClose={() => setShowAsk(false)}
          onPosted={(postId) => {
            setShowAsk(false);
            router.push(`/doubts/${postId}`);
          }}
        />
      )}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ track, onAsk }: { track: ExamTrack; onAsk: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-border-subtle py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-bg-elevated" aria-hidden="true">
        <MessagesSquare size={26} strokeWidth={1.6} className="text-brand-ink-muted" />
      </div>
      <div>
        <p className="font-bold text-brand-ink-inverse">No doubts yet for {track}</p>
        <p className="text-sm text-brand-ink-muted">Be the first to ask — Tejas will draft an answer instantly.</p>
      </div>
      <button
        type="button"
        onClick={onAsk}
        className="mt-1 inline-flex items-center gap-2 rounded-xl bg-brand-accent-500 px-4 py-2.5 text-sm font-bold text-brand-accent-ink hover:bg-brand-accent-400 active:scale-95"
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        Ask a doubt
      </button>
    </div>
  );
}

// ─── Post card ───────────────────────────────────────────────────────────────

function PostCard({ post }: { post: DoubtPostSummary }) {
  return (
    <Link
      href={`/doubts/${post.id}`}
      className="block rounded-2xl border border-brand-border-subtle bg-brand-bg-surface p-4 transition-colors hover:border-brand-accent-500/40"
    >
      <div className="mb-1.5 flex items-center gap-2 text-xs text-brand-ink-muted">
        <span className="rounded-md bg-brand-accent-500/10 px-1.5 py-0.5 font-semibold text-brand-accent-500">
          {post.examTrack}
        </span>
        {post.topic && <span className="truncate">· {post.topic}</span>}
        <span className="ml-auto flex-shrink-0">@{post.authorHandle}</span>
      </div>
      <h2 className="font-bold text-brand-ink-inverse leading-snug">{post.title}</h2>
      <p className="mt-1 line-clamp-2 text-sm text-brand-ink-muted">{post.body}</p>
      <div className="mt-2.5 flex items-center gap-3 text-xs text-brand-ink-muted">
        {post.hasAiDraft && (
          <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 font-semibold text-violet-500">
            <Sparkles size={11} strokeWidth={2.2} aria-hidden="true" /> AI draft
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <MessageCircle size={13} strokeWidth={1.9} aria-hidden="true" />
          {post.answerCount} {post.answerCount === 1 ? "answer" : "answers"}
        </span>
      </div>
    </Link>
  );
}

// ─── Ask modal (with username gate) ──────────────────────────────────────────

function AskModal({
  track,
  hasHandle,
  onHandleSet,
  onClose,
  onPosted,
}: {
  track: ExamTrack;
  hasHandle: boolean;
  onHandleSet: (h: string) => void;
  onClose: () => void;
  onPosted: (postId: string) => void;
}) {
  const [needsHandle, setNeedsHandle] = useState(!hasHandle);
  const [username, setUsernameInput] = useState("");
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitHandle() {
    setError(null);
    startTransition(async () => {
      const res = await setUsername(username);
      if (res.success) {
        onHandleSet(username);
        setNeedsHandle(false);
      } else {
        setError(res.error);
      }
    });
  }

  function submitPost() {
    setError(null);
    startTransition(async () => {
      const res = await createDoubtPost({ examTrack: track, topic, title, body });
      if (res.success) {
        onPosted(res.data.postId);
      } else if (res.error === "SET_USERNAME_REQUIRED") {
        setNeedsHandle(true);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-modal-title"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 id="ask-modal-title" className="text-lg font-black text-gray-900">
            {needsHandle ? "Choose a username" : `Ask an ${track} doubt`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {needsHandle ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              Pick a public username for the board. This is shown instead of your real name and
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              can't be changed later. 3–20 characters, letters, numbers or underscores.
            </p>
            <input
              value={username}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="e.g. afcat_ace_2026"
              maxLength={20}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-accent-500"
            />
            <button
              type="button"
              onClick={submitHandle}
              disabled={isPending || username.trim().length < 3}
              className="ep-btn-primary disabled:opacity-50"
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : "Save username"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="doubt-topic" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Topic (optional)
              </label>
              <input
                id="doubt-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quant, English, Current Affairs"
                maxLength={60}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-accent-500"
              />
            </div>
            <div>
              <label htmlFor="doubt-title" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Your question
              </label>
              <input
                id="doubt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarise your doubt in one line (min 10 chars)"
                maxLength={200}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-accent-500"
              />
            </div>
            <div>
              <label htmlFor="doubt-body" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Details
              </label>
              <textarea
                id="doubt-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Explain what you're stuck on (min 20 chars). Be specific."
                rows={5}
                maxLength={5000}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-accent-500"
              />
            </div>
            <p className="text-xs text-gray-400">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              Posts are public and moderated. Don't share personal contact details.
            </p>
            <button
              type="button"
              onClick={submitPost}
              disabled={isPending || title.trim().length < 10 || body.trim().length < 20}
              className="ep-btn-primary disabled:opacity-50"
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : "Post doubt"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
