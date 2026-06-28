import React, { useState } from "react";
import { Sparkles, MessageSquare, GraduationCap, Pin, Search, ArrowRight, BookOpen, Trophy, Briefcase, Landmark } from "lucide-react";
import { motion } from "motion/react";
import { Course } from "../types";

interface Conversation {
  id: string;
  title: string;
  updatedAt: any;
  isPinned?: boolean;
}

interface HomeWorkspaceProps {
  userName: string;
  recentConversations: Conversation[];
  pinnedConversations: Conversation[];
  courses: Course[];
  completedCourseIds: string[];
  onSelectConversation: (id: string) => void;
  onStartNewChatWithPrompt: (prompt: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export default function HomeWorkspace({
  userName,
  recentConversations,
  pinnedConversations,
  courses,
  completedCourseIds,
  onSelectConversation,
  onStartNewChatWithPrompt,
  onNavigateToTab,
}: HomeWorkspaceProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onStartNewChatWithPrompt(prompt.trim());
    setPrompt("");
  };

  const suggestedQuestions = [
    { text: "What is the role of a certified Loan Advisor?", category: "Finance", icon: "💰" },
    { text: "How do I build an AI automation workflow for my business?", category: "AI Automation", icon: "🤖" },
    { text: "Practice handles objection: 'Your interest rates are too high!'", category: "Practice Roleplay", icon: "💬" },
    { text: "Explain GST filing structures for corporate consulting.", category: "Business", icon: "📈" },
  ];

  // Calculate learning progress stats
  const totalLessonsCount = courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const completedLessonsCount = completedCourseIds.length * 2 + 1; // Simulated completed lessons count
  const percentComplete = Math.min(100, Math.round((completedLessonsCount / (totalLessonsCount || 1)) * 100)) || 35;

  return (
    <div className="space-y-10 max-w-4xl mx-auto py-6 px-4 md:px-0">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 pt-4"
        id="home-welcome-header"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          <span>Welcome back, {userName}</span>
        </h1>
        <p className="text-lg text-neutral-400 font-medium">
          What would you like to learn or accomplish today?
        </p>
      </motion.div>

      {/* Massive AI Input Box */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        id="home-ai-input-container"
      >
        <form
          onSubmit={handleSubmit}
          className="relative bg-white/[0.04] hover:bg-white/[0.06] focus-within:bg-white/[0.07] border border-white/10 focus-within:border-emerald-500/50 rounded-[2.5rem] p-2 transition duration-300 shadow-2xl flex items-center gap-2"
        >
          <div className="pl-4 text-neutral-500 shrink-0">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI anything, practice a sales objection, draft a loan..."
            className="flex-1 bg-transparent border-0 outline-none text-white text-base py-4 px-2 placeholder:text-neutral-500 font-medium"
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="p-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-all rounded-[2rem] text-white shadow-lg cursor-pointer flex items-center justify-center shrink-0"
            id="btn-home-prompt-submit"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>

      {/* Suggested Questions Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
        id="home-suggested-prompts"
      >
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Suggested Prompts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onStartNewChatWithPrompt(q.text)}
              className="text-left p-5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-emerald-500/20 transition-all duration-300 group flex items-start gap-4 cursor-pointer hover:-translate-y-0.5"
            >
              <span className="text-2xl mt-0.5 group-hover:scale-110 transition duration-300">
                {q.icon}
              </span>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-extrabold block">
                  {q.category}
                </span>
                <p className="font-bold text-sm text-neutral-200 leading-snug group-hover:text-white transition">
                  {q.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI OS Ecosystem Workspaces Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4"
        id="home-ai-os-workspaces"
      >
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-neutral-500 font-mono">
          AI Learning & Business OS Workspaces
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateToTab("business_os")}
            className="text-left p-6 rounded-[2rem] bg-gradient-to-br from-emerald-950/40 via-neutral-900/40 to-neutral-900/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 group flex items-start gap-4 cursor-pointer hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0 group-hover:scale-110 transition duration-300">
              <Briefcase className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-extrabold block">
                Business OS Suite
              </span>
              <h4 className="font-black text-sm text-white">Advisor CRM & Loan Workflows</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Log and pipeline clients, scout incoming leads in real-time, register new loan requests, and withdraw commission ledger payouts.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab("rba_services")}
            className="text-left p-6 rounded-[2rem] bg-gradient-to-br from-amber-950/20 via-neutral-900/40 to-neutral-900/10 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 group flex items-start gap-4 cursor-pointer hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:scale-110 transition duration-300">
              <Landmark className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono font-extrabold block">
                RBA Corporate Services
              </span>
              <h4 className="font-black text-sm text-white">Royal Bulls Advisory Portal</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Directly request loan fundings, SIP wealth plans, GST compliance setups, company incorporations, and advanced business tech automations.
              </p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Grid: Left Column (Activity/Progress), Right Column (Conversations/Pinned) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* Progress Tracker Card */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-6 shadow-xl"
          id="home-learning-progress"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Learning Progress</h4>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">ACADEMY STATUS</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-xs text-neutral-400 font-medium">Curriculum Path</span>
              <span className="text-xs text-white font-black font-mono">{percentComplete}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xl">🎓</span>
              <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-mono">Active</p>
              <span className="text-lg font-black text-white block">{courses.length} Courses</span>
            </div>
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xl">🏆</span>
              <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-mono font-bold">Certificates</p>
              <span className="text-lg font-black text-emerald-400 block">
                {completedCourseIds.length} Verified
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab("academy")}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Launch Advisor Academy</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition" />
          </button>
        </motion.div>

        {/* Recent & Pinned Conversations */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
          id="home-conversations-summary"
        >
          {/* Pinned Chats */}
          {pinnedConversations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-widest text-neutral-500 font-mono flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-emerald-400 rotate-45" />
                <span>Pinned Workspaces</span>
              </h4>
              <div className="space-y-2">
                {pinnedConversations.slice(0, 3).map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectConversation(chat.id)}
                    className="w-full p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-emerald-500/20 text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-xs text-neutral-200 truncate group-hover:text-white">
                        {chat.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Conversations */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-widest text-neutral-500 font-mono flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
              <span>Recent Conversations</span>
            </h4>
            <div className="space-y-2">
              {recentConversations.length > 0 ? (
                recentConversations.slice(0, 3).map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectConversation(chat.id)}
                    className="w-full p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="font-bold text-xs text-neutral-200 truncate group-hover:text-white">
                        {chat.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-neutral-350 group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                ))
              ) : (
                <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-neutral-500">No recent conversations.</p>
                  <button
                    onClick={() => onNavigateToTab("ai")}
                    className="text-emerald-400 text-xs font-bold hover:underline"
                  >
                    Start your first conversation
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
