import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Briefcase, Landmark, ShieldAlert, LineChart, FileText, Globe, 
  Sparkles, CheckCircle2, ChevronRight, PhoneCall, User, Mail, FileCheck
} from "lucide-react";
import { motion } from "motion/react";

interface RbaServicesHubProps {
  currentUser: { id: string; name: string; email: string; phone?: string; phoneNumber?: string } | null;
  onTriggerAiWithQuery?: (prompt: string) => void;
  onNotificationCreated?: (title: string, text: string) => void;
}

export default function RbaServicesHub({ currentUser, onTriggerAiWithQuery, onNotificationCreated }: RbaServicesHubProps) {
  const [selectedService, setSelectedService] = useState<string>("Business Loan Assistance");
  const [customerName, setCustomerName] = useState(currentUser?.name || "");
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || "");
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || currentUser?.phoneNumber || "");
  const [businessTurnover, setBusinessTurnover] = useState<string>("Less than 10 Lakhs");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const servicesList = [
    {
      id: "srv_loan",
      title: "Loan & Funding Support",
      description: "Direct assistance with Business Loans, MSME credits, Home Finance, and Doctor professional funding.",
      details: ["Collateral-free options available", "Tie-ups with 25+ top Indian banks & NBFCs", "Dedicated documentation specialist support"],
      icon: Landmark,
      color: "from-emerald-500/20 to-teal-500/5",
      accent: "text-emerald-400"
    },
    {
      id: "srv_wealth",
      title: "Wealth & Insurance Plans",
      description: "Tailored SIP setups, mutual fund advice, tax-saver tax regimes, and family health/term insurance shields.",
      details: ["Personal risk appetite assessments", "SOP-compliant claim approval guarantees", "Automated portfolio allocation track"],
      icon: LineChart,
      color: "from-amber-500/20 to-orange-500/5",
      accent: "text-amber-400"
    },
    {
      id: "srv_compliance",
      title: "Corporate Setup & Taxation",
      description: "Hassle-free Private Limited setup, GST fillings, MSME certifications, and detailed Income Tax (ITR) Auditing.",
      details: ["Fast-track company name approvals", "SLA-backed monthly GST audits", "Digital signatures & DIN registration bundle"],
      icon: FileText,
      color: "from-blue-500/20 to-indigo-500/5",
      accent: "text-blue-400"
    },
    {
      id: "srv_tech",
      title: "AI & Software Automation",
      description: "Elevate your business setup with state-of-the-art web portals, AI customer chatbots, and full CRM integrations.",
      details: ["Highly responsive UI designs", "CRM & Google workspace APIs setup", "Gemini-powered auto-responders & leads parsers"],
      icon: Globe,
      color: "from-purple-500/20 to-pink-500/5",
      accent: "text-purple-400"
    }
  ];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setSuccess(false);

    const requestPayload = {
      userId: currentUser.id,
      customerName,
      customerEmail,
      customerPhone,
      selectedService,
      businessTurnover,
      notes,
      status: "new",
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, "service_requests"), requestPayload);
      setSuccess(true);
      setNotes("");
      if (onNotificationCreated) {
        onNotificationCreated(
          "Service Request Lodged",
          `Your request for "${selectedService}" has been successfully logged with RBA Corporate Office.`
        );
      }
    } catch (err) {
      console.error("Failed to lodge RBA service request:", err);
      alert("Something went wrong. Please check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-4 px-2 md:px-0 select-none">
      {/* Dynamic Header Banner */}
      <div className="text-center space-y-3.5">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <Briefcase className="w-8 h-8 text-emerald-400" />
          <span>Royal Bulls Advisory Services</span>
        </h2>
        <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Transition seamlessly from learning to execution. Access our professional financial, corporate compliance, and advanced tech advisory portfolios instantly.
        </p>
      </div>

      {/* Grid of services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servicesList.map((service) => {
          const Icon = service.icon;
          return (
            <div 
              key={service.id}
              className={`p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br ${service.color} flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${service.accent}`} />
                  </div>
                  <h4 className="font-extrabold text-white text-base tracking-tight">{service.title}</h4>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">{service.description}</p>
                <div className="space-y-2 pt-1">
                  {service.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedService(service.title);
                    document.getElementById("consultation-form-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white font-extrabold text-[11px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Select Service</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </button>
                {onTriggerAiWithQuery && (
                  <button
                    onClick={() => onTriggerAiWithQuery(`Act as a professional financial advisor. Explain the premium value of Royal Bulls Advisory's "${service.title}" specifically covering these items: ${service.details.join(", ")}. Provide an eligibility preparation list in bullet points.`)}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 hover:text-white rounded-xl transition cursor-pointer"
                    title="Get AI Advice on this Service"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Form + Instant Qualification Section */}
      <div id="consultation-form-section" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Booking Form Card */}
        <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-tight">Book Free Expert Consultation</h3>
              <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">DIRECT RBA INTERFACE</p>
            </div>
          </div>

          {success ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl text-center space-y-4"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-neutral-950 font-black text-xl shadow-lg">
                ✓
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-sm">Request Logged Successfully!</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Our professional lead advisors will analyze your profile and contact you within 2 business hours.
                </p>
              </div>
              <button 
                onClick={() => setSuccess(false)}
                className="py-2 px-5 bg-white text-neutral-950 font-extrabold text-xs rounded-xl hover:bg-neutral-100 transition"
              >
                Lodge another query
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Client Full Name
                  </label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 text-white rounded-2xl p-3.5 text-xs font-semibold outline-none border border-white/10 focus:border-emerald-500/50 transition"
                    placeholder="Enter full legal name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5" /> Call/WhatsApp Phone
                  </label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 text-white rounded-2xl p-3.5 text-xs font-semibold outline-none border border-white/10 focus:border-emerald-500/50 transition"
                    placeholder="+91 XXXXX-XXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 text-white rounded-2xl p-3.5 text-xs font-semibold outline-none border border-white/10 focus:border-emerald-500/50 transition"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Annual Turn-over / Salary
                  </label>
                  <select
                    value={businessTurnover}
                    onChange={(e) => setBusinessTurnover(e.target.value)}
                    className="w-full bg-neutral-900 text-white rounded-2xl p-3.5 text-xs font-semibold outline-none border border-white/10 focus:border-emerald-500/50 transition"
                  >
                    <option value="Less than 10 Lakhs">Less than INR 10 Lakhs</option>
                    <option value="10 Lakhs to 50 Lakhs">INR 10 Lakhs - 50 Lakhs</option>
                    <option value="50 Lakhs to 2 Crores">INR 50 Lakhs - 2 Crores</option>
                    <option value="Above 2 Crores">Above INR 2 Crores</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" /> Selected Service Target
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-neutral-900 text-white rounded-2xl p-3.5 text-xs font-semibold outline-none border border-white/10 focus:border-emerald-500/50 transition"
                >
                  <option value="Business Loan Assistance">Business Loan Assistance (MSME Credit)</option>
                  <option value="Home & LAP Financing">Home & LAP (Property Backed Funding)</option>
                  <option value="Personal / Professional Overdraft">Personal / Doctor Professional OD</option>
                  <option value="Mutual Fund & SIP Planning">Mutual Fund SIP & Wealth Management</option>
                  <option value="Business Registrations & GST setups">Business Registrations & GST setups</option>
                  <option value="Income Tax filings & Auditing">Income Tax filings & Auditing</option>
                  <option value="Web Portal & Technology Development">Custom Web Portals & Tech development</option>
                  <option value="AI automations & CRM implementation">AI workflow automations & CRM setup</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wider font-mono">
                  Additional Notes & Requirements
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                  rows={2}
                  className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 text-white rounded-2xl p-3.5 text-xs font-semibold outline-none border border-white/10 focus:border-emerald-500/50 transition resize-none"
                  placeholder="Detail your requirements (e.g., target loan amount, urgent setup timeline, etc.)"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black text-xs rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>LODGING CALLBACK...</span>
                  </>
                ) : (
                  <span>SUBMIT CONSULTATION REQUEST</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Qualification Criteria Sidebar */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">Instant Eligibility Matrix</h4>
            </div>
            
            <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
              Royal Bulls Advisory aligns with tier-1 Indian private and public lenders under RBI guidelines. Prepare standard CIBIL eligibility parameters prior to files login:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-[10px] space-y-1">
                <span className="font-extrabold text-white">★ CIBIL Threshold</span>
                <p className="text-neutral-400 leading-relaxed font-mono">750+ score for lowest ROI bracket. 700+ accepted for business LAP.</p>
              </div>

              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-[10px] space-y-1">
                <span className="font-extrabold text-white">★ Business Vintage</span>
                <p className="text-neutral-400 leading-relaxed font-mono">Minimum 2 years of verified GST/ITR registration filings required.</p>
              </div>

              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-[10px] space-y-1">
                <span className="font-extrabold text-white">★ Bank Statements</span>
                <p className="text-neutral-400 leading-relaxed font-mono">Latest 12 months PDF formats (E-statements with clear signatures).</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-center">
            <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-extrabold block">
              100% SECURE & CONFIDENTIAL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
