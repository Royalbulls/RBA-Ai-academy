import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db, handleFirestoreError } from "./lib/firebase";
import { UserProfile, ChatMessage, Course } from "./types";
import UserAuthModal from "./components/UserAuthModal";
import OnboardingScreen from "./components/OnboardingScreen";
import HomeWorkspace from "./components/HomeWorkspace";
import AiChatWorkspace from "./components/AiChatWorkspace";
import AcademyWorkspace from "./components/AcademyWorkspace";
import ChatHistoryList from "./components/ChatHistoryList";
import ProfileMemoryWorkspace from "./components/ProfileMemoryWorkspace";

import { 
  Sparkles, GraduationCap, Clock, User, MessageSquare, Home,
  Menu, X, Bell, Settings, HelpCircle, LogOut, ChevronRight, Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Conversation {
  id: string;
  title: string;
  isPinned?: boolean;
  messages: ChatMessage[];
  userId: string;
  updatedAt: any;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Core navigation tabs
  const [activeTab, setActiveTab] = useState<"home" | "ai" | "academy" | "history" | "profile">("home");

  // Conversations states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Local completed courses
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);

  // Overlays
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Sync Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoadingAuth(true);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setCurrentUser({ id: firebaseUser.uid, ...userSnap.data() } as UserProfile);
          } else {
            const defaultProfile: UserProfile = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || (firebaseUser.phoneNumber ? `User ${firebaseUser.phoneNumber}` : "RBA User"),
              displayName: firebaseUser.displayName || (firebaseUser.phoneNumber ? `User ${firebaseUser.phoneNumber}` : "RBA User"),
              email: firebaseUser.email || "",
              photoURL: firebaseUser.photoURL || "",
              phoneNumber: firebaseUser.phoneNumber || "",
              phone: firebaseUser.phoneNumber || "",
              role: "customer",
              onboardingCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            try {
              await setDoc(userDocRef, defaultProfile);
              if (firebaseUser.email === "royalbullsadvisory412@gmail.com") {
                defaultProfile.role = "admin";
                await setDoc(userDocRef, { role: "admin" }, { merge: true });
              }
            } catch (err) {
              console.error("Failed to automatically create user profile:", err);
            }
            setCurrentUser(defaultProfile);
          }
        } catch (err) {
          console.error("Auth status query error:", err);
        }
      } else {
        setCurrentUser(null);
        setConversations([]);
        setActiveConversation(null);
      }
      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  // Sync Conversations from Firestore real-time
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "conversations"),
      where("userId", "==", currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Conversation[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data,
          updatedAt: data.updatedAt ? data.updatedAt : new Date()
        } as Conversation);
      });

      // Sort: pinned first, then updatedAt desc
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt).getTime();
        const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt).getTime();
        return timeB - timeA;
      });

      setConversations(list);

      // Keep active conversation synced if matching in list
      if (activeConversation) {
        const found = list.find((c) => c.id === activeConversation.id);
        if (found) {
          setActiveConversation(found);
        }
      }
    }, (err) => {
      console.error("Firestore conversations sync failed:", err);
    });

    return unsubscribe;
  }, [currentUser, activeConversation?.id]);

  // Sync local completed course from profile storage or localStorage
  useEffect(() => {
    if (currentUser) {
      const key = `completed_courses_${currentUser.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setCompletedCourseIds(JSON.parse(saved));
      } else {
        setCompletedCourseIds([]);
      }
    }
  }, [currentUser]);

  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, "users", currentUser.id);
      await updateDoc(docRef, {
        ...updatedFields,
        updatedAt: new Date()
      });
      setCurrentUser((prev) => prev ? { ...prev, ...updatedFields } : null);
    } catch (err) {
      console.error("Failed to update user workspace memory profile:", err);
      throw err;
    }
  };

  const handleClearMemory = async () => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, "users", currentUser.id);
      await updateDoc(docRef, {
        learningGoals: "",
        businessDetails: "",
        writingStyle: "",
        languagePreference: "en",
        pinnedKnowledge: [],
        updatedAt: new Date()
      });
      setCurrentUser((prev) => prev ? {
        ...prev,
        learningGoals: "",
        businessDetails: "",
        writingStyle: "",
        languagePreference: "en",
        pinnedKnowledge: []
      } : null);
    } catch (err) {
      console.error("Failed to clear AI memory:", err);
      throw err;
    }
  };

  const handleSendMessage = async (text: string, image?: string, file?: string) => {
    if (!currentUser) return;

    let targetConv = activeConversation;
    const isNew = !targetConv;

    // Create a new session/conversation if none is active
    if (isNew) {
      const cleanTitle = text.length > 40 ? text.substring(0, 37) + "..." : text;
      const newConvId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        title: cleanTitle,
        userId: currentUser.id,
        messages: [],
        isPinned: false,
        updatedAt: new Date(),
      };
      
      try {
        await setDoc(doc(db, "conversations", newConvId), newConv);
        targetConv = newConv;
        setActiveConversation(newConv);
      } catch (err) {
        console.error("Failed to create Firestore conversation:", err);
        return;
      }
    }

    if (!targetConv) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: "user",
      text,
      timestamp: new Date()
    };

    const currentMessages = [...targetConv.messages, userMessage];

    // Optimistically update active state
    setActiveConversation({
      ...targetConv,
      messages: currentMessages,
      updatedAt: new Date(),
    });

    setChatLoading(true);

    try {
      // POST message to existing backend /api/chat
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          currentUser: {
            ...currentUser,
            // Expose the memory states inside body for system prompts custom tuning
            learningGoals: currentUser.learningGoals || "",
            businessDetails: currentUser.businessDetails || "",
            writingStyle: currentUser.writingStyle || "",
            languagePreference: currentUser.languagePreference || "en",
            pinnedKnowledge: currentUser.pinnedKnowledge || [],
          }
        })
      });

      if (!res.ok) throw new Error("Chat request failed");
      const replyData = await res.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_m`,
        role: "model",
        text: replyData.text || "Sorry, I couldn't formulate a response. Please retry!",
        timestamp: new Date()
      };

      const finalMessages = [...currentMessages, assistantMessage];

      // Save complete conversation history back to Firestore
      await updateDoc(doc(db, "conversations", targetConv.id), {
        messages: finalMessages,
        updatedAt: new Date(),
      });

      setActiveConversation((prev) => prev ? {
        ...prev,
        messages: finalMessages,
        updatedAt: new Date()
      } : null);

    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: "model",
        text: "The AI service is currently experiencing extremely high demand. Please try sending your message again shortly.",
        timestamp: new Date(),
        isError: true,
      };
      const finalErrMsgs = [...currentMessages, errorMsg];
      
      // Update locally
      setActiveConversation((prev) => prev ? {
        ...prev,
        messages: finalErrMsgs,
      } : null);
    } finally {
      setChatLoading(false);
    }
  };

  const handlePinConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    try {
      await updateDoc(doc(db, "conversations", id), {
        isPinned: !conv.isPinned,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to pin/unpin thread:", err);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, "conversations", id), {
        title: newTitle,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to rename thread:", err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this workspace conversation?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "conversations", id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
      }
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  };

  const handleStartNewChatWithPrompt = (prompt: string) => {
    setActiveConversation(null);
    setActiveTab("ai");
    setTimeout(() => {
      handleSendMessage(prompt);
    }, 100);
  };

  const handleCourseCompleted = (courseId: string, courseTitle: string) => {
    if (!currentUser) return;
    const nextCompleted = [...completedCourseIds, courseId];
    setCompletedCourseIds(nextCompleted);
    localStorage.setItem(`completed_courses_${currentUser.id}`, JSON.stringify(nextCompleted));
    alert(`Congratulations! You have earned the certified Specialist Badge for ${courseTitle}!`);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const getRecentChats = () => {
    return conversations.filter(c => !c.isPinned);
  };

  const getPinnedChats = () => {
    return conversations.filter(c => c.isPinned);
  };

  // Sidebar Menu structure for desktop
  const sideNavigation = [
    { label: "Home", tab: "home" as const, icon: Home },
    { label: "AI Personal Space", tab: "ai" as const, icon: Sparkles },
    { label: "Advisor Academy", tab: "academy" as const, icon: GraduationCap },
    { label: "Workspace History", tab: "history" as const, icon: Clock },
    { label: "Profile & Memory", tab: "profile" as const, icon: User },
  ];

  const COURSES_STATIC: Course[] = [
    { id: "course_loan", title: "Loan Advisor Academy", description: "", lessons: [] },
    { id: "course_consult", title: "Business Consultant Academy", description: "", lessons: [] },
    { id: "course_ai", title: "AI Business Academy", description: "", lessons: [] }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-white bg-neutral-950 selection:bg-emerald-500 selection:text-neutral-950 transition-all duration-305">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center bg-neutral-950/70 border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm bg-gradient-to-tr from-emerald-500 to-amber-400 text-neutral-950 shadow-lg">
            R
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight leading-none text-white flex items-center gap-1.5">
              <span>RBA Academy</span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-mono">Workspace OS</span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <>
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2.5 text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="p-2.5 text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </>
          )}

          <UserAuthModal
            currentProfile={currentUser}
            onAuthSuccess={(profile) => setCurrentUser(profile)}
            onProfileClick={() => setActiveTab("profile")}
          />
        </div>
      </header>

      {/* Main split-screen container */}
      <div className="flex-1 flex flex-row overflow-hidden w-full relative">
        {/* Left Drawer sidebar */}
        {currentUser && (
          <aside className="hidden md:flex flex-col w-64 bg-neutral-950/40 border-r border-white/5 p-4 justify-between select-none shrink-0">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-neutral-500 font-mono px-3 mb-3.5 tracking-widest">
                Main Workspace
              </p>
              {sideNavigation.map((nav) => {
                const Icon = nav.icon;
                const isActive = activeTab === nav.tab;
                return (
                  <button
                    key={nav.tab}
                    onClick={() => {
                      setActiveTab(nav.tab);
                      if (nav.tab === "ai" && conversations.length > 0 && !activeConversation) {
                        // Optimistically auto-load last conversation
                        setActiveConversation(conversations[0]);
                      }
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? "bg-white text-neutral-950 shadow-xl font-black"
                        : "text-neutral-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-neutral-950" : "text-neutral-400"}`} />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold">
                  SECURE AI OPERATIONAL
                </span>
              </div>
            </div>
          </aside>
        )}

        {/* Content canvas */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-24 md:pb-6 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-950">
          {loadingAuth ? (
            <div className="flex flex-col items-center justify-center h-[350px] gap-3">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-neutral-500 font-mono">Loading safe sandbox profile...</span>
            </div>
          ) : !currentUser ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center h-[calc(100vh-12rem)]">
              <div className="max-w-md bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center rounded-3xl mx-auto font-black text-2xl shadow-lg animate-bounce">
                  R
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-black text-white tracking-tight">RBA Academy & Workspace OS</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                    Complete your login or create a sandbox account to explore AI tutors, practice sales roleplay, and access certifications.
                  </p>
                </div>
                <div>
                  <UserAuthModal
                    currentProfile={null}
                    onAuthSuccess={(profile) => setCurrentUser(profile)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full">
              {/* Force onboarding overlay if not finished */}
              {currentUser && !currentUser.isGuest && currentUser.onboardingCompleted === false ? (
                <OnboardingScreen
                  currentUser={currentUser}
                  onComplete={(profile) => setCurrentUser(profile)}
                />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    {activeTab === "home" && (
                      <HomeWorkspace
                        userName={currentUser.name}
                        recentConversations={getRecentChats()}
                        pinnedConversations={getPinnedChats()}
                        courses={COURSES_STATIC}
                        completedCourseIds={completedCourseIds}
                        onSelectConversation={(id) => {
                          const f = conversations.find(c => c.id === id);
                          if (f) setActiveConversation(f);
                          setActiveTab("ai");
                        }}
                        onStartNewChatWithPrompt={handleStartNewChatWithPrompt}
                        onNavigateToTab={(tab) => {
                          setActiveTab(tab);
                        }}
                      />
                    )}

                    {activeTab === "ai" && (
                      <AiChatWorkspace
                        currentUser={currentUser}
                        activeConversation={activeConversation}
                        onSendMessage={handleSendMessage}
                        onPinConversation={handlePinConversation}
                        onRenameConversation={handleRenameConversation}
                        onDeleteConversation={handleDeleteConversation}
                        onStartNewChat={() => {
                          setActiveConversation(null);
                        }}
                        loading={chatLoading}
                      />
                    )}

                    {activeTab === "academy" && (
                      <AcademyWorkspace
                        currentUser={currentUser}
                        completedCourseIds={completedCourseIds}
                        onCourseCompleted={handleCourseCompleted}
                        onTriggerAiExplain={handleStartNewChatWithPrompt}
                      />
                    )}

                    {activeTab === "history" && (
                      <ChatHistoryList
                        conversations={conversations}
                        activeId={activeConversation?.id || null}
                        onSelectConversation={(id) => {
                          const f = conversations.find(c => c.id === id);
                          if (f) setActiveConversation(f);
                          setActiveTab("ai");
                        }}
                        onPinConversation={handlePinConversation}
                        onRenameConversation={handleRenameConversation}
                        onDeleteConversation={handleDeleteConversation}
                      />
                    )}

                    {activeTab === "profile" && (
                      <ProfileMemoryWorkspace
                        currentUser={currentUser}
                        onUpdateProfile={handleUpdateProfile}
                        onClearMemory={handleClearMemory}
                        onLogout={handleLogout}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Tab Bar */}
      {currentUser && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 border-t border-white/5 backdrop-blur px-2 py-3 flex justify-around items-center select-none shadow-2xl">
          {sideNavigation.map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.tab;
            return (
              <button
                key={nav.tab}
                onClick={() => {
                  setActiveTab(nav.tab);
                  if (nav.tab === "ai" && conversations.length > 0 && !activeConversation) {
                    setActiveConversation(conversations[0]);
                  }
                }}
                className="flex flex-col items-center justify-center p-2 text-neutral-400 focus:text-white cursor-pointer transition relative"
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "text-emerald-400 scale-110" : "text-neutral-500"}`} />
                <span className={`text-[9px] mt-1 tracking-tight font-extrabold ${isActive ? "text-white" : "text-neutral-500 font-medium"}`}>
                  {nav.label === "AI Personal Space" ? "AI Space" : nav.label === "Workspace History" ? "History" : nav.label === "Profile & Memory" ? "Profile" : nav.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-1 h-1 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* Notifications Drawer */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs transition" onClick={() => setShowNotifications(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="relative w-full max-w-sm bg-neutral-900 border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base">Workspace Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white">System Synchronized</span>
                      <span className="text-[9px] text-neutral-500 font-mono">1 min ago</span>
                    </div>
                    <p className="text-neutral-400 leading-relaxed">
                      AI Memory workspace has successfully compiled across security domains.
                    </p>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white">Academy Welcome Badge</span>
                      <span className="text-[9px] text-neutral-500 font-mono">Today</span>
                    </div>
                    <p className="text-neutral-400 leading-relaxed">
                      Complete Objection Handling simulated roleplay to unlock certified badges.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition border border-white/10"
              >
                Mark all as read
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Support Center Drawer */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs transition" onClick={() => setShowHelp(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="relative w-full max-w-sm bg-neutral-900 border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base">Support Helpdesk</h3>
                  <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Need support or have technical issues? Drop a query below or consult our quick SOP references.
                  </p>

                  <div className="space-y-2">
                    <button className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left text-xs text-neutral-300 font-bold hover:text-white transition flex justify-between items-center">
                      <span>Interactive SOP Guide</span>
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </button>
                    <button className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left text-xs text-neutral-300 font-bold hover:text-white transition flex justify-between items-center">
                      <span>Certification Verification lookup</span>
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="mailto:support@royalbullsadvisory.com"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition text-center block shadow-lg cursor-pointer"
                >
                  Email Support Team
                </a>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition border border-white/10 cursor-pointer"
                >
                  Dismiss Helpdesk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
