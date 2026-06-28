import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Mic, Image, Paperclip, Copy, RotateCcw, ArrowRight, Check, Pin, Trash2, Edit2, Play, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, ActionPayload, UserProfile } from "../types";

interface Conversation {
  id: string;
  title: string;
  isPinned?: boolean;
  messages: ChatMessage[];
  updatedAt: any;
}

interface AiChatWorkspaceProps {
  currentUser: UserProfile | null;
  activeConversation: Conversation | null;
  onSendMessage: (text: string, image?: string, file?: string) => Promise<void>;
  onPinConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onStartNewChat: () => void;
  loading: boolean;
}

export default function AiChatWorkspace({
  currentUser,
  activeConversation,
  onSendMessage,
  onPinConversation,
  onRenameConversation,
  onDeleteConversation,
  onStartNewChat,
  loading,
}: AiChatWorkspaceProps) {
  const [input, setInput] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Simulated Voice Input state
  const [isListening, setIsListening] = useState(false);
  const [voiceWaveform, setVoiceWaveform] = useState<number[]>([10, 20, 10, 30, 15]);

  // Simulated Attachments
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, loading]);

  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setVoiceWaveform(Array.from({ length: 8 }, () => Math.floor(Math.random() * 40) + 10));
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !attachedImage && !attachedFileName) return;

    onSendMessage(input.trim(), attachedImage || undefined, attachedFileName || undefined);
    setInput("");
    setAttachedImage(null);
    setAttachedFileName(null);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    // Find the last user message
    const userMessages = activeConversation.messages.filter(m => m.role === "user");
    if (userMessages.length > 0) {
      const lastUserMsg = userMessages[userMessages.length - 1];
      onSendMessage(lastUserMsg.text);
    }
  };

  const handleContinueWriting = () => {
    onSendMessage("Continue writing the details in a comprehensive manner.");
  };

  const startVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      setInput("What are the criteria to earn an RBA Advisor Certificate?");
    } else {
      setIsListening(true);
      setErrorState("");
    }
  };

  const triggerMockImageUpload = () => {
    setAttachedImage("https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&auto=format&fit=crop");
  };

  const triggerMockFileUpload = () => {
    setAttachedFileName("royal_bulls_advisory_sop_guideline.pdf");
  };

  const [errorState, setErrorState] = useState("");

  // Custom Markdown parser to render clean structured paragraphs, code snippets, lists, and headers
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    // Split text into lines
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // 1. Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={index} className="text-sm font-black text-white mt-4 mb-2 tracking-tight">
            {line.substring(4)}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={index} className="text-base font-black text-white mt-5 mb-2.5 tracking-tight border-b border-white/5 pb-1">
            {line.substring(3)}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={index} className="text-lg font-black text-emerald-400 mt-6 mb-3 tracking-tight">
            {line.substring(2)}
          </h2>
        );
      }

      // 2. Unordered lists
      if (line.startsWith("• ") || line.startsWith("* ") || line.startsWith("- ")) {
        const cleanContent = line.replace(/^[•*\-]\s+/, "");
        // Bold formatting parse e.g. **text**
        return (
          <li key={index} className="ml-4 pl-1 list-disc text-neutral-300 text-xs leading-relaxed my-1">
            {parseBoldText(cleanContent)}
          </li>
        );
      }

      // 3. Ordered lists
      if (/^\d+\.\s+/.test(line)) {
        const cleanContent = line.replace(/^\d+\.\s+/, "");
        return (
          <li key={index} className="ml-4 pl-1 list-decimal text-neutral-300 text-xs leading-relaxed my-1">
            {parseBoldText(cleanContent)}
          </li>
        );
      }

      // 4. Empty lines
      if (!line.trim()) {
        return <div key={index} className="h-2" />;
      }

      // 5. Standard paragraph
      return (
        <p key={index} className="text-neutral-300 text-xs leading-relaxed my-1.5 font-sans">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Helper to parse double asterisks **text** into bold html elements
  const parseBoldText = (str: string) => {
    const parts = str.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-white">{part}</strong>;
      }
      return part;
    });
  };

  const suggestedPrompts = [
    "What is the RBA Advisor certification program?",
    "Explain personal loan eligibility requirements in detail.",
    "Draft a corporate consulting sales letter for RBA.",
    "Practice: Objections about processing timelines."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Chat Title / Options Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        {activeConversation ? (
          <div className="flex items-center gap-3 w-full max-w-lg">
            <button
              onClick={() => onPinConversation(activeConversation.id)}
              className={`p-2 rounded-xl transition ${
                activeConversation.isPinned
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white"
              }`}
              title={activeConversation.isPinned ? "Unpin Workspace" : "Pin Workspace"}
            >
              <Pin className={`w-4 h-4 ${activeConversation.isPinned ? "fill-current" : ""}`} />
            </button>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  className="bg-neutral-900 border border-emerald-500/30 text-white rounded-lg px-3 py-1.5 text-xs outline-none font-bold w-full focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (editTitleValue.trim()) {
                      onRenameConversation(activeConversation.id, editTitleValue.trim());
                    }
                    setIsEditingTitle(false);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group max-w-xs md:max-w-md">
                <h3 className="font-bold text-white text-sm tracking-tight truncate">
                  {activeConversation.title}
                </h3>
                <button
                  onClick={() => {
                    setEditTitleValue(activeConversation.title);
                    setIsEditingTitle(true);
                  }}
                  className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                  title="Rename workspace"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                <span>RBA Personal Workspace</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[10px] text-neutral-550 font-mono">24/7 AI TUTOR & COACH</p>
            </div>
          </div>
        )}

        {/* Start New Conversation button */}
        <div className="flex items-center gap-2">
          {activeConversation && (
            <button
              onClick={() => onDeleteConversation(activeConversation.id)}
              className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/10 transition cursor-pointer"
              title="Delete workspace"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onStartNewChat}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Console */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {activeConversation && activeConversation.messages.length > 0 ? (
          activeConversation.messages.map((m, index) => (
            <div
              key={m.id || index}
              className={`flex gap-4 max-w-[85%] ${
                m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border text-xs font-semibold ${
                  m.role === "user"
                    ? "bg-white/10 border-white/15 text-white"
                    : "bg-emerald-950 border-emerald-500/20 text-emerald-300 shadow-lg"
                }`}
              >
                {m.role === "user" ? "U" : <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />}
              </div>
              
              <div className="space-y-1.5 flex-1 min-w-0">
                <div
                  className={`p-4 rounded-[1.75rem] ${
                    m.role === "user"
                      ? "bg-white/[0.06] text-white shadow-md border border-white/5 rounded-tr-sm"
                      : "bg-white/[0.02] border border-white/5 text-neutral-100 shadow-xl rounded-tl-sm"
                  }`}
                >
                  <div className="space-y-1">
                    {renderFormattedText(m.text)}
                  </div>

                  {/* Actions for Model replies */}
                  {m.role === "model" && (
                    <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                      <button
                        onClick={() => handleCopy(m.id || `msg_${index}`, m.text)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 text-neutral-400 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === (m.id || `msg_${index}`) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {index === activeConversation.messages.length - 1 && (
                        <>
                          <button
                            onClick={handleRegenerate}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 text-neutral-400 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Regenerate reply"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Regenerate</span>
                          </button>
                          <button
                            onClick={handleContinueWriting}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 text-neutral-400 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Continue Writing</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-neutral-550 px-1 font-mono">
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </p>
              </div>
            </div>
          ))
        ) : (
          /* Landing screen inside empty chat */
          <div className="h-full flex flex-col justify-center items-center text-center max-w-xl mx-auto space-y-8 pt-8">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center animate-bounce">
              <Sparkles className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">How can I help you grow today?</h2>
              <p className="text-xs text-neutral-400 max-w-sm">
                Ask about loan advisory courses, query client handling strategies, or ask any business formulation questions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(p)}
                  className="p-4 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 rounded-2xl text-left text-xs text-neutral-300 font-bold hover:text-white transition cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex gap-4 mr-auto max-w-[85%] animate-pulse">
            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-white/5 border border-white/10">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
            <div className="bg-white/[0.02] border border-white/5 text-neutral-200 p-4 rounded-[1.75rem] shadow-sm">
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

      {/* Voice listening waves */}
      {isListening && (
        <div className="absolute inset-x-0 bottom-[5.5rem] bg-emerald-950/95 border-t border-emerald-500/30 py-4 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">Listening to your voice...</p>
              <p className="text-[10px] text-emerald-400 font-mono">Speak clearly. Tap Mic to finish</p>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 px-4">
            {voiceWaveform.map((h, i) => (
              <div
                key={i}
                className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Attachments preview tray */}
      {(attachedImage || attachedFileName) && (
        <div className="px-6 py-2.5 bg-neutral-900 border-t border-white/5 flex gap-3 flex-wrap">
          {attachedImage && (
            <div className="relative rounded-xl overflow-hidden border border-white/10 h-14 w-14 shrink-0 group">
              <img src={attachedImage} className="h-full w-full object-cover" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-rose-400 text-[10px] font-bold"
              >
                Remove
              </button>
            </div>
          )}
          {attachedFileName && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-neutral-300">
              <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-mono truncate max-w-[200px]">{attachedFileName}</span>
              <button
                onClick={() => setAttachedFileName(null)}
                className="text-neutral-500 hover:text-white font-extrabold text-[10px] ml-1.5"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input console */}
      <form onSubmit={handleSend} className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2 items-center relative">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={triggerMockImageUpload}
            className="p-3 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
            title="Attach image (mock)"
          >
            <Image className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={triggerMockFileUpload}
            className="p-3 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
            title="Attach document (mock)"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask RBA AI workspace anything..."
          className="flex-1 bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 text-white text-xs px-4 py-3.5 rounded-2xl border border-white/10 focus:border-emerald-500/50 outline-none transition font-medium placeholder:text-neutral-500"
          disabled={isListening}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startVoiceInput}
            className={`p-3 rounded-2xl transition cursor-pointer ${
              isListening ? "bg-emerald-600 text-white animate-pulse" : "text-neutral-500 hover:text-white hover:bg-white/5"
            }`}
            title="Voice input"
          >
            <Mic className="w-4.5 h-4.5" />
          </button>

          <button
            type="submit"
            disabled={(!input.trim() && !attachedImage && !attachedFileName) || loading}
            className="p-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 transition rounded-2xl text-white shadow-lg cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
