import React, { useState } from "react";
import { User, Shield, Key, Volume2, Globe, Sparkles, Brain, Bell, Moon, LogOut, Check, RefreshCw, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { UserProfile } from "../types";

interface ProfileMemoryWorkspaceProps {
  currentUser: UserProfile | null;
  onUpdateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
  onClearMemory: () => Promise<void>;
  onLogout: () => void;
}

export default function ProfileMemoryWorkspace({
  currentUser,
  onUpdateProfile,
  onClearMemory,
  onLogout,
}: ProfileMemoryWorkspaceProps) {
  // AI Memory state
  const [learningGoals, setLearningGoals] = useState(currentUser?.learningGoals || "");
  const [businessDetails, setBusinessDetails] = useState(currentUser?.businessDetails || "");
  const [writingStyle, setWritingStyle] = useState(currentUser?.writingStyle || "");
  const [languagePreference, setLanguagePreference] = useState<string>(currentUser?.languagePreference || "en");
  
  // Pinned Knowledge state
  const [pinnedKnowledgeList, setPinnedKnowledgeList] = useState<string[]>(currentUser?.pinnedKnowledge || []);
  const [newKnowledgeInput, setNewKnowledgeInput] = useState("");

  // UI States
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  // Theme and notification states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const handleAddKnowledge = () => {
    if (!newKnowledgeInput.trim()) return;
    setPinnedKnowledgeList([...pinnedKnowledgeList, newKnowledgeInput.trim()]);
    setNewKnowledgeInput("");
  };

  const handleRemoveKnowledge = (index: number) => {
    setPinnedKnowledgeList(pinnedKnowledgeList.filter((_, i) => i !== index));
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await onUpdateProfile({
        learningGoals,
        businessDetails,
        writingStyle,
        languagePreference,
        pinnedKnowledge: pinnedKnowledgeList,
        updatedAt: new Date(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update AI Memory workspace profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleClearMemoryTrigger = async () => {
    if (!window.confirm("Are you absolutely sure you want to completely clear your RBA AI Memory? The AI will forget your writing styles, background knowledge, and specific goals.")) {
      return;
    }
    setClearing(true);
    try {
      await onClearMemory();
      setLearningGoals("");
      setBusinessDetails("");
      setWritingStyle("");
      setLanguagePreference("en");
      setPinnedKnowledgeList([]);
      alert("AI Memory cleared successfully.");
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6 px-4 md:px-0">
      {/* Header Profile Summary */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-xl">
        <div className="relative">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/20"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border-2 border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl uppercase">
              {currentUser?.name?.charAt(0) || "U"}
            </div>
          )}
          <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-neutral-950 flex items-center justify-center text-white" title="Verified Account">
            ✓
          </span>
        </div>

        <div className="text-center sm:text-left space-y-1 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-lg font-black text-white">{currentUser?.name || "RBA User"}</h2>
            <span className="self-center sm:self-auto text-[9px] font-bold tracking-wider font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full uppercase">
              RBA Certified Partner
            </span>
          </div>
          <p className="text-xs text-neutral-400">{currentUser?.email || "No email linked"}</p>
          <p className="text-[10px] text-neutral-500 font-mono">ACCOUNT ID: {currentUser?.id}</p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 border border-rose-500/25 hover:border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Memory Form Panel */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveMemory} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Personal AI Memory Workspace</h3>
                <p className="text-[10px] text-neutral-400">Settings here dynamically influence the AI Tutor, Coaches, and Assistants</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase font-mono tracking-widest">
                  Learning Goals
                </label>
                <textarea
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder="Master loan advisory structures, clear sales roleplay objections..."
                  rows={2}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition resize-none placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase font-mono tracking-widest">
                  Business & Role Details
                </label>
                <textarea
                  value={businessDetails}
                  onChange={(e) => setBusinessDetails(e.target.value)}
                  placeholder="Independent financial consultant, branch manager of RBA corporate office..."
                  rows={2}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition resize-none placeholder:text-neutral-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase font-mono tracking-widest">
                    AI Writing Style
                  </label>
                  <input
                    value={writingStyle}
                    onChange={(e) => setWritingStyle(e.target.value)}
                    placeholder="Clear, professional, bulleted summaries"
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition placeholder:text-neutral-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase font-mono tracking-widest">
                    Preferred Language
                  </label>
                  <select
                    value={languagePreference}
                    onChange={(e) => setLanguagePreference(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    <option value="en">English Only (en)</option>
                    <option value="hi">Bilingual Mixed (Hinglish)</option>
                  </select>
                </div>
              </div>

              {/* Pinned Knowledge array list */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase font-mono tracking-widest">
                  Pinned Knowledge Assets
                </label>
                
                <div className="flex gap-2">
                  <input
                    value={newKnowledgeInput}
                    onChange={(e) => setNewKnowledgeInput(e.target.value)}
                    placeholder="Add specific facts e.g. 'Maximum personal loan limit is 50 Lacs'"
                    className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition placeholder:text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddKnowledge}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {pinnedKnowledgeList.map((fact, index) => (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-neutral-300"
                    >
                      <span className="truncate font-sans font-medium">{fact}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKnowledge(index)}
                        className="text-neutral-500 hover:text-rose-400 p-1 rounded-lg transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={handleClearMemoryTrigger}
                disabled={clearing}
                className="px-4 py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-500/10 rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
              >
                Clear AI Memory
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : success ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Memory Synced</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Sync AI Memory</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* General App Config preferences (Theme / Subscription / Notifications) */}
        <div className="space-y-6">
          {/* Subscription Info */}
          <div className="bg-gradient-to-br from-neutral-950 to-emerald-950 border border-emerald-500/20 p-6 rounded-[2rem] shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider font-mono">Subscription Plan</span>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-lg font-black text-white tracking-tight">RBA Enterprise Pro</h4>
              <p className="text-[10px] text-neutral-400">Unlimited AI tutor requests, live objections simulations, and verified certificate exports.</p>
            </div>

            <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-emerald-400 font-bold flex justify-between">
              <span>Status:</span>
              <span>Active (Auto-renew)</span>
            </div>
          </div>

          {/* Preferences toggles */}
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] shadow-xl space-y-5">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
              App Preferences
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-neutral-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-100 block">Push Notifications</span>
                    <span className="text-[10px] text-neutral-500">Certificate alerts, reminders</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-10 h-6 rounded-full p-1 transition ${
                    notificationsEnabled ? "bg-emerald-600" : "bg-neutral-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                    notificationsEnabled ? "translate-x-4" : ""
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-neutral-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-100 block">Dark Cosmic Theme</span>
                    <span className="text-[10px] text-neutral-500">Protect eyes during study</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDarkModeEnabled(!darkModeEnabled)}
                  className={`w-10 h-6 rounded-full p-1 transition ${
                    darkModeEnabled ? "bg-emerald-600" : "bg-neutral-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                    darkModeEnabled ? "translate-x-4" : ""
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
