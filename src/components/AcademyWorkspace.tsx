import React, { useState } from "react";
import { GraduationCap, CheckCircle, Play, Sparkles, Award, Star, ArrowRight, ShieldCheck, FileText, CheckCircle2, RotateCcw, Check, AlertCircle } from "lucide-react";
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

interface QuizQuestion {
  question: string;
  options: string[];
  correctIdx: number;
}

const QUIZZES: Record<string, QuizQuestion[]> = {
  course_loan: [
    {
      question: "Which document is mandatory for identity verification under official RBI KYC standards?",
      options: [
        "Library membership or gym registration card",
        "Aadhaar Card, PAN Card, or Valid Passport",
        "A personal hand-written recommendation letter from a family member"
      ],
      correctIdx: 1
    },
    {
      question: "How should an RBA Advisor handle the customer objection 'Your interest rates are too high'?",
      options: [
        "Agree with the customer and hang up immediately",
        "Explain that high rates are due to market inflation and complain about bank policies",
        "Highlight custom loan structures, faster processing speed, door-step service, and absence of hidden charges"
      ],
      correctIdx: 2
    },
    {
      question: "What is a key benefit of SME working capital loans over general personal loans?",
      options: [
        "Calibrated higher borrowing limits specifically for business inventory and cash flow cycles",
        "Completely zero documentation required for any amount",
        "That the loan is fully exempted from standard business tax audits"
      ],
      correctIdx: 0
    }
  ],
  course_consult: [
    {
      question: "What is the standard annual turnover threshold requiring mandatory GST registration for service providers in India?",
      options: ["₹5 Lakhs", "₹20 Lakhs", "₹1 Crore"],
      correctIdx: 1
    },
    {
      question: "Which GST scheme is designed to simplify compliance for small taxpayers with simplified quarterly rates?",
      options: ["GST Composition Scheme", "GST Premium Sovereign Tier", "Universal Corporate Duty Waiver"],
      correctIdx: 0
    },
    {
      question: "How does obtaining an MSME registration certificate assist a small business in India?",
      options: [
        "It waives all central income tax liabilities permanently",
        "It grants access to priority sector bank lending, interest rate subsidies, and protection against delayed payments",
        "It provides free physical corporate offices across India"
      ],
      correctIdx: 1
    }
  ],
  course_ai: [
    {
      question: "What does 'RAG' stand for in modern enterprise AI systems?",
      options: ["Random Access Generation", "Retrieval-Augmented Generation", "Robust Application Gateways"],
      correctIdx: 1
    },
    {
      question: "Why is it recommended to perform Gemini API calls on the server instead of the browser?",
      options: [
        "Browsers are incapable of processing complex prompt requests",
        "To prevent exposure and theft of your secret API Key via the browser's developer console",
        "Because server proxies translate model responses into English automatically"
      ],
      correctIdx: 1
    },
    {
      question: "Which Gemini model is optimized for high-volume, fast response times, and general task automation?",
      options: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-ultra-heavy"],
      correctIdx: 1
    }
  ]
};

// Generates a beautiful SVG vector QR Code Matrix dynamically for verification
const renderQrCodeSvg = (text: string) => {
  return (
    <svg className="w-16 h-16 text-emerald-400 bg-white p-1 rounded-xl shadow-lg border border-emerald-500/20" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="white" />
      {/* Outer tracking squares */}
      <rect x="10" y="10" width="22" height="22" fill="#022c22" />
      <rect x="14" y="14" width="14" height="14" fill="white" />
      <rect x="17" y="17" width="8" height="8" fill="#022c22" />
      
      <rect x="68" y="10" width="22" height="22" fill="#022c22" />
      <rect x="72" y="14" width="14" height="14" fill="white" />
      <rect x="75" y="17" width="8" height="8" fill="#022c22" />

      <rect x="10" y="68" width="22" height="22" fill="#022c22" />
      <rect x="14" y="72" width="14" height="14" fill="white" />
      <rect x="17" y="75" width="8" height="8" fill="#022c22" />

      {/* Tiny alignment tracking squares */}
      <rect x="68" y="68" width="10" height="10" fill="#022c22" />
      <rect x="70" y="70" width="6" height="6" fill="white" />
      <rect x="72" y="72" width="2" height="2" fill="#022c22" />

      {/* Grid of random security QR-like data cells */}
      <rect x="42" y="10" width="5" height="5" fill="#022c22" />
      <rect x="50" y="15" width="5" height="5" fill="#022c22" />
      <rect x="42" y="25" width="5" height="5" fill="#022c22" />
      <rect x="52" y="22" width="5" height="5" fill="#022c22" />
      <rect x="10" y="42" width="5" height="5" fill="#022c22" />
      <rect x="25" y="48" width="5" height="5" fill="#022c22" />
      <rect x="18" y="52" width="5" height="5" fill="#022c22" />
      <rect x="35" y="42" width="5" height="5" fill="#022c22" />
      <rect x="42" y="42" width="5" height="5" fill="#022c22" />
      <rect x="48" y="42" width="5" height="5" fill="#022c22" />
      <rect x="52" y="48" width="5" height="5" fill="#022c22" />
      <rect x="60" y="42" width="5" height="5" fill="#022c22" />
      <rect x="10" y="52" width="5" height="5" fill="#022c22" />
      <rect x="30" y="52" width="5" height="5" fill="#022c22" />
      
      <rect x="75" y="42" width="5" height="5" fill="#022c22" />
      <rect x="82" y="48" width="5" height="5" fill="#022c22" />
      <rect x="88" y="42" width="5" height="5" fill="#022c22" />
      <rect x="82" y="55" width="5" height="5" fill="#022c22" />
      <rect x="42" y="65" width="5" height="5" fill="#022c22" />
      <rect x="52" y="72" width="5" height="5" fill="#022c22" />
      <rect x="48" y="80" width="5" height="5" fill="#022c22" />
      <rect x="55" y="85" width="5" height="5" fill="#022c22" />
      <rect x="82" y="80" width="5" height="5" fill="#022c22" />
      <rect x="88" y="85" width="5" height="5" fill="#022c22" />
    </svg>
  );
};

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

  // Quiz states
  const [activeQuizCourseId, setActiveQuizCourseId] = useState<string | null>(null);
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizError, setQuizError] = useState(false);

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
    }
  };

  // Quiz actions
  const startQuiz = (courseId: string) => {
    setActiveQuizCourseId(courseId);
    setQuizQuestionIdx(0);
    setQuizAnswers([]);
    setQuizScore(null);
    setQuizError(false);
  };

  const handleSelectQuizOption = (optionIdx: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[quizQuestionIdx] = optionIdx;
    setQuizAnswers(newAnswers);
  };

  const handleNextQuizQuestion = () => {
    if (quizAnswers[quizQuestionIdx] === undefined) return;
    
    const questions = QUIZZES[activeQuizCourseId || ""] || [];
    if (quizQuestionIdx < questions.length - 1) {
      setQuizQuestionIdx(quizQuestionIdx + 1);
    } else {
      // Complete and score the quiz automatically
      let correctCount = 0;
      questions.forEach((q, i) => {
        if (quizAnswers[i] === q.correctIdx) correctCount++;
      });
      
      setQuizScore(correctCount);
      
      if (correctCount === questions.length) {
        // Unlocked!
        if (activeQuizCourseId) {
          onCourseCompleted(activeQuizCourseId, selectedCourse.title);
        }
      } else {
        setQuizError(true);
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
                const isCertified = completedCourseIds.includes(course.id);
                return (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourse(course);
                      setActiveQuizCourseId(null); // Reset quiz view when swapping course
                    }}
                    className={`w-full p-5 rounded-3xl border text-left transition duration-200 cursor-pointer hover:-translate-y-0.5 ${
                      selectedCourse.id === course.id
                        ? "bg-white/[0.04] border-emerald-500/30 text-white shadow-xl"
                        : "bg-white/[0.01] hover:bg-white/[0.03] text-neutral-300 border-white/5"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm">{course.title}</h4>
                      {isCertified ? (
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-lg font-mono font-bold shrink-0">
                          Certified
                        </span>
                      ) : isFinished ? (
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-lg font-mono font-bold shrink-0">
                          Quiz Ready
                        </span>
                      ) : null}
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

            {/* Curriculum lessons list & Active Quiz Screen */}
            <div className="md:col-span-2 bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] shadow-xl space-y-6">
              {activeQuizCourseId === selectedCourse.id ? (
                // Active Interactive Quiz Panel
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-extrabold text-white">Certification Exam: {selectedCourse.title}</span>
                    </div>
                    <button 
                      onClick={() => setActiveQuizCourseId(null)}
                      className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition"
                    >
                      Cancel Exam
                    </button>
                  </div>

                  {quizScore === null ? (
                    // Quiz questions presentation
                    <div className="space-y-6">
                      <div className="flex justify-between text-xs font-mono font-bold text-neutral-400">
                        <span>QUESTION {quizQuestionIdx + 1} OF {(QUIZZES[activeQuizCourseId] || []).length}</span>
                        <span className="text-emerald-400">RBA Academic Standard</span>
                      </div>

                      <h4 className="text-sm font-extrabold text-white leading-relaxed">
                        {(QUIZZES[activeQuizCourseId || ""] || [])[quizQuestionIdx]?.question}
                      </h4>

                      <div className="space-y-2">
                        {(QUIZZES[activeQuizCourseId || ""] || [])[quizQuestionIdx]?.options.map((opt, oIdx) => {
                          const isSelected = quizAnswers[quizQuestionIdx] === oIdx;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectQuizOption(oIdx)}
                              className={`w-full p-4 rounded-2xl text-left text-xs font-bold border transition duration-150 cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                                  : "bg-neutral-900/40 border-white/5 hover:border-white/15 text-neutral-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                                  isSelected ? "border-emerald-400 text-emerald-300 bg-emerald-500/10" : "border-neutral-700 text-neutral-400"
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleNextQuizQuestion}
                          disabled={quizAnswers[quizQuestionIdx] === undefined}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{quizQuestionIdx < (QUIZZES[activeQuizCourseId || ""] || []).length - 1 ? "Next Question" : "Submit Exam"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Quiz grading reports
                    <div className="text-center py-6 space-y-6 max-w-md mx-auto">
                      {quizScore === (QUIZZES[activeQuizCourseId || ""] || []).length ? (
                        // Perfect Score: Certified!
                        <>
                          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                            <Check className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-base font-black text-white">Congratulations! Exam Passed 100%</h3>
                            <p className="text-xs text-neutral-400">
                              You answered all questions correctly and satisfied the accreditation requirements for <strong className="text-emerald-300 font-extrabold">{selectedCourse.title}</strong>.
                            </p>
                          </div>
                          <div className="bg-emerald-950/30 border border-emerald-500/10 p-4 rounded-xl text-xs text-emerald-400 font-bold">
                            🏆 Your dynamic verified certificate is ready under the "Certificates" tab.
                          </div>
                          <button
                            onClick={() => {
                              setActiveQuizCourseId(null);
                              setActiveSubTab("certificates");
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
                          >
                            Claim Digital Certificate
                          </button>
                        </>
                      ) : (
                        // Failed Score: Retry
                        <>
                          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mx-auto">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-base font-black text-white">Exam Not Cleared ({quizScore}/3)</h3>
                            <p className="text-xs text-neutral-400">
                              RBA professional certification requires a perfect score of 100% (3/3 answers correct) to ensure compliance standards.
                            </p>
                          </div>
                          <button
                            onClick={() => startQuiz(activeQuizCourseId || "")}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Retry Exam</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Course curriculum lessons view
                <>
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
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl text-emerald-400 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-3 items-center">
                        <Award className="w-6 h-6 text-emerald-400 shrink-0 animate-bounce" />
                        <div>
                          <span className="font-extrabold block text-sm">Certification Available!</span>
                          <p className="text-[11px] opacity-90 mt-0.5">
                            You have completed all mandatory modules. Clear the certification quiz to unlock your official credential.
                          </p>
                        </div>
                      </div>
                      
                      {completedCourseIds.includes(selectedCourse.id) ? (
                        <div className="text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl font-mono self-stretch sm:self-auto text-center">
                          ✓ Certified Partner
                        </div>
                      ) : (
                        <button
                          onClick={() => startQuiz(selectedCourse.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition whitespace-nowrap self-stretch sm:self-auto cursor-pointer"
                        >
                          Start Certification Exam
                        </button>
                      )}
                    </div>
                  )}
                </>
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
                      className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950 border-2 border-emerald-500/25 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden space-y-6 flex flex-col justify-between min-h-[360px]"
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
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-lg">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <span>QR Verified</span>
                            </div>
                            <span className="text-[8px] font-mono text-neutral-500">Scan to verify</span>
                          </div>
                          {renderQrCodeSvg(`https://rba-academy.web.app/verify/${certId}`)}
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
