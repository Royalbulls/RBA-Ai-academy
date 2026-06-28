import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile, UserRole } from "../types";
import { LogIn, ShieldAlert, User, Smartphone, Sparkles, Check, ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserAuthModalProps {
  onAuthSuccess: (profile: UserProfile) => void;
  currentProfile: UserProfile | null;
  onProfileClick?: () => void;
}

type AuthScreen = "MAIN" | "PHONE" | "OTP";

export default function UserAuthModal({ onAuthSuccess, currentProfile, onProfileClick }: UserAuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<AuthScreen>("MAIN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      await handleUserProfileSetup(firebaseUser.uid, {
        name: firebaseUser.displayName || "RBA User",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError(null);
    setScreen("OTP");
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError("Please enter the verification code sent to your phone.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Authenticate anonymously in Firebase as a proxy for the phone login session.
      // This ensures they are authenticated in the rules without needing complex third-party infrastructure in AI Studio.
      const result = await signInAnonymously(auth);
      const firebaseUser = result.user;

      const formattedPhone = `+91 ${phoneNumber.replace(/\D/g, "")}`;
      await handleUserProfileSetup(firebaseUser.uid, {
        name: `User ${formattedPhone}`,
        phone: formattedPhone,
        email: `${phoneNumber.replace(/\D/g, "")}@rba-mobile.ai`,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInAnonymously(auth);
      const firebaseUser = result.user;

      await handleUserProfileSetup(firebaseUser.uid, {
        name: "Guest User",
        email: "guest@royalbullsadvisory.com",
        isGuest: true,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to continue as Guest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserProfileSetup = async (
    uid: string,
    initialData: { name: string; email: string; phone?: string; photoURL?: string; isGuest?: boolean },
    retriesLeft = 3
  ) => {
    const userDocRef = doc(db, "users", uid);
    let userSnap = null;
    let getSuccess = false;

    // Retry fetch with brief delays if needed
    for (let attempt = 1; attempt <= retriesLeft; attempt++) {
      try {
        userSnap = await getDoc(userDocRef);
        getSuccess = true;
        break;
      } catch (err) {
        console.warn(`Fetch user profile attempt ${attempt} failed:`, err);
        if (attempt === retriesLeft) {
          // If we can't even GET, we can still proceed to attempt writing
          getSuccess = false;
        } else {
          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
        }
      }
    }

    let profile: UserProfile;

    if (getSuccess && userSnap && userSnap.exists()) {
      profile = userSnap.data() as UserProfile;
      // Guarantee key structural IDs
      profile.id = uid;
      profile.uid = uid;
    } else {
      // Setup a brand new profile. Default role is ALWAYS 'customer' as strictly requested.
      // No manual admin selection allowed.
      profile = {
        id: uid,
        uid: uid,
        name: initialData.name,
        displayName: initialData.name,
        email: initialData.email,
        photoURL: initialData.photoURL || "",
        phone: initialData.phone || "",
        phoneNumber: initialData.phone || "",
        role: "customer", // Default is always customer
        onboardingCompleted: false, // Default is false
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(initialData.isGuest ? { isGuest: true, onboardingCompleted: true } : {}),
      };

      let writeSuccess = false;
      let lastError: any = null;

      for (let attempt = 1; attempt <= retriesLeft; attempt++) {
        try {
          await setDoc(userDocRef, profile);
          writeSuccess = true;
          break;
        } catch (err: any) {
          lastError = err;
          console.error(`Attempt ${attempt} to create user document failed:`, err);
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }

      if (!writeSuccess) {
        const errorMsg = `Connection issue while setting up your RBA profile: ${
          lastError?.message || "Cloud Database Unavailable"
        }. Please check your connection and try logging in again.`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }

    // Special bootstrap fallback for owner's admin email.
    if (profile.email === "royalbullsadvisory412@gmail.com" && profile.role !== "admin") {
      profile.role = "admin";
      try {
        await setDoc(userDocRef, { role: "admin" }, { merge: true });
      } catch (err) {
        console.error("Failed to update admin bootstrap role:", err);
      }
    }

    onAuthSuccess(profile);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  if (currentProfile) {
    return (
      <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-2 text-white shadow-sm">
        <button
          onClick={onProfileClick}
          className="flex flex-col text-right hover:opacity-85 transition focus:outline-none cursor-pointer"
          title="Click to view profile"
        >
          <span className="text-xs font-semibold tracking-tight text-neutral-200 hover:text-white transition">{currentProfile.name}</span>
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
            {currentProfile.role}
          </span>
        </button>
        <button
          onClick={handleSignOut}
          className="text-xs text-neutral-400 hover:text-white transition bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg font-medium border border-neutral-700 cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-xl max-w-md w-full mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-400" />

      {/* Main Login Screen */}
      <AnimatePresence mode="wait">
        {screen === "MAIN" && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight text-neutral-900">👋 Welcome to RBA AI</h2>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Connect your workspace to deploy business workflows and advisors.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl text-xs flex gap-2 items-start">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-neutral-950 text-white hover:bg-neutral-800 transition py-3 rounded-2xl font-bold text-sm shadow-md border border-neutral-900 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 1.127 15.42 0 12.24 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.923 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.188-1.989H12.24z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Mobile Sign In Toggle */}
              <button
                type="button"
                onClick={() => { setError(null); setScreen("PHONE"); }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-neutral-800 hover:bg-neutral-50 transition py-3 rounded-2xl font-bold text-sm shadow-sm border border-neutral-200 disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4 text-neutral-600 shrink-0" />
                <span>Continue with Mobile</span>
              </button>

              {/* Guest Sign In */}
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={loading}
                className="w-full py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 transition rounded-xl text-xs font-semibold border border-neutral-200/60 mt-1"
              >
                Continue as Guest
              </button>
            </div>
          </motion.div>
        )}

        {/* Phone Input Screen */}
        {screen === "PHONE" && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setError(null); setScreen("MAIN"); }}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition"
              >
                <ArrowLeft className="w-4 h-4 text-neutral-500" />
              </button>
              <h3 className="font-bold text-lg text-neutral-900 tracking-tight">Connect via Mobile</h3>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">Mobile Number:</label>
                <div className="flex gap-2">
                  <div className="px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit number"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-neutral-800 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-950 text-white hover:bg-neutral-800 transition py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* OTP Entry Screen */}
        {screen === "OTP" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setError(null); setScreen("PHONE"); }}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition"
              >
                <ArrowLeft className="w-4 h-4 text-neutral-500" />
              </button>
              <h3 className="font-bold text-lg text-neutral-900 tracking-tight">Verify Code</h3>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl text-xs text-emerald-800 leading-relaxed">
              We have simulated sending an SMS OTP to <span className="font-bold">+91 {phoneNumber}</span>. Enter <span className="font-extrabold text-neutral-900">123456</span> to quickly authenticate.
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">6-Digit SMS OTP:</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 123456"
                  className="w-full text-center tracking-[1em] text-lg font-bold bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-neutral-800 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-950 text-white hover:bg-neutral-800 transition py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center text-[10px] text-neutral-400 font-mono">
        RBA AI OS Secures your details on Cloud Firestore Sandbox.
      </div>
    </div>
  );
}
