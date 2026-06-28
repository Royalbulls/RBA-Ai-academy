import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, ActionPayload, UserProfile } from "../types";
import { Send, Sparkles, User, HelpCircle, ArrowRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatInterfaceProps {
  onActionTriggered: (action: ActionPayload) => void;
  currentUser: UserProfile | null;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export default function ChatInterface({ onActionTriggered, currentUser, initialQuery, onClearInitialQuery }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const hr = new Date().getHours();
    const greeting = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    return [
      {
        id: "welcome",
        role: "model",
        text: `${greeting}! Welcome back, ${currentUser ? currentUser.name : "Partner"}. Ready to continue your business journey? How can I help you today?

I am your intelligent assistant. Let's make progress together:
• Draft & Apply for an SME Loan
• Manage clients on your CRM Kanban Board
• Practice Sales Pitch & objection handling drills
• Verify certifications and commission wallet balances`,
        timestamp: new Date(),
      }
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedCards, setSuggestedCards] = useState<string[]>([
    "Apply for Loan",
    "Open CRM Board",
    "Check Commission Wallet",
    "Start Sales Academy",
    "Mock Sales Role-Play",
    "SOP Knowledge Base",
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: textToSend, 
          history: historyPayload,
          currentUser: currentUser ? {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            isGuest: currentUser.isGuest
          } : null
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = await res.json();

      const modelMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "model",
        text: data.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, modelMsg]);

      if (data.suggestedCards && data.suggestedCards.length > 0) {
        setSuggestedCards(data.suggestedCards);
      }

      if (data.action && data.action.type && data.action.type !== "NONE") {
        onActionTriggered({
          type: data.action.type,
          data: data.action.data || {},
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          role: "model",
          text: "AI is temporarily unavailable.",
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-white">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              <span>RBA Intelligent Agent</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[10px] text-neutral-450 font-mono tracking-wider">SECURE CONNECT • MULTI-MODAL</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-4 max-w-[85%] ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border text-xs font-semibold ${
                m.role === "user"
                  ? "bg-white/10 border-white/15 text-white"
                  : "bg-gradient-to-tr from-emerald-600 to-teal-500 border-white/10 text-white shadow-lg"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4 text-neutral-300" /> : <Sparkles className="w-4 h-4 text-white animate-pulse" />}
            </div>
            
            <div className="space-y-1.5">
              <div
                className={`p-4 rounded-[1.75rem] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-white/10 text-white shadow-md border border-white/5"
                    : "bg-white/[0.04] border border-white/10 text-neutral-100 shadow-xl"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {m.text}
                </div>

                {m.isError && (
                  <button
                    type="button"
                    onClick={() => {
                      // Find last user message and retry
                      const userMsgs = messages.filter(msg => msg.role === "user");
                      if (userMsgs.length > 0) {
                        handleSend(userMsgs[userMsgs.length - 1].text);
                      } else {
                        handleSend("Hello");
                      }
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 border border-rose-500/30 rounded-xl text-[10px] font-bold transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Connection</span>
                  </button>
                )}
              </div>
              <p className="text-[9px] text-neutral-500 px-1 font-mono">
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 mr-auto max-w-[85%] animate-pulse">
            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-white/5 border border-white/10">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
            <div className="bg-white/[0.03] border border-white/5 text-neutral-200 p-4 rounded-[1.75rem] shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-emerald-400/80 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-emerald-400/80 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-emerald-400/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Cards */}
      {suggestedCards.length > 0 && (
        <div className="px-6 py-3 bg-white/[0.01] border-t border-white/5 overflow-x-auto">
          <div className="flex gap-2 whitespace-nowrap py-1">
            {suggestedCards.map((card, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(card)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-200 transition rounded-2xl text-xs font-semibold border border-white/10 shadow-sm shrink-0 cursor-pointer"
              >
                <span>{card}</span>
                <ArrowRight className="w-3 h-3 opacity-60 text-emerald-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2 items-center"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask RBA AI to draft loans, claim leads, or search SOPs..."
          className="flex-1 bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 text-white text-sm px-4 py-3.5 rounded-2xl border border-white/10 focus:border-emerald-500/50 outline-none transition font-medium placeholder:text-neutral-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition rounded-2xl text-white shadow-lg cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
