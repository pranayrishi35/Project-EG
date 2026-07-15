"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const { messages, status, append } = useChat({
    initialMessages: [
      { id: "init", role: "assistant", content: "Hi! I'm your ExamPilot AI Tutor. How can I help you study today?" }
    ] as any[],
    onError: (error) => {
      console.error("AI Tutor Error:", error);
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim() || isLoading) return;
    append({ role: 'user', content: input });
    setInput('');
  };

  return (
    <div className="print:hidden fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      <div 
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right mb-4 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none absolute bottom-0'
        }`}
        style={{ width: "min(calc(100vw - 2rem), 380px)", height: "min(calc(100vh - 8rem), 500px)" }}
      >
        {/* Header */}
        <div className="bg-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">🤖</div>
            <div>
              <h3 className="font-bold text-sm leading-tight">AI Tutor</h3>
              <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-semibold">Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center bg-indigo-700 hover:bg-indigo-800 rounded-full transition-colors active:scale-95">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth bg-slate-50/50">
          {(messages as any[]).map((msg, index) => (
            <div key={msg.id} className={`flex max-w-[85%] ${msg.role === "user" ? "self-end" : "self-start"}`}>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed overflow-hidden shadow-sm ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-br-sm" 
                  : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm prose prose-sm prose-slate prose-p:leading-snug prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
              }`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="self-start flex items-center gap-1.5 p-4 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm w-16">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={onFormSubmit} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your syllabus..."
            className="flex-1 bg-slate-100 text-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input?.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            ↑
          </button>
        </form>
      </div>

      {/* FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-800 text-white shadow-slate-800/30' : 'bg-indigo-600 text-white shadow-indigo-600/30'
        }`}
      >
        {isOpen ? '↓' : '🤖'}
      </button>

    </div>
  );
}
