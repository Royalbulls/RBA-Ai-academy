import React, { useState, useEffect } from "react";
import { Award, Trophy, Zap, Share2, Copy, Check, Gift, TrendingUp, Users, Sparkles, Star, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface AchievementsReferralsModuleProps {
  currentUser: { id: string; name: string; email: string } | null;
  onXPUpdate?: (newXP: number) => void;
}

interface UserAchievementsState {
  xp: number;
  streak: number;
  lastActive: string | null;
  badges: string[];
  referrals: { email: string; name: string; status: "pending" | "rewarded" }[];
}

const ALL_ACHIEVEMENTS = [
  { id: "first_login", title: "RBA Initiate", description: "Log in and configure your advisor profile", xp: 100, icon: "🎯" },
  { id: "pitch_master", title: "Objection Buster", description: "Score 90+ in any AI Objection Gym roleplay", xp: 250, icon: "💬" },
  { id: "loan_pro", title: "Credit Specialist", description: "Get your first loan application approved", xp: 300, icon: "💸" },
  { id: "academy_graduate", title: "Certified Consultant", description: "Unlock any dynamic course certificate", xp: 500, icon: "🎓" },
  { id: "streak_3", title: "Triple Threat", description: "Maintain a 3-day learning streak", xp: 150, icon: "🔥" },
  { id: "recruiter", title: "Master Networker", description: "Successfully refer another business partner", xp: 400, icon: "👥" },
];

export default function AchievementsReferralsModule({
  currentUser,
  onXPUpdate,
}: AchievementsReferralsModuleProps) {
  const [state, setState] = useState<UserAchievementsState>({
    xp: 150,
    streak: 1,
    lastActive: new Date().toDateString(),
    badges: ["first_login"],
    referrals: [
      { email: "lead.partner@royalbulls.com", name: "Anish Sharma", status: "rewarded" }
    ],
  });

  const [referralEmail, setReferralEmail] = useState("");
  const [referralName, setReferralName] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const fetchAchievements = async () => {
      try {
        const docRef = doc(db, "achievements", currentUser.id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as UserAchievementsState;
          
          // Check learning streak
          let currentStreak = data.streak || 1;
          const todayStr = new Date().toDateString();
          
          if (data.lastActive && data.lastActive !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (data.lastActive === yesterday.toDateString()) {
              currentStreak += 1;
            } else {
              currentStreak = 1; // streak broken
            }
            
            // Check if streak achievement unlocked
            const nextBadges = [...(data.badges || [])];
            let addedXP = 0;
            if (currentStreak >= 3 && !nextBadges.includes("streak_3")) {
              nextBadges.push("streak_3");
              addedXP += 150;
            }

            await updateDoc(docRef, {
              streak: currentStreak,
              lastActive: todayStr,
              xp: (data.xp || 150) + addedXP,
              badges: nextBadges
            });

            setState({
              ...data,
              streak: currentStreak,
              lastActive: todayStr,
              xp: (data.xp || 150) + addedXP,
              badges: nextBadges
            });
            if (onXPUpdate) onXPUpdate((data.xp || 150) + addedXP);
          } else {
            setState(data);
            if (onXPUpdate) onXPUpdate(data.xp || 150);
          }
        } else {
          // Initialize default achievements in Firestore
          const defaultData: UserAchievementsState = {
            xp: 150,
            streak: 1,
            lastActive: new Date().toDateString(),
            badges: ["first_login"],
            referrals: [
              { email: "lead.partner@royalbulls.com", name: "Anish Sharma", status: "rewarded" }
            ],
          };
          await setDoc(docRef, defaultData);
          setState(defaultData);
          if (onXPUpdate) onXPUpdate(150);
        }
      } catch (err) {
        console.error("Failed to load accomplishments:", err);
      }
    };

    fetchAchievements();
  }, [currentUser]);

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !referralEmail || !referralName) return;

    setLoading(true);
    setSuccessMsg(null);

    try {
      const docRef = doc(db, "achievements", currentUser.id);
      const nextReferrals = [...state.referrals, { email: referralEmail, name: referralName, status: "pending" as const }];
      
      // Simulate recruiter badge check
      const nextBadges = [...state.badges];
      let xpEarned = 0;
      if (!nextBadges.includes("recruiter")) {
        nextBadges.push("recruiter");
        xpEarned = 400;
      }

      await updateDoc(docRef, {
        referrals: nextReferrals,
        badges: nextBadges,
        xp: state.xp + xpEarned + 100, // 100 for sending invite
      });

      // Log audit log
      try {
        await setDoc(doc(db, "audit_logs", `log_${Date.now()}`), {
          userId: currentUser.id,
          userEmail: currentUser.email,
          action: "SEND_REFERRAL",
          details: `Referred ${referralName} (${referralEmail})`,
          timestamp: new Date()
        });
      } catch (logErr) {
        console.warn("Logging failed", logErr);
      }

      setState(prev => ({
        ...prev,
        referrals: nextReferrals,
        badges: nextBadges,
        xp: prev.xp + xpEarned + 100
      }));

      if (onXPUpdate) onXPUpdate(state.xp + xpEarned + 100);

      setSuccessMsg(`Invitation successfully dispatched to ${referralName}! Earned 100 XP.`);
      setReferralEmail("");
      setReferralName("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    const code = `RBA-ADVISOR-${currentUser?.id.substring(0, 6).toUpperCase()}`;
    navigator.clipboard.writeText(`https://rba-academy.com/onboard?ref=${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRank = (xp: number) => {
    if (xp < 300) return "Associate Advisor";
    if (xp < 800) return "Senior Advisor Partner";
    if (xp < 1500) return "Master Financial Specialist";
    return "Elite RBA Council Member";
  };

  const getNextRankXP = (xp: number) => {
    if (xp < 300) return 300;
    if (xp < 800) return 800;
    if (xp < 1500) return 1500;
    return xp;
  };

  const progressPct = Math.min(100, Math.round((state.xp / getNextRankXP(state.xp)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Cards: Streak & XP Level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak card */}
        <div className="p-5 bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-500/10 rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-wider block">
              Daily Streak
            </span>
            <h4 className="text-2xl font-black text-white flex items-baseline gap-1.5 font-mono">
              <span>{state.streak}</span>
              <span className="text-xs text-neutral-400">DAYS</span>
            </h4>
            <p className="text-[10px] text-neutral-400">Keep learning daily to secure streak XP modifiers!</p>
          </div>
          <div className="p-3.5 bg-amber-500/15 rounded-2xl text-amber-400 animate-pulse">
            <Zap className="w-6 h-6 fill-current" />
          </div>
        </div>

        {/* XP Level progress */}
        <div className="md:col-span-2 p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-wider block">
                Partner Rank
              </span>
              <h4 className="font-extrabold text-sm text-white">{getRank(state.xp)}</h4>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-extrabold text-neutral-400">{state.xp} XP</span>
              <span className="text-[10px] font-mono text-neutral-500 block">next rank: {getNextRankXP(state.xp)} XP</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono font-bold text-neutral-500">
              <span>PROGRESS</span>
              <span>{progressPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accomplishments & Badges */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Earned Advisor Credentials & Badges</span>
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALL_ACHIEVEMENTS.map((ach) => {
            const isUnlocked = state.badges.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition duration-200 text-left relative flex flex-col justify-between h-[125px] ${
                  isUnlocked
                    ? "bg-white/[0.02] border-emerald-500/20 text-white"
                    : "bg-white/[0.005] border-white/5 text-neutral-500"
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <span className={`text-2xl ${isUnlocked ? "opacity-100" : "opacity-30 grayscale"}`}>
                    {ach.icon}
                  </span>
                  {isUnlocked ? (
                    <span className="text-[8px] font-mono font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono font-bold bg-white/5 text-neutral-500 px-1.5 py-0.5 rounded-md">
                      LOCKED
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h5 className={`font-bold text-xs ${isUnlocked ? "text-neutral-100" : "text-neutral-500"}`}>
                    {ach.title}
                  </h5>
                  <p className="text-[9px] text-neutral-400 line-clamp-2 leading-tight">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral & Commission rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Referral Form */}
        <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Partner Referral Scheme</span>
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Refer other advisors, agents, or client representatives to Royal Bulls Advisory. Earn 400 XP + 5% lifetime commission sharing.
            </p>
          </div>

          <div className="bg-neutral-950/60 p-3 rounded-2xl flex items-center justify-between border border-white/5">
            <div className="overflow-hidden pr-2">
              <p className="text-[9px] font-mono text-neutral-500">SHAREABLE INVITATION CODE</p>
              <p className="text-xs font-bold font-mono text-emerald-400 truncate">
                RBA-ADVISOR-{currentUser?.id.substring(0, 6).toUpperCase()}
              </p>
            </div>
            <button
              onClick={copyReferralCode}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-300 hover:text-white transition cursor-pointer shrink-0"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <form onSubmit={handleSendReferral} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Partner Name"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-white/5 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-white outline-none font-bold transition"
              />
              <input
                type="email"
                placeholder="Partner Email"
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-white/5 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-white outline-none font-bold transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !referralEmail || !referralName}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>Send Invite & Claim 100 XP</span>
            </button>
          </form>

          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-bold"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Referred Partners list */}
        <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Referral Network Pipeline</span>
            </h4>

            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {state.referrals.map((ref, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-neutral-100 block">{ref.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">{ref.email}</span>
                  </div>
                  <div>
                    {ref.status === "rewarded" ? (
                      <span className="text-[9px] font-mono font-extrabold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                        ACTIVE (+5% Share)
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md">
                        PENDING SIGNUP
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 text-[11px] text-emerald-400 font-bold mt-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
            <span>Lifetime Passive Revenue Active: +5% on Referred Advisor Payouts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
