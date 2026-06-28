import React, { useState } from "react";
import { Course, Lesson } from "../types";
import { GraduationCap, Play, CheckCircle, HelpCircle, AlertCircle, ShieldAlert, BadgeCheck, Mic, ArrowRight, Sparkles } from "lucide-react";

interface AcademyLMSProps {
  currentUser: { id: string; name: string; role: string } | null;
  onCertificationUnlocked?: (courseName: string) => void;
  onTriggerAiWithQuery?: (query: string) => void;
}

const COURSES: Course[] = [
  {
    id: "course_loan",
    title: "Loan Advisor Academy",
    description: "Master personal, business, and mortgage financing sales structures.",
    lessons: [
      { id: "l1", title: "Introduction to Loan Products", duration: "12 mins", completed: true },
      { id: "l2", title: "KYC Compliance & Verification Standards", duration: "15 mins", completed: false },
      { id: "l3", title: "Overcoming High Interest Objection", duration: "18 mins", completed: false },
    ],
  },
  {
    id: "course_consult",
    title: "Business Consultant Academy",
    description: "Learn GST filings, MSME registration protocols, and scaling models.",
    lessons: [
      { id: "l4", title: "GST Filings & Corporate Tax Structures", duration: "20 mins", completed: false },
      { id: "l5", title: "MSME Scheme Benefits and Claim Forms", duration: "16 mins", completed: false },
    ],
  },
  {
    id: "course_ai",
    title: "AI Business Academy",
    description: "Unlocking LLMs, retrieval engines, and automated workflows.",
    lessons: [
      { id: "l6", title: "Introduction to Chat-First Workflows", duration: "10 mins", completed: true },
      { id: "l7", title: "Building RAG Enterprise Systems", duration: "25 mins", completed: false },
    ],
  }
];

export default function AcademyLMS({ currentUser, onCertificationUnlocked, onTriggerAiWithQuery }: AcademyLMSProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course>(COURSES[0]);
  const [activeTab, setActiveTab] = useState<"lessons" | "roleplay">("lessons");

  // Role Play Simulator states
  const [customerType, setCustomerType] = useState("Skeptical & Angry");
  const [product, setProduct] = useState("Personal Loan");
  const [roleplayHistory, setRoleplayHistory] = useState<{ role: "user" | "model"; text: string }[]>([
    {
      role: "model",
      text: "Hello, I am looking for a personal loan but I hear your interest rates are absolutely ridiculous. Why should I choose Royal Bulls Advisory over my local public sector bank?",
    }
  ]);
  const [roleplayInput, setRoleplayInput] = useState("");
  const [rpLoading, setRpLoading] = useState(false);
  const [coachingFeedback, setCoachingFeedback] = useState<{ score: number; objectionMet: boolean; feedback: string } | null>({
    score: 100,
    objectionMet: false,
    feedback: "Begin pitching. Emphasize customized interest rates, door-step service, and fast processing."
  });

  const handleLessonToggle = (lessonId: string) => {
    const updatedLessons = selectedCourse.lessons.map((l) =>
      l.id === lessonId ? { ...l, completed: !l.completed } : l
    );
    const updatedCourse = { ...selectedCourse, lessons: updatedLessons };
    setSelectedCourse(updatedCourse);

    // If all completed, trigger certification
    const allDone = updatedLessons.every((l) => l.completed);
    if (allDone && onCertificationUnlocked) {
      onCertificationUnlocked(selectedCourse.title);
    }
  };

  const handleRoleplaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleplayInput.trim() || rpLoading) return;

    const currentPitch = roleplayInput;
    setRoleplayInput("");
    setRpLoading(true);

    const updatedHistory = [...roleplayHistory, { role: "user" as const, text: currentPitch }];
    setRoleplayHistory(updatedHistory);

    try {
      const res = await fetch("/api/roleplay/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentPitch,
          history: updatedHistory.slice(-6),
          customerType,
          product,
        }),
      });

      if (!res.ok) throw new Error("Role-play session broke");
      const data = await res.json();
      const rawText = data.text;

      // Extract rating block from raw output
      let cleanText = rawText;
      let score = 75;
      let objectionMet = false;
      let feedback = "No coaching feedback captured. Keep pitching!";

      const ratingMatch = rawText.match(/<rating_report>([\s\S]*?)<\/rating_report>/);
      if (ratingMatch) {
        try {
          let jsonContent = ratingMatch[1].trim();
          // Remove potential markdown wrappers like ```json ... ```
          if (jsonContent.startsWith("```")) {
            jsonContent = jsonContent.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
          }
          const parsed = JSON.parse(jsonContent);
          score = typeof parsed.score === "number" ? parsed.score : 75;
          objectionMet = !!parsed.objectionMet;
          feedback = parsed.feedback || "Good progress, keep pitching!";
          cleanText = rawText.replace(/<rating_report>([\s\S]*?)<\/rating_report>/, "").trim();
        } catch (ex) {
          console.error("Evaluation parsing error", ex);
        }
      }

      setRoleplayHistory((prev) => [...prev, { role: "model" as const, text: cleanText }]);
      setCoachingFeedback({ score, objectionMet, feedback });
    } catch (err) {
      console.error(err);
      setRoleplayHistory((prev) => [
        ...prev,
        { role: "model" as const, text: "I apologize, my objection simulation is down for scheduled maintenance. Please pitch again shortly!" },
      ]);
    } finally {
      setRpLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-neutral-900 rounded-2xl text-white">
          <GraduationCap className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">RBA Academy</h2>
          <p className="text-xs text-neutral-400">Certify in high-ticket loan advisory & sales skills</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("lessons")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "lessons"
              ? "border-neutral-900 text-neutral-900"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          Curriculum Paths
        </button>
        <button
          onClick={() => setActiveTab("roleplay")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "roleplay"
              ? "border-neutral-900 text-neutral-900"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          AI Sales Practice (Role Play)
        </button>
      </div>

      {activeTab === "lessons" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Course Sidebar */}
          <div className="md:col-span-1 space-y-2.5">
            <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider font-mono">
              Available Academies
            </h4>
            {COURSES.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`w-full p-4 rounded-2xl border text-left transition ${
                  selectedCourse.id === course.id
                    ? "bg-neutral-950 text-white border-neutral-950 shadow"
                    : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200"
                }`}
              >
                <h4 className="font-bold text-xs">{course.title}</h4>
                <p className={`text-[10px] mt-1 line-clamp-2 ${selectedCourse.id === course.id ? "text-neutral-350" : "text-neutral-500"}`}>
                  {course.description}
                </p>
              </button>
            ))}
          </div>

          {/* Lessons List */}
          <div className="md:col-span-2 bg-white border border-neutral-200/60 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-neutral-950 text-sm tracking-tight">{selectedCourse.title}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{selectedCourse.description}</p>
            </div>

            <div className="space-y-3">
              {selectedCourse.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLessonToggle(lesson.id)}
                      className={`p-1 rounded-full transition ${
                        lesson.completed ? "text-emerald-500 hover:text-neutral-400" : "text-neutral-300 hover:text-emerald-500"
                      }`}
                    >
                      <CheckCircle className="w-5 h-5 fill-current" />
                    </button>
                    <div>
                      <span className="font-semibold text-neutral-800 block">{lesson.title}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Duration: {lesson.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onTriggerAiWithQuery && (
                      <button
                        onClick={() => onTriggerAiWithQuery(`Please explain the concept and key takeaways of the lesson: "${lesson.title}" from the course "${selectedCourse.title}" in a clear, easy-to-understand way, including objection-handling examples.`)}
                        className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold transition cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>AI Explain</span>
                      </button>
                    )}
                    <button className="flex items-center gap-1 bg-white hover:bg-neutral-900 border border-neutral-200 hover:text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-neutral-700 transition cursor-pointer">
                      <Play className="w-3 h-3 fill-current shrink-0" /> Play Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedCourse.lessons.every((l) => l.completed) && (
              <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl text-emerald-800 text-xs flex gap-2 items-center">
                <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-extrabold block">Certification Requirement Met!</span>
                  <p className="text-[11px] opacity-90 mt-0.5">Your official digital completion certificate is now ready for generation.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Sales Role Play Simulator with Objections */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Objections Controls */}
          <div className="md:col-span-1 bg-white border border-neutral-200/60 p-5 rounded-3xl shadow-sm space-y-4">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Objection Configuration
            </h4>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 block mb-1">
                Customer Temperament
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
              >
                <option value="Skeptical & Angry">Skeptical & Angry</option>
                <option value="Extremely Busy / Dismissive">Extremely Busy / Dismissive</option>
                <option value="Extremely Frugal / Price-Sensitive">Extremely Frugal / Price-Sensitive</option>
                <option value="Friendly but Indecisive">Friendly but Indecisive</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 block mb-1">
                Advisory Product
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
              >
                <option value="Personal Loan">Personal Loan</option>
                <option value="SME Working Capital Loan">SME Working Capital Loan</option>
                <option value="Mortgage Financing">Mortgage Financing</option>
              </select>
            </div>

            {coachingFeedback && (
              <div className="bg-neutral-900 text-white p-4.5 rounded-2xl space-y-3.5 border border-neutral-800">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase font-mono">
                    AI Evaluation
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-extrabold ${
                    coachingFeedback.score >= 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    Score: {coachingFeedback.score}/100
                  </span>
                </div>
                
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block mb-1 font-mono">
                    Objection Handled
                  </span>
                  <span className={`text-[11px] font-semibold ${
                    coachingFeedback.objectionMet ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {coachingFeedback.objectionMet ? "✓ Objection Met" : "✗ Objection Still Pending"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block mb-1 font-mono">
                    Sales Coaching Feedback
                  </span>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {coachingFeedback.feedback}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Roleplay Console */}
          <div className="md:col-span-2 flex flex-col h-[420px] bg-neutral-50 border border-neutral-200 p-4 rounded-3xl overflow-hidden shadow-inner">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {roleplayHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 max-w-[85%] ${
                    m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] border font-bold ${
                    m.role === "user" ? "bg-neutral-200 text-neutral-800" : "bg-neutral-950 text-white"
                  }`}>
                    {m.role === "user" ? "You" : "Client"}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs ${
                    m.role === "user" ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200 text-neutral-800 shadow-sm"
                  }`}>
                    <p className="leading-relaxed font-medium">{m.text}</p>
                  </div>
                </div>
              ))}
              {rpLoading && (
                <div className="flex gap-2.5 mr-auto max-w-[80%] items-center text-neutral-400 text-xs animate-pulse">
                  <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-[10px]">C</div>
                  <span>Client is contemplating your pitch...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleRoleplaySubmit} className="mt-4 flex gap-2">
              <input
                value={roleplayInput}
                onChange={(e) => setRoleplayInput(e.target.value)}
                placeholder="Pitch your objection handling answer..."
                className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-800 outline-none"
                required
              />
              <button
                type="submit"
                disabled={rpLoading || !roleplayInput.trim()}
                className="p-2.5 bg-neutral-950 text-white hover:bg-neutral-800 transition rounded-xl"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
