import React, { useState } from "react";
import { GraduationCap, CheckCircle, Play, Sparkles, Award, Star, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Course, Lesson } from "../types";

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

interface AcademyWorkspaceProps {
  currentUser: { id: string; name: string } | null;
  completedCourseIds: string[];
  onCourseCompleted: (courseId: string, courseTitle: string) => void;
  onTriggerAiExplain: (query: string) => void;
}

export default function AcademyWorkspace({
  currentUser,
  completedCourseIds,
  onCourseCompleted,
  onTriggerAiExplain,
}: AcademyWorkspaceProps) {
  const [coursesState, setCoursesState] = useState<Course[]>(COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Course>(COURSES[0]);
  const [activeSubTab, setActiveSubTab] = useState<"curriculum" | "roleplay" | "certificates">("curriculum");

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

  const handleLessonToggle = (courseId: string, lessonId: string) => {
    const updatedCourses = coursesState.map((c) => {
      if (c.id === courseId) {
        const updatedLessons = c.lessons.map((l) =>
          l.id === lessonId ? { ...l, completed: !l.completed } : l
        );
        return { ...c, lessons: updatedLessons };
      }
      return c;
    });

    setCoursesState(updatedCourses);
    
    // Find matching course
    const matchingCourse = updatedCourses.find(c => c.id === courseId);
    if (matchingCourse) {
      setSelectedCourse(matchingCourse);
      
      // If all completed, trigger course completion
      const allDone = matchingCourse.lessons.every((l) => l.completed);
      if (allDone && !completedCourseIds.includes(courseId)) {
        onCourseCompleted(courseId, matchingCourse.title);
      }
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
      let feedback = "Good progression. Keep explaining benefits.";

      const ratingMatch = rawText.match(/<rating_report>([\s\S]*?)<\/rating_report>/);
      if (ratingMatch) {
        try {
          let jsonContent = ratingMatch[1].trim();
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
        { role: "model" as const, text: "My simulation engine is momentarily busy. Please continue pitching or retry!" },
      ]);
    } finally {
      setRpLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl text-white shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">RBA Academy</h2>
            <p className="text-xs text-neutral-400">Certify in Loan Advisory, Corporate tax planning, and AI Consulting</p>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab("curriculum")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeSubTab === "curriculum" ? "bg-emerald-600 text-white shadow" : "text-neutral-400 hover:text-white"
            }`}
          >
            Curriculum
          </button>
          <button
            onClick={() => setActiveSubTab("roleplay")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeSubTab === "roleplay" ? "bg-emerald-600 text-white shadow" : "text-neutral-400 hover:text-white"
            }`}
          >
            AI Roleplay Gym
          </button>
          <button
            onClick={() => setActiveSubTab("certificates")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeSubTab === "certificates" ? "bg-emerald-600 text-white shadow" : "text-neutral-400 hover:text-white"
            }`}
          >
            Certificates
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Curriculum tab */}
        {activeSubTab === "curriculum" && (
          <motion.div
            key="curriculum"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Left Course List */}
            <div className="md:col-span-1 space-y-3">
              <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono">
                Enrollment Paths
              </h4>
              {coursesState.map((course) => {
                const completedCount = course.lessons.filter((l) => l.completed).length;
                const isFinished = completedCount === course.lessons.length;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full p-5 rounded-3xl border text-left transition duration-200 cursor-pointer hover:-translate-y-0.5 ${
                      selectedCourse.id === course.id
                        ? "bg-white/[0.04] border-emerald-500/30 text-white shadow-xl"
                        : "bg-white/[0.01] hover:bg-white/[0.03] text-neutral-300 border-white/5"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm">{course.title}</h4>
                      {isFinished && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-lg font-mono font-bold shrink-0">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[10px] font-mono font-bold text-neutral-500">
                      <span>{course.lessons.length} LESSONS</span>
                      <span className="text-emerald-400">{completedCount} Completed</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Curriculum lessons list */}
            <div className="md:col-span-2 bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] shadow-xl space-y-6">
              <div>
                <h3 className="font-bold text-white text-base tracking-tight">{selectedCourse.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{selectedCourse.description}</p>
              </div>

              <div className="space-y-3">
                {selectedCourse.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl text-xs transition duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLessonToggle(selectedCourse.id, lesson.id)}
                        className={`p-1 rounded-full transition cursor-pointer ${
                          lesson.completed ? "text-emerald-500 hover:text-neutral-500" : "text-neutral-600 hover:text-emerald-500"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 fill-current" />
                      </button>
                      <div>
                        <span className="font-bold text-neutral-100 block">{lesson.title}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">Duration: {lesson.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTriggerAiExplain(`Please explain the concept and key takeaways of the lesson: "${lesson.title}" from the course "${selectedCourse.title}" in a clear, easy-to-understand way, including objection-handling examples.`)}
                        className="flex items-center gap-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl px-3 py-2 text-[10px] font-bold transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Explain</span>
                      </button>
                      <button className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl px-3 py-2 text-[10px] font-bold transition cursor-pointer">
                        <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>Play</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCourse.lessons.every((l) => l.completed) && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-emerald-400 text-xs flex gap-3 items-center">
                  <Award className="w-6 h-6 text-emerald-400 shrink-0 animate-bounce" />
                  <div>
                    <span className="font-extrabold block text-sm">Certification Available!</span>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      You have passed all modules of the {selectedCourse.title}. You can now view and download your digital certification.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Roleplay Gym Tab */}
        {activeSubTab === "roleplay" && (
          <motion.div
            key="roleplay"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Configurations panel */}
            <div className="md:col-span-1 bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] shadow-xl space-y-5">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Simulation Setup
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase font-mono">
                    Customer Persona
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    <option value="Skeptical & Angry">Skeptical & Angry</option>
                    <option value="Extremely Busy / Dismissive">Extremely Busy / Dismissive</option>
                    <option value="Extremely Frugal / Price-Sensitive">Extremely Frugal / Price-Sensitive</option>
                    <option value="Friendly but Indecisive">Friendly but Indecisive</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1.5 uppercase font-mono">
                    Financial Product
                  </label>
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="SME Working Capital Loan">SME Working Capital Loan</option>
                    <option value="Mortgage Financing">Mortgage Financing</option>
                  </select>
                </div>
              </div>

              {coachingFeedback && (
                <div className="bg-neutral-950/80 p-5 rounded-2xl space-y-4 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase font-mono">
                      AI Assessment
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                      coachingFeedback.score >= 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      Score: {coachingFeedback.score}/100
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block mb-1 font-mono">
                      Objection Check
                    </span>
                    <span className={`text-[11px] font-semibold ${
                      coachingFeedback.objectionMet ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {coachingFeedback.objectionMet ? "✓ Objection Satisfied" : "✗ Objection Still Raised"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block font-mono">
                      AI Tutor Feedback
                    </span>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {coachingFeedback.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Console */}
            <div className="md:col-span-2 flex flex-col h-[460px] bg-white/[0.01] border border-white/5 p-4 rounded-[2.5rem] overflow-hidden shadow-inner">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {roleplayHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[85%] ${
                      m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold border ${
                      m.role === "user" ? "bg-white/10 border-white/15 text-white" : "bg-emerald-950 border-emerald-500/20 text-emerald-300"
                    }`}>
                      {m.role === "user" ? "Y" : "C"}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === "user" ? "bg-white/[0.08] text-white rounded-tr-sm" : "bg-white/[0.02] border border-white/5 text-neutral-200 rounded-tl-sm shadow-sm"
                    }`}>
                      <p className="font-sans">{m.text}</p>
                    </div>
                  </div>
                ))}
                {rpLoading && (
                  <div className="flex gap-3 mr-auto max-w-[80%] items-center text-neutral-400 text-xs animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center font-bold text-xs text-emerald-400">C</div>
                    <div className="flex gap-1.5 items-center bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleRoleplaySubmit} className="mt-4 flex gap-2 pt-3 border-t border-white/5">
                <input
                  value={roleplayInput}
                  onChange={(e) => setRoleplayInput(e.target.value)}
                  placeholder="Pitch your response to the customer..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition"
                  required
                />
                <button
                  type="submit"
                  disabled={rpLoading || !roleplayInput.trim()}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 transition rounded-xl text-white cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Certificates Tab */}
        {activeSubTab === "certificates" && (
          <motion.div
            key="certificates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {completedCourseIds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedCourseIds.map((courseId) => {
                  const title = coursesState.find(c => c.id === courseId)?.title || "RBA Specialist Certificate";
                  const certId = `CERT-${courseId.toUpperCase().replace("COURSE_", "")}-${Math.floor(Math.random() * 89999 + 10000)}`;
                  return (
                    <div
                      key={courseId}
                      className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950 border-2 border-emerald-500/25 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden space-y-6 flex flex-col justify-between min-h-[340px]"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                      
                      {/* Logo and Seal Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono block">
                            OFFICIAL CERTIFICATE
                          </span>
                          <h4 className="font-extrabold text-white text-base tracking-tight leading-tight">
                            ROYAL BULLS ADVISORY
                          </h4>
                        </div>
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
                          <Award className="w-6 h-6" />
                        </div>
                      </div>

                      {/* Certificate Text details */}
                      <div className="space-y-3">
                        <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-widest">
                          PROUDLY CERTIFIED TO
                        </p>
                        <h3 className="text-xl font-black text-white tracking-tight">
                          {currentUser?.name || "RBA Advisor Partner"}
                        </h3>
                        <p className="text-xs text-neutral-300 leading-relaxed max-w-sm">
                          For having successfully completed all mandatory curriculums, examinations, and objection simulations of the <strong className="text-emerald-300 font-extrabold">{title}</strong>.
                        </p>
                      </div>

                      {/* Footer signatures and IDs */}
                      <div className="flex justify-between items-end border-t border-white/5 pt-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-neutral-500 font-mono">CERTIFICATE ID</p>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">{certId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-xl">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>QR Verified</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 bg-white/[0.01] border border-white/5 rounded-[2.5rem] text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-neutral-500 mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No active certifications</h3>
                  <p className="text-xs text-neutral-400">
                    Complete all lessons of any course path in the Curriculum section to unlock your certified digital badges and QR verification documents.
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubTab("curriculum")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <span>Go to Curriculum</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
