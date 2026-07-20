"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Tejas — the in-app AI study wingman. Named after India's indigenous fighter
// jet. White-Label Protocol: the persona/identity is enforced server-side in
// /api/chat; this component only renders the "Tejas" brand, never the provider.
const GREETING =
  "Namaste, Pilot. I'm **Tejas**, your AI study wingman. 🛫\n\nAsk me to explain a concept, drill a topic, or map out a revision plan. Let's get you mission-ready.";

// Starter prompts shown on the empty state to give guests/users an instant
// on-ramp. Kept short so they fit the mobile chip row.
const QUICK_PROMPTS = [
  { label: "Explain a concept", prompt: "Explain the concept of relative velocity with a simple example." },
  { label: "Quiz me", prompt: "Give me 3 quick practice questions on Indian defense current affairs." },
  { label: "Revision tips", prompt: "Give me a high-yield revision strategy for the last 7 days before my exam." },
  { label: "Weak areas", prompt: "How do I improve my accuracy in the Numerical Ability section?" },
];

/** Pull rendered text out of either a v7 parts[] message or a legacy content string. */
function messageText(msg: any): string {
  if (msg?.parts && Array.isArray(msg.parts)) {
    const joined = msg.parts.map((p: any) => p?.text ?? "").join("");
    if (joined) return joined;
  }
  return msg?.content ?? "";
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const { messages, status, sendMessage, error, regenerate, stop } = useChat({
    // v7 UIMessages carry text in parts[], not a `content` string.
    messages: [
      { id: "init", role: "assistant", parts: [{ type: "text", text: GREETING }] },
    ] as any[],
    onError: (err) => {
      console.error("Tejas Error:", err);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  // Only the seeded greeting present → show the quick-prompt on-ramp.
  const showQuickPrompts = messages.length <= 1 && !isLoading && !error;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Focus the input when the panel opens so users can type immediately.
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Allow other parts of the app (e.g. the landing-page spotlight) to open
  // Tejas via a lightweight custom event, optionally seeding a first question.
  useEffect(() => {
    const open = (e: Event) => {
      setIsOpen(true);
      const seeded = (e as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (seeded) setTimeout(() => submit(seeded), 360);
    };
    window.addEventListener("tejas:open", open as EventListener);
    return () => window.removeEventListener("tejas:open", open as EventListener);
    // submit is stable enough for this one-shot listener; deps intentionally empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    // v7 sendMessage takes { text } and builds the user parts[] internally.
    sendMessage({ text: trimmed });
    setInput("");
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  return (
    <div className="print:hidden fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <div
        role="dialog"
        aria-label="Tejas AI study assistant"
        aria-hidden={!isOpen}
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right mb-4 ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none absolute bottom-0"
        }`}
        style={{ width: "min(calc(100vw - 2rem), 390px)", height: "min(calc(100vh - 8rem), 560px)" }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-4 text-white flex items-center justify-between shrink-0 overflow-hidden">
          {/* subtle radar sweep accent */}
          <div className="pointer-events-none absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/15 ring-1 ring-white/30 rounded-2xl flex items-center justify-center text-xl shadow-inner">
              🛩️
            </div>
            <div>
              <h3 className="font-black text-base leading-tight tracking-tight">Tejas</h3>
              <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Study Wingman
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close Tejas"
            className="relative z-10 w-8 h-8 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full transition-colors active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth bg-slate-50">
          {(messages as any[]).map((msg) => (
            <div key={msg.id} className={`flex max-w-[85%] ${msg.role === "user" ? "self-end" : "self-start"}`}>
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed overflow-hidden shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm prose prose-sm prose-slate max-w-none prose-p:leading-snug prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-indigo-700"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText(msg) || "..."}</ReactMarkdown>
                ) : (
                  messageText(msg) || "..."
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="self-start flex items-center gap-1.5 px-4 py-3.5 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}

          {/* Error state with retry */}
          {error && (
            <div className="self-start w-full bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-3">
              <span className="text-lg leading-none" aria-hidden="true">⚠️</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-red-700">Tejas lost signal for a moment.</p>
                <p className="text-[11px] text-red-600 mt-0.5">Check your connection or credits, then retry.</p>
                <button
                  onClick={() => regenerate()}
                  className="mt-2 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Quick-prompt on-ramp */}
          {showQuickPrompts && (
            <div className="mt-1 flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => submit(q.prompt)}
                    className="text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-sm"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={onFormSubmit} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Tejas about your syllabus..."
            aria-label="Message Tejas"
            className="flex-1 bg-slate-100 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={() => stop()}
              aria-label="Stop generating"
              className="w-10 h-10 flex items-center justify-center bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all active:scale-95"
            >
              ■
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              ↑
            </button>
          )}
        </form>
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close Tejas" : "Open Tejas, your AI study wingman"}
        aria-expanded={isOpen}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? "bg-slate-800 text-white shadow-slate-800/30" : "bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-indigo-600/40"
        }`}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-indigo-500/40 animate-ping" style={{ animationDuration: "2.5s" }} aria-hidden="true" />
        )}
        <span className="relative z-10">{isOpen ? "↓" : "🛩️"}</span>
      </button>
    </div>
  );
}
