import React, { useState, useEffect, useRef } from "react";
import { Search, X, MessageSquare, GraduationCap, Briefcase, Landmark, CornerDownLeft, Clock } from "lucide-react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../lib/firebase";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string } | null;
  conversations: any[];
  onSelectResult: (tab: string, subTab?: string, id?: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "conversation" | "academy" | "loan" | "lead" | "service";
  tab: string;
  subTab?: string;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  currentUser,
  conversations,
  onSelectResult,
}: GlobalSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchTerm("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle live search
  useEffect(() => {
    if (!searchTerm.trim() || !currentUser) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      const queryLower = searchTerm.toLowerCase();
      const matched: SearchResult[] = [];

      // 1. Search conversations
      conversations.forEach((conv) => {
        if (conv.title.toLowerCase().includes(queryLower)) {
          matched.push({
            id: conv.id,
            title: conv.title,
            subtitle: "AI Personal Space Conversation",
            type: "conversation",
            tab: "ai",
          });
        }
      });

      // 2. Search Academy
      const courses = [
        { id: "course_loan", title: "Loan Advisor Academy", subtitle: "Academy course curriculum" },
        { id: "course_consult", title: "Business Consultant Academy", subtitle: "Academy course curriculum" },
        { id: "course_ai", title: "AI Business Academy", subtitle: "Academy course curriculum" },
      ];
      courses.forEach((c) => {
        if (c.title.toLowerCase().includes(queryLower)) {
          matched.push({
            id: c.id,
            title: c.title,
            subtitle: c.subtitle,
            type: "academy",
            tab: "academy",
          });
        }
      });

      // 3. Search RBA Services
      const services = [
        { id: "commercial_loan", title: "Commercial Business Loan Funding", category: "Corporate Funding" },
        { id: "sip_wealth", title: "Mutual Fund SIP & Portfolio Wealth Management", category: "Wealth Planning" },
        { id: "gst_incorporation", title: "Corporate GST Registration & Firm Incorporation", category: "Compliance Setup" },
        { id: "ai_workflow", title: "AI Enterprise Workflows & Automation Agents", category: "AI Integrations" },
      ];
      services.forEach((s) => {
        if (s.title.toLowerCase().includes(queryLower) || s.category.toLowerCase().includes(queryLower)) {
          matched.push({
            id: s.id,
            title: s.title,
            subtitle: `RBA Service: ${s.category}`,
            type: "service",
            tab: "rba_services",
          });
        }
      });

      // 4. Query Loans from Firestore
      try {
        const loansRef = collection(db, "loans");
        const loansQuery = query(loansRef, where("userId", "==", currentUser.id));
        const snap = await getDocs(loansQuery);
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const label = `${d.type || "Personal"} Loan Application`;
          if (label.toLowerCase().includes(queryLower) || (d.status || "").toLowerCase().includes(queryLower)) {
            matched.push({
              id: docSnap.id,
              title: label,
              subtitle: `Business OS: Loan Status: ${(d.status || "").toUpperCase()} (INR ${(d.amountRequested || 0).toLocaleString()})`,
              type: "loan",
              tab: "business_os",
              subTab: "loans",
            });
          }
        });
      } catch (err) {
        console.warn("Failed to index loans for search:", err);
      }

      setResults(matched);
      setSelectedIndex(0);
      setSearching(false);
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, currentUser, conversations]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        const sel = results[selectedIndex];
        onSelectResult(sel.tab, sel.subTab, sel.id);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm" onClick={onClose} />

      {/* Search Console */}
      <div className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[480px]">
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-5 border-b border-white/10 py-4.5 shrink-0">
          <Search className="w-5 h-5 text-emerald-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search threads, academy courses, loans, corporate services..."
            className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-neutral-500 font-bold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-3">
          {searching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Indexing operational database...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((res, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={`${res.type}-${res.id}`}
                    onClick={() => {
                      onSelectResult(res.tab, res.subTab, res.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left p-4.5 rounded-2xl flex items-center justify-between gap-4 transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.05] border border-white/10"
                        : "bg-transparent border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                        res.type === "conversation" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" :
                        res.type === "academy" ? "bg-amber-500/10 border-amber-500/25 text-amber-400" :
                        res.type === "service" ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400" :
                        "bg-teal-500/10 border-teal-500/25 text-teal-400"
                      }`}>
                        {res.type === "conversation" && <MessageSquare className="w-4 h-4" />}
                        {res.type === "academy" && <GraduationCap className="w-4 h-4" />}
                        {res.type === "service" && <Landmark className="w-4 h-4" />}
                        {(res.type === "loan" || res.type === "lead") && <Briefcase className="w-4 h-4" />}
                      </div>

                      <div className="overflow-hidden space-y-0.5">
                        <span className="font-extrabold text-xs text-neutral-100 block truncate group-hover:text-white">
                          {res.title}
                        </span>
                        <span className="text-[10px] font-medium text-neutral-400 block truncate">
                          {res.subtitle}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1.5 font-bold shrink-0">
                        <span>SELECT</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : searchTerm.trim() ? (
            <div className="py-12 text-center space-y-2">
              <span className="text-3xl">🕵️</span>
              <p className="text-xs font-bold text-neutral-400">No matching records found</p>
              <p className="text-[10px] text-neutral-500 max-w-xs mx-auto">
                Ensure you are typing exact keywords like "Loan", "Objection", "SIP", or your custom workspace title.
              </p>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="flex justify-center gap-2 text-neutral-500 text-xs">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-wider">Quick Suggestions</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-sm mx-auto">
                {["Loan Advisor", "Mutual Fund", "GST", "Enterprise Automation"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-neutral-300 hover:text-white transition cursor-pointer"
                  >
                    "{tag}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-3.5 bg-neutral-950/50 border-t border-white/5 flex items-center justify-between text-[9px] font-mono font-black tracking-wider text-neutral-500 uppercase shrink-0">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
