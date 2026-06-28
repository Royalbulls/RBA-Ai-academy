import React, { useState, useEffect } from "react";
import { X, Globe, Cpu, Volume2, Layout, Check, ShieldAlert, Sliders } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; email: string; role: string; languagePreference?: string } | null;
  onUpdateSettings?: (settings: any) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateSettings,
}: SettingsModalProps) {
  const [lang, setLang] = useState("en");
  const [aiTemp, setAiTemp] = useState("balanced");
  const [density, setDensity] = useState("comfortable");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    // Load setting profiles from LocalStorage or Firestore
    const storedTemp = localStorage.getItem(`rba_settings_temp_${currentUser.id}`) || "balanced";
    const storedDensity = localStorage.getItem(`rba_settings_density_${currentUser.id}`) || "comfortable";
    const storedAudio = localStorage.getItem(`rba_settings_audio_${currentUser.id}`) === "true";
    
    setLang(currentUser.languagePreference || "en");
    setAiTemp(storedTemp);
    setDensity(storedDensity);
    setAudioEnabled(storedAudio);
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to Firestore
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        languagePreference: lang,
        updatedAt: new Date(),
      });

      // Save to LocalStorage
      localStorage.setItem(`rba_settings_temp_${currentUser.id}`, aiTemp);
      localStorage.setItem(`rba_settings_density_${currentUser.id}`, density);
      localStorage.setItem(`rba_settings_audio_${currentUser.id}`, String(audioEnabled));

      if (onUpdateSettings) {
        onUpdateSettings({
          languagePreference: lang,
          aiTemperature: aiTemp,
          uiDensity: density,
          audioEnabled,
        });
      }

      onClose();
    } catch (err) {
      console.error("Failed to persist settings profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md" onClick={onClose} />

      {/* Card container */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-white text-base">User Preferences & AI Config</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Language Preference (भाषा)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "en", label: "English (US)" },
                { id: "hi", label: "हिंदी / English (Hinglish)" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLang(item.id)}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    lang === item.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {lang === item.id && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* AI Generation Mode / Temperature */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Temperature Tuning</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "precise", label: "Precise", desc: "Temp 0.1" },
                { id: "balanced", label: "Balanced", desc: "Temp 0.7" },
                { id: "creative", label: "Creative", desc: "Temp 1.0" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAiTemp(item.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between h-[65px] cursor-pointer ${
                    aiTemp === item.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[9px] text-neutral-500 font-mono font-medium">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* UI Layout Density */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase text-neutral-400 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5" />
              <span>UI Spacing / Density</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "default", label: "Spacious" },
                { id: "comfortable", label: "Standard" },
                { id: "compact", label: "Compact" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDensity(item.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition cursor-pointer ${
                    density === item.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-white/[0.01] border-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Voice/Audio Toggle */}
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Text-to-Speech Output</span>
              </span>
              <p className="text-[10px] text-neutral-400">Read AI explanations out loud automatically.</p>
            </div>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`w-11 h-6 rounded-full transition relative flex items-center cursor-pointer ${
                audioEnabled ? "bg-emerald-500" : "bg-neutral-850"
              }`}
            >
              <span
                className={`absolute w-4.5 h-4.5 bg-white rounded-full transition-all duration-200 ${
                  audioEnabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
