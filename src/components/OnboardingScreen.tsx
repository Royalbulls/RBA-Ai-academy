import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile, UserRole } from "../types";
import { Sparkles, Compass, GraduationCap, Users, User, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface OnboardingScreenProps {
  currentUser: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

interface ObjectiveOption {
  id: string;
  title: string;
  englishTitle: string;
  description: string;
  role: UserRole;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
}

export default function OnboardingScreen({ currentUser, onComplete }: OnboardingScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options: ObjectiveOption[] = [
    {
      id: "customer",
      title: "मैं ग्राहक हूँ",
      englishTitle: "I am a Customer",
      description: "लोन, फाइनेंसिंग और पर्सनल वेल्थ एडवाइजरी के लिए",
      role: "customer",
      icon: <User className="w-5 h-5 text-emerald-500" />,
      bgClass: "hover:bg-emerald-50/50 hover:border-emerald-200",
      borderClass: "border-neutral-200",
    },
    {
      id: "become_advisor",
      title: "मैं RBA Advisor बनना चाहता हूँ",
      englishTitle: "I want to become an RBA Advisor",
      description: "ग्राहकों की मदद करें और कमीशन अर्जित करें",
      role: "advisor",
      icon: <Compass className="w-5 h-5 text-amber-500" />,
      bgClass: "hover:bg-amber-50/50 hover:border-amber-200",
      borderClass: "border-neutral-200",
    },
    {
      id: "grow_business",
      title: "मैं अपना Business बढ़ाना चाहता हूँ",
      englishTitle: "I want to grow my Business",
      description: "बिजनेस लोन और कॉर्पोरेट फाइनेंसिंग सॉल्यूशंस",
      role: "customer",
      icon: <Users className="w-5 h-5 text-blue-500" />,
      bgClass: "hover:bg-blue-50/50 hover:border-blue-200",
      borderClass: "border-neutral-200",
    },
    {
      id: "learn",
      title: "मैं सीखना चाहता हूँ",
      englishTitle: "I want to Learn",
      description: "फाइनेंशियल एडवाइजरी एकेडमी और सेल्स स्किल्स",
      role: "advisor",
      icon: <GraduationCap className="w-5 h-5 text-indigo-500" />,
      bgClass: "hover:bg-indigo-50/50 hover:border-indigo-200",
      borderClass: "border-neutral-200",
    },
  ];

  const handleSelectObjective = async (option: ObjectiveOption) => {
    setLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, "users", currentUser.id);
      
      // Determine role: never automatically assign admin or advisor.
      // Roles are strictly backend-controlled. Default role customer is preserved.
      const finalRole = currentUser.role || "customer";

      const updatedProfile: UserProfile = {
        ...currentUser,
        role: finalRole,
        objective: option.id,
        onboardingCompleted: true,
        updatedAt: new Date(),
      };

      try {
        await setDoc(userDocRef, {
          role: finalRole,
          objective: option.id,
          onboardingCompleted: true,
          updatedAt: new Date()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
      }

      onComplete(updatedProfile);
    } catch (err: any) {
      console.error("Onboarding setup error:", err);
      setError(err.message || "प्रोफ़ाइल सेटअप करने में विफल। कृपया पुन: प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white border border-neutral-200/80 rounded-[2.5rem] p-8 shadow-2xl max-w-lg w-full relative overflow-hidden"
      >
        {/* Visual Premium Header Accents */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-500" />
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-md">
            R
          </div>
          
          <h2 className="text-2xl font-black tracking-tight text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span>RBA AI OS Profile Setup</span>
          </h2>
          
          <p className="text-neutral-500 font-medium text-sm mt-2.5 max-w-sm">
            नमस्ते <span className="font-bold text-neutral-800">{currentUser.name}</span>, RBA AI में आपका स्वागत है।
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-neutral-50 border border-neutral-150 p-4 rounded-3xl mb-2 text-center">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">RBA AI asks:</p>
            <p className="text-base font-extrabold text-neutral-800 mt-1">
              आपका उद्देश्य क्या है? (What is your objective?)
            </p>
          </div>

          {options.map((option) => (
            <button
              key={option.id}
              disabled={loading}
              onClick={() => handleSelectObjective(option)}
              className={`w-full p-4 rounded-3xl border text-left flex items-start gap-4 transition duration-200 ${option.borderClass} ${option.bgClass} group disabled:opacity-50`}
            >
              <div className="p-3 bg-neutral-100 rounded-2xl shrink-0 group-hover:scale-105 transition duration-200">
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-neutral-900 text-sm">{option.title}</h4>
                  <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-700 group-hover:translate-x-0.5 transition duration-200" />
                </div>
                <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{option.englishTitle}</p>
                <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-neutral-600 font-mono tracking-tight">
              AI is customizing your workspace...
            </span>
          </div>
        )}

        <div className="mt-6 text-center text-[10px] text-neutral-400 font-mono">
          Secured Sandbox • Your role is stored in cloud database
        </div>
      </motion.div>
    </div>
  );
}
