import React, { useState } from "react";
import { Search, MessageSquare, Pin, Edit2, Trash2, Calendar, Clock, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";

interface Conversation {
  id: string;
  title: string;
  isPinned?: boolean;
  messages: ChatMessage[];
  updatedAt: any;
}

interface ChatHistoryListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onPinConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
}

export default function ChatHistoryList({
  conversations,
  activeId,
  onSelectConversation,
  onPinConversation,
  onRenameConversation,
  onDeleteConversation,
}: ChatHistoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Helper to categorize conversations by relative date
  const getRelativeCategory = (dateInput: any): string => {
    if (!dateInput) return "Older Workspaces";
    
    let date: Date;
    if (dateInput.toDate && typeof dateInput.toDate === "function") {
      date = dateInput.toDate();
    } else {
      date = new Date(dateInput);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return "Last 7 Days";
    return "Older Workspaces";
  };

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations
  const groups: { [key: string]: Conversation[] } = {
    "Today": [],
    "Yesterday": [],
    "Last 7 Days": [],
    "Older Workspaces": [],
  };

  filtered.forEach((c) => {
    const groupName = getRelativeCategory(c.updatedAt);
    if (groups[groupName]) {
      groups[groupName].push(c);
    } else {
      groups["Older Workspaces"].push(c);
    }
  });

  const hasAnyChats = filtered.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4 px-4 md:px-0">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>Workspace History</span>
          </h2>
          <p className="text-xs text-neutral-400">Search and manage your dynamic AI learning and coaching sessions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter workspace conversations by title..."
          className="w-full bg-white/5 border border-white/10 hover:border-white/15 focus:border-emerald-500/50 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-white outline-none transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-neutral-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grouped Threads */}
      <div className="space-y-6">
        {hasAnyChats ? (
          Object.entries(groups).map(([groupName, list]) => {
            if (list.length === 0) return null;
            return (
              <div key={groupName} className="space-y-2.5">
                <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{groupName}</span>
                </h4>

                <div className="grid grid-cols-1 gap-2">
                  <AnimatePresence>
                    {list.map((c) => {
                      const isActive = activeId === c.id;
                      const isEditing = editingId === c.id;
                      const msgCount = c.messages ? c.messages.length : 0;

                      return (
                        <motion.div
                          key={c.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`group rounded-2xl border transition duration-200 p-4 flex items-center justify-between gap-4 ${
                            isActive
                              ? "bg-white/[0.04] border-emerald-500/30 text-white shadow-lg"
                              : "bg-white/[0.01] hover:bg-white/[0.03] border-white/5 text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 overflow-hidden flex-1">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-neutral-400"
                            }`}>
                              <MessageSquare className="w-4 h-4" />
                            </div>

                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="bg-neutral-900 border border-emerald-500/30 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none font-bold w-full focus:ring-1 focus:ring-emerald-500"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (editValue.trim()) {
                                      onRenameConversation(c.id, editValue.trim());
                                    }
                                    setEditingId(null);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(null);
                                  }}
                                  className="px-2.5 py-1.5 bg-white/5 text-neutral-400 rounded-lg text-[10px] hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div
                                className="space-y-1 truncate flex-1 cursor-pointer"
                                onClick={() => onSelectConversation(c.id)}
                              >
                                <span className="font-bold text-sm text-neutral-100 group-hover:text-white transition block truncate">
                                  {c.title}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                                  <span>{msgCount} messages</span>
                                  <span>•</span>
                                  <span>
                                    {c.updatedAt?.toDate
                                      ? c.updatedAt.toDate().toLocaleDateString()
                                      : new Date(c.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {!isEditing && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition duration-150">
                              <button
                                onClick={() => onPinConversation(c.id)}
                                className={`p-2 rounded-lg border transition cursor-pointer ${
                                  c.isPinned
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-white/5 border-white/5 hover:border-white/10 text-neutral-400 hover:text-white"
                                }`}
                                title={c.isPinned ? "Unpin thread" : "Pin thread"}
                              >
                                <Pin className={`w-3.5 h-3.5 ${c.isPinned ? "fill-current" : ""}`} />
                              </button>

                              <button
                                onClick={() => {
                                  setEditValue(c.title);
                                  setEditingId(c.id);
                                }}
                                className="p-2 bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
                                title="Rename workspace"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onDeleteConversation(c.id)}
                                className="p-2 bg-white/5 border border-white/5 hover:border-rose-500/10 rounded-lg text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                                title="Delete workspace"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onSelectConversation(c.id)}
                                className="p-2 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-white rounded-lg transition ml-1 cursor-pointer"
                                title="Open chat"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 bg-white/[0.01] border border-white/5 rounded-[2.5rem] text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-neutral-500 mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                {searchQuery ? "No matching conversations" : "No conversation history"}
              </h3>
              <p className="text-xs text-neutral-400">
                {searchQuery
                  ? "Try searching for alternative keywords or reset the filter."
                  : "All your future AI chats, certification explanations, and coaching simulations will be archived securely right here."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
