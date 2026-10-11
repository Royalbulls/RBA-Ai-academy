import { FormEvent, useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Building2, Check,
  ChevronDown, CircleHelp, Clock3, FileCheck2, IndianRupee, Languages,
  Lightbulb, LockKeyhole, Menu, MessageCircle, Search, ShieldCheck,
  Sparkles, Store, TrendingUp, Users, WalletCards, X, Zap
} from "lucide-react";
import { appCheckConfigured, auth, db, firebaseConfigured, functions } from "./firebase";

type Lang = "en" | "hi";
type Application = {
  id: string; applicationCode?: string; name: string; phone: string; city: string;
  state: string; category: string; stage: string; budget: string; mode: string;
  help: string; status: string; createdAt?: { toDate?: () => Date };
};
const copy = {
  en: {
    navServices: "Services", navHow: "How it works", navPricing: "Pricing", navFaq: "FAQs",
    signIn: "Staff sign in", getStarted: "Get started", badge: "YOUR BUSINESS STARTS HERE",
    hero1: "Turn your idea into", hero2: "a real business.",
    heroDesc: "Practical startup guidance for India's next generation of entrepreneurs. Get a clear plan, understand the costs, and take your next step with confidence.",
    start: "Build my startup plan", explore: "Explore services", trusted: "Practical guidance. Clear scope. No false promises.",
    stat1: "From idea to launch", stat2: "Built for small businesses", stat3: "India-wide online support",
    servicesEyebrow: "HOW WE HELP", servicesTitle: "One partner for your next step.",
    servicesDesc: "Choose the help you need today. Start small and add support as your business becomes clearer.",
    idea: "Business idea discovery", ideaDesc: "Shortlist business options around your budget, skills, location and customer demand.",
    plan: "Business planning", planDesc: "Map startup costs, customers, pricing, risks and a practical 90-day action plan.",
    setup: "Setup assistance", setupDesc: "Get a checklist for suppliers, registrations, tools and operational readiness.",
    growth: "Marketing & growth", growthDesc: "Plan your first campaign, digital catalogue and customer acquisition approach.",
    howEyebrow: "A SIMPLE PROCESS", howTitle: "From first conversation to first steps.",
    step1: "Tell us your goal", step1d: "Share your idea, budget, location and what kind of help you need.",
    step2: "Get a practical plan", step2d: "We assess your needs and define a service scope, assumptions and next steps.",
    step3: "Build and improve", step3d: "Work through your agreed deliverables, then review progress and refine the plan.",
    pricingEyebrow: "CLEAR, STARTER-FRIENDLY PRICING", pricingTitle: "Choose your starting point.",
    pricingDesc: "Proposed pilot prices. You will see the exact deliverables and exclusions before paying.",
    choose: "Choose this service", popular: "MOST POPULAR", priceNote: "One-time proposed fee",
    p1: "Startup Discovery", p1d: "An initial needs assessment and recommended next steps.",
    p2: "Business Idea Report", p2d: "2–3 idea options, preliminary cost ranges, assumptions and risks.",
    p3: "Business Plan Pro", p3d: "Business model, target customer, pricing logic and 90-day action plan.",
    p4: "Startup Setup Assist", p4d: "A scoped setup checklist and supplier/process research.",
    p5: "Business Launch Partner", p5d: "Agreed launch support, marketing assets and an early-stage review.",
    formEyebrow: "TAKE THE FIRST STEP", formTitle: "Tell us about your business.",
    formDesc: "Share a few details. Our team can review your request and contact you about suitable next steps.",
    name: "Full name", phone: "Mobile number", city: "City / district", state: "State",
    language: "Preferred language", category: "Business category", stage: "Where are you today?",
    budget: "Available investment", mode: "Business format", help: "What help do you need?",
    description: "Tell us a little more (optional)", submit: "Submit my application",
    submitting: "Submitting securely…", consent: "I agree to be contacted about this request and have read the privacy notice.",
    privacy: "Privacy notice", noGuarantee: "Submitting this form does not guarantee business success, finance, grants, licences or government benefits.",
    successTitle: "Your request is received", successDesc: "Save this reference code for follow-up.",
    copyCode: "Copy reference", copied: "Copied", formError: "We could not submit your request. Please check the details and try again.",
    setupNeeded: "Portal setup required", setupDesc: "The application service is not configured yet. Please contact the company directly; this form will not pretend to submit your data.",
    faqEyebrow: "GOOD TO KNOW", faqTitle: "Questions, answered.",
    faq1: "Do you guarantee business success or a loan?", faq1a: "No. We provide advisory and setup assistance. Results depend on the market, execution and eligibility. Loans, grants, licences and government benefits are decided by the relevant provider or authority.",
    faq2: "Are government registrations included in the package price?", faq2a: "Our advisory fee covers only the deliverables listed in the proposal. Government fees, professional fees and third-party charges are disclosed separately where applicable.",
    faq3: "Can I start with a small budget?", faq3a: "Yes. We can explore lower-investment options, but any cost estimate is preliminary and should be validated with local suppliers and customers.",
    faq4: "Do you serve customers outside Madhya Pradesh?", faq4a: "The mission is designed for India-wide online assistance. Local rules, service availability and professional requirements may vary by state.",
    footerLine: "Practical guidance for people ready to build.", footerLinks: "Useful links",
    adminTitle: "Staff workspace", adminDesc: "Sign in with an authorised staff account to review applications.",
    email: "Work email", password: "Password", login: "Sign in", logout: "Sign out",
    dashboard: "Application desk", total: "Applications", search: "Search name, city or reference…",
    all: "All statuses", refresh: "Live updates", noApps: "No applications match this filter.",
    status: "Status", updateStatus: "Update status", internalNote: "Internal note (optional)", save: "Save update",
    forbidden: "This account does not have startup staff access.", back: "Back to website",
    errorLogin: "Sign-in failed. Check your credentials and staff permissions.",
    new: "New", contact_pending: "Contact pending", qualified: "Qualified", not_qualified: "Not qualified",
    consultation_scheduled: "Consultation scheduled", proposal_sent: "Proposal sent", awaiting_payment: "Awaiting payment",
    paid: "Paid", in_progress: "In progress", review: "In review", delivered: "Delivered", follow_up: "Follow-up",
    closed: "Closed", on_hold: "On hold", cancelled: "Cancelled"
  },
  hi: {
    navServices: "सेवाएँ", navHow: "कैसे काम करता है", navPricing: "फीस", navFaq: "सवाल-जवाब",
    signIn: "स्टाफ लॉगिन", getStarted: "शुरू करें", badge: "आपके बिजनेस की शुरुआत यहाँ",
    hero1: "अपने आइडिया को", hero2: "बिजनेस में बदलें।",
    heroDesc: "भारत के नए उद्यमियों के लिए व्यावहारिक मार्गदर्शन। स्पष्ट योजना बनाएँ, लागत समझें और आत्मविश्वास के साथ अगला कदम उठाएँ।",
    start: "मेरा स्टार्टअप प्लान बनाएँ", explore: "सेवाएँ देखें", trusted: "व्यावहारिक सलाह। स्पष्ट काम। कोई झूठे वादे नहीं।",
    stat1: "आइडिया से लॉन्च तक", stat2: "छोटे कारोबार के लिए", stat3: "पूरे भारत में ऑनलाइन सहायता",
    servicesEyebrow: "हम कैसे मदद करते हैं", servicesTitle: "आपके अगले कदम के लिए एक साथी।",
    servicesDesc: "आज जिस मदद की जरूरत है, वहीं से शुरू करें। जरूरत के अनुसार आगे सहायता लें।",
    idea: "बिजनेस आइडिया खोजें", ideaDesc: "आपके बजट, कौशल, स्थान और ग्राहक मांग के अनुसार बिजनेस विकल्प चुनें।",
    plan: "बिजनेस प्लानिंग", planDesc: "शुरुआती लागत, ग्राहक, कीमत, जोखिम और 90 दिन की कार्ययोजना बनाएँ।",
    setup: "सेटअप सहायता", setupDesc: "सप्लायर, पंजीकरण, टूल और संचालन की चेकलिस्ट पाएँ।",
    growth: "मार्केटिंग और ग्रोथ", growthDesc: "पहला प्रचार अभियान, डिजिटल कैटलॉग और ग्राहक बनाने की रणनीति तैयार करें।",
    howEyebrow: "आसान प्रक्रिया", howTitle: "पहली बातचीत से पहले कदम तक।",
    step1: "अपना लक्ष्य बताएँ", step1d: "अपना आइडिया, बजट, स्थान और सहायता की जरूरत साझा करें।",
    step2: "व्यावहारिक योजना पाएँ", step2d: "हम जरूरत समझकर काम का दायरा, अनुमान और अगले कदम तय करेंगे।",
    step3: "शुरू करें और सुधारें", step3d: "सहमति के अनुसार काम पूरा करें, प्रगति की समीक्षा करें और योजना सुधारें।",
    pricingEyebrow: "स्पष्ट शुरुआती फीस", pricingTitle: "अपने हिसाब से शुरुआत चुनें।",
    pricingDesc: "ये प्रस्तावित शुरुआती कीमतें हैं। भुगतान से पहले काम और सीमाएँ स्पष्ट होंगी।",
    choose: "यह सेवा चुनें", popular: "सबसे लोकप्रिय", priceNote: "एक बार की प्रस्तावित फीस",
    p1: "स्टार्टअप डिस्कवरी", p1d: "शुरुआती जरूरतों का आकलन और अगले कदम।",
    p2: "बिजनेस आइडिया रिपोर्ट", p2d: "2–3 आइडिया, अनुमानित लागत, मान्यताएँ और जोखिम।",
    p3: "बिजनेस प्लान प्रो", p3d: "बिजनेस मॉडल, ग्राहक, कीमत तय करने का आधार और 90 दिन की योजना।",
    p4: "स्टार्टअप सेटअप सहायता", p4d: "सेटअप चेकलिस्ट और सप्लायर/प्रक्रिया रिसर्च।",
    p5: "बिजनेस लॉन्च पार्टनर", p5d: "सहमति के अनुसार लॉन्च सहायता, प्रचार सामग्री और शुरुआती समीक्षा।",
    formEyebrow: "पहला कदम उठाएँ", formTitle: "अपने बिजनेस के बारे में बताएँ।",
    formDesc: "कुछ जानकारी साझा करें। हमारी टीम आपकी जरूरत देखकर अगले कदम पर संपर्क कर सकती है।",
    name: "पूरा नाम", phone: "मोबाइल नंबर", city: "शहर / जिला", state: "राज्य",
    language: "पसंदीदा भाषा", category: "बिजनेस श्रेणी", stage: "आप अभी किस स्थिति में हैं?",
    budget: "उपलब्ध निवेश", mode: "बिजनेस का प्रकार", help: "किस सहायता की जरूरत है?",
    description: "थोड़ा और बताएँ (वैकल्पिक)", submit: "मेरा आवेदन भेजें",
    submitting: "सुरक्षित रूप से भेज रहे हैं…", consent: "मैं इस अनुरोध के बारे में संपर्क करने की सहमति देता/देती हूँ और गोपनीयता सूचना पढ़ ली है।",
    privacy: "गोपनीयता सूचना", noGuarantee: "फॉर्म भेजने से बिजनेस सफलता, लोन, अनुदान, लाइसेंस या सरकारी लाभ की गारंटी नहीं मिलती।",
    successTitle: "आपका अनुरोध प्राप्त हुआ", successDesc: "आगे संपर्क के लिए यह रेफरेंस कोड सुरक्षित रखें।",
    copyCode: "रेफरेंस कॉपी करें", copied: "कॉपी हो गया", formError: "आवेदन नहीं भेजा जा सका। जानकारी जाँचकर फिर प्रयास करें।",
    setupNeeded: "पोर्टल सेटअप बाकी है", setupDesc: "आवेदन सेवा अभी कॉन्फ़िगर नहीं है। कृपया कंपनी से सीधे संपर्क करें; यह फॉर्म आपके डेटा को भेजने का झूठा दावा नहीं करेगा।",
    faqEyebrow: "जानने योग्य बातें", faqTitle: "आपके सवालों के जवाब।",
    faq1: "क्या बिजनेस सफलता या लोन की गारंटी है?", faq1a: "नहीं। हम सलाह और सेटअप सहायता देते हैं। परिणाम बाजार, काम और पात्रता पर निर्भर हैं। लोन, अनुदान, लाइसेंस और सरकारी लाभ संबंधित संस्था या विभाग तय करता है।",
    faq2: "क्या सरकारी पंजीकरण पैकेज में शामिल हैं?", faq2a: "फीस में केवल प्रस्ताव में लिखी सेवाएँ शामिल हैं। सरकारी फीस, विशेषज्ञ फीस और बाहरी खर्च जहाँ लागू हों, अलग बताए जाएँगे।",
    faq3: "क्या कम बजट से शुरुआत हो सकती है?", faq3a: "हाँ। हम कम निवेश वाले विकल्प खोज सकते हैं, लेकिन लागत के अनुमान स्थानीय सप्लायर और ग्राहकों से जाँचने होंगे।",
    faq4: "क्या मध्य प्रदेश के बाहर भी सेवा मिलेगी?", faq4a: "यह मिशन पूरे भारत में ऑनलाइन सहायता के लिए बनाया जा रहा है। राज्य के अनुसार नियम और सेवा उपलब्धता अलग हो सकती है।",
    footerLine: "बिजनेस बनाने वालों के लिए व्यावहारिक मार्गदर्शन।", footerLinks: "जरूरी लिंक",
    adminTitle: "स्टाफ कार्यक्षेत्र", adminDesc: "आवेदन देखने के लिए अधिकृत स्टाफ खाते से लॉगिन करें।",
    email: "ऑफिस ईमेल", password: "पासवर्ड", login: "लॉगिन", logout: "लॉगआउट",
    dashboard: "आवेदन डेस्क", total: "आवेदन", search: "नाम, शहर या रेफरेंस खोजें…",
    all: "सभी स्टेटस", refresh: "लाइव अपडेट", noApps: "इस फ़िल्टर में कोई आवेदन नहीं मिला।",
    status: "स्थिति", updateStatus: "स्थिति अपडेट करें", internalNote: "आंतरिक नोट (वैकल्पिक)", save: "अपडेट सेव करें",
    forbidden: "इस खाते को स्टार्टअप स्टाफ की अनुमति नहीं है।", back: "वेबसाइट पर वापस जाएँ",
    errorLogin: "लॉगिन विफल। विवरण और स्टाफ अनुमति जाँचें।",
    new: "नया", contact_pending: "संपर्क बाकी", qualified: "योग्य", not_qualified: "अयोग्य",
    consultation_scheduled: "परामर्श तय", proposal_sent: "प्रस्ताव भेजा", awaiting_payment: "भुगतान बाकी",
    paid: "भुगतान हुआ", in_progress: "काम जारी", review: "समीक्षा में", delivered: "डिलीवर",
    follow_up: "फॉलो-अप", closed: "बंद", on_hold: "रुका हुआ", cancelled: "रद्द"
  }
} as const;

const packages = [
  { id: "discovery", price: "₹99", titleKey: "p1", descKey: "p1d", icon: Lightbulb, features: ["Needs assessment", "Recommended next steps"] },
  { id: "idea", price: "₹499", titleKey: "p2", descKey: "p2d", icon: Sparkles, features: ["2–3 business options", "Preliminary cost ranges"] },
  { id: "plan", price: "₹999", titleKey: "p3", descKey: "p3d", icon: BriefcaseBusiness, popular: true, features: ["Business model & customers", "90-day action plan"] },
  { id: "setup", price: "₹1,999", titleKey: "p4", descKey: "p4d", icon: Building2, features: ["Setup checklist", "Supplier/process research"] },
  { id: "launch", price: "₹2,999+", titleKey: "p5", descKey: "p5d", icon: TrendingUp, features: ["Scoped launch support", "Early-stage review"] }
];
const categories = ["Retail & Trading", "Food & Beverage", "Professional Services", "Manufacturing", "Digital / Online", "Agriculture", "Education & Training", "Beauty & Wellness", "Home Business", "Other"];
const stages = ["Idea stage", "Planning", "Existing business", "Business expansion"];
const budgets = ["Below ₹5,000", "₹5,000–₹15,000", "₹15,000–₹50,000", "₹50,000–₹2 lakh", "Above ₹2 lakh", "Not decided"];
const statuses = ["new", "contact_pending", "qualified", "not_qualified", "consultation_scheduled", "proposal_sent", "awaiting_payment", "paid", "in_progress", "review", "delivered", "follow_up", "closed", "on_hold", "cancelled"];
const faqs = [["faq1", "faq1a"], ["faq2", "faq2a"], ["faq3", "faq3a"], ["faq4", "faq4a"]] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
function App() {
  const [lang, setLang] = useState<Lang>("hi");
  const [mobileNav, setMobileNav] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [adminMode, setAdminMode] = useState(window.location.pathname.startsWith("/admin"));
  const [user, setUser] = useState<User | null>(null);
  const [staffAllowed, setStaffAllowed] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [statusDraft, setStatusDraft] = useState("contact_pending");
  const [adminBusy, setAdminBusy] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [successCode, setSuccessCode] = useState("");
  const [copied, setCopied] = useState(false);
  const t = copy[lang];
  const [form, setForm] = useState({
    name: "", phone: "", city: "", state: "Madhya Pradesh", language: "Hindi",
    category: "Retail & Trading", stage: "Idea stage", budget: "₹5,000–₹15,000",
    mode: "Offline", help: "Business idea", description: "", consent: false, website: ""
  });

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async current => {
      setUser(current);
      if (current) {
        const token = await current.getIdTokenResult(true);
        setStaffAllowed(token.claims.admin === true || token.claims.startupAdvisor === true);
      } else setStaffAllowed(false);
    });
  }, []);

  useEffect(() => {
    if (!adminMode || !db || !staffAllowed) return;
    const q = query(collection(db, "startupApplications"), orderBy("createdAtMs", "desc"));
    return onSnapshot(q, snap => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
    }, err => setAdminError(err.message));
  }, [adminMode, staffAllowed]);

  const visibleApplications = useMemo(() => applications.filter(a => {
    const q = search.toLowerCase();
    const matchesText = !q || [a.name, a.city, a.state, a.applicationCode, a.phone].some(v => String(v ?? "").toLowerCase().includes(q));
    return matchesText && (filterStatus === "all" || a.status === filterStatus);
  }), [applications, search, filterStatus]);

  const jumpToForm = (selectedHelp?: string) => {
    if (selectedHelp) setForm(f => ({ ...f, help: selectedHelp }));
    setMobileNav(false);
    if (adminMode) {
      window.history.pushState({}, "", "/");
      setAdminMode(false);
      setTimeout(() => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" }), 100);
    } else document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
  };

  const submitApplication = async (e: FormEvent) => {
    e.preventDefault(); setFormError(""); setSuccessCode("");
    if (!form.consent) { setFormError("Please agree to the contact and privacy notice."); return; }
    if (!functions || !firebaseConfigured || !appCheckConfigured) { setFormError(t.setupDesc); return; }
    setFormBusy(true);
    try {
      const submit = httpsCallable(functions, "submitStartupApplication");
      const result = await submit(form);
      const data = result.data as { success: boolean; applicationCode: string };
      setSuccessCode(data.applicationCode);
      setForm({ ...form, name: "", phone: "", city: "", category: "Retail & Trading", stage: "Idea stage", description: "", consent: false, website: "" });
    } catch (err) {
      console.error(err);
      setFormError(t.formError);
    } finally { setFormBusy(false); }
  };

  const login = async (e: FormEvent) => {
    e.preventDefault(); setAdminError("");
    if (!auth) { setAdminError(t.setupDesc); return; }
    try {
      const credential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const token = await credential.user.getIdTokenResult(true);
      if (token.claims.admin !== true && token.claims.startupAdvisor !== true) {
        await signOut(auth); setAdminError(t.forbidden); return;
      }
      setStaffAllowed(true);
    } catch { setAdminError(t.errorLogin); }
  };

  const updateStatus = async (id: string) => {
    if (!functions) return;
    setAdminBusy(true); setAdminError("");
    try {
      const update = httpsCallable(functions, "updateStartupApplicationStatus");
      await update({ id, status: statusDraft, note });
      setActiveRow(null); setNote("");
    } catch { setAdminError("Could not update this application. Check staff permissions and try again."); }
    finally { setAdminBusy(false); }
  };

  if (adminMode) {
    return <div className="admin-shell">
      <header className="admin-top"><a href="/" className="brand" onClick={e => { e.preventDefault(); window.history.pushState({}, "", "/"); setAdminMode(false); }}><span className="brand-mark">RB</span><span>RBA <b>STARTUP MISSION</b></span></a><button className="button button-ghost" onClick={() => { window.history.pushState({}, "", "/"); setAdminMode(false); }}>{t.back}</button></header>
      {!user ? <main className="admin-login"><div className="eyebrow"><LockKeyhole size={15}/>{t.signIn}</div><h1>{t.adminTitle}</h1><p>{t.adminDesc}</p><form onSubmit={login} className="stack-form"><Field label={t.email}><input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required autoComplete="username"/></Field><Field label={t.password}><input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required autoComplete="current-password"/></Field><button className="button button-primary" disabled={adminBusy}>{t.login}<ArrowRight size={17}/></button>{adminError && <p className="error-box">{adminError}</p>}</form><p className="small muted">Access is restricted to accounts with trusted Firebase custom claims.</p></main>
      : !staffAllowed ? <main className="admin-login"><ShieldCheck size={34}/><h1>{t.forbidden}</h1><button className="button button-ghost" onClick={() => signOut(auth!)}>{t.logout}</button></main>
      : <main className="admin-main"><div className="admin-heading"><div><div className="eyebrow"><ShieldCheck size={15}/>{t.dashboard}</div><h1>{t.dashboard}</h1><p className="muted">{t.refresh} · {visibleApplications.length} {t.total.toLowerCase()}</p></div><button className="button button-ghost" onClick={() => signOut(auth!)}>{t.logout}</button></div>
        <div className="metric-grid"><div className="metric-card"><span>{t.total}</span><strong>{applications.length}</strong></div><div className="metric-card"><span>{t.new}</span><strong>{applications.filter(a => a.status === "new").length}</strong></div><div className="metric-card"><span>{t.in_progress}</span><strong>{applications.filter(a => a.status === "in_progress").length}</strong></div><div className="metric-card"><span>{t.delivered}</span><strong>{applications.filter(a => a.status === "delivered").length}</strong></div></div>
        <div className="table-tools"><label className="searchbox"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search}/></label><select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">{t.all}</option>{statuses.map(s => <option key={s} value={s}>{(t as Record<string,string>)[s] || s}</option>)}</select></div>
        {adminError && <p className="error-box">{adminError}</p>}
        <div className="applications-list">{visibleApplications.map(a => <article className="application-card" key={a.id}><div className="application-top"><div><span className="ref-code">{a.applicationCode || a.id}</span><h3>{a.name}</h3><p>{a.city}, {a.state} · {a.phone}</p></div><span className={"status-pill status-" + a.status}>{(t as Record<string,string>)[a.status] || a.status}</span></div><div className="application-meta"><span><BriefcaseBusiness size={14}/>{a.category}</span><span><WalletCards size={14}/>{a.budget}</span><span><Clock3 size={14}/>{a.stage}</span></div><div className="application-actions"><button className="button button-small button-ghost" onClick={() => { setActiveRow(activeRow === a.id ? null : a.id); setStatusDraft(a.status === "new" ? "contact_pending" : a.status); }}>{t.updateStatus}<ChevronDown size={15}/></button></div>{activeRow === a.id && <div className="status-editor"><Field label={t.status}><select value={statusDraft} onChange={e => setStatusDraft(e.target.value)}>{statuses.filter(s => s !== "new").map(s => <option key={s} value={s}>{(t as Record<string,string>)[s] || s}</option>)}</select></Field><Field label={t.internalNote}><textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}/></Field><button className="button button-primary" disabled={adminBusy} onClick={() => updateStatus(a.id)}>{adminBusy ? "…" : t.save}</button></div>}</article>)}</div>
        {!visibleApplications.length && <div className="empty-state"><Search size={24}/><p>{t.noApps}</p></div>}
      </main>}
    </div>;
  }

  return <div className="site-shell">
    <header className="site-header"><a href="#" className="brand"><span className="brand-mark">RB</span><span>RBA <b>STARTUP MISSION</b><small>BY ROYAL BULLS ADVISORY</small></span></a>
      <nav className={mobileNav ? "nav-links open" : "nav-links"}><a href="#services" onClick={() => setMobileNav(false)}>{t.navServices}</a><a href="#how" onClick={() => setMobileNav(false)}>{t.navHow}</a><a href="#pricing" onClick={() => setMobileNav(false)}>{t.navPricing}</a><a href="#faq" onClick={() => setMobileNav(false)}>{t.navFaq}</a><a href="/admin" className="nav-admin">{t.signIn}</a></nav>
      <div className="header-actions"><button className="language-button" onClick={() => setLang(lang === "hi" ? "en" : "hi")} aria-label="Toggle language"><Languages size={16}/>{lang === "hi" ? "हिंदी" : "English"}</button><button className="button button-primary header-cta" onClick={() => jumpToForm()}>{t.getStarted}<ArrowRight size={16}/></button><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu">{mobileNav ? <X/> : <Menu/>}</button></div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-grid"><div className="hero-copy"><div className="eyebrow"><span className="live-dot"/>{t.badge}</div><h1>{t.hero1}<br/><span>{t.hero2}</span></h1><p className="hero-desc">{t.heroDesc}</p><div className="hero-actions"><button className="button button-primary button-large" onClick={() => jumpToForm()}>{t.start}<ArrowRight size={18}/></button><a href="#services" className="button button-secondary button-large">{t.explore}<ArrowUpRight size={17}/></a></div><div className="trust-note"><ShieldCheck size={16}/>{t.trusted}</div></div>
          <div className="hero-visual"><div className="orb orb-one"/><div className="orb orb-two"/><div className="visual-card visual-main"><div className="visual-top"><span className="visual-icon"><Sparkles size={19}/></span><span className="visual-label">STARTUP ROADMAP</span><span className="visual-dots">•••</span></div><div className="visual-title">From idea<br/>to action.</div><div className="roadmap"><div className="roadmap-step complete"><span><Check size={13}/></span><div><b>Discover</b><small>Find your opportunity</small></div><BadgeCheck size={17}/></div><div className="roadmap-line"/><div className="roadmap-step active"><span>02</span><div><b>Plan</b><small>Budget & business model</small></div><span className="step-state">IN FOCUS</span></div><div className="roadmap-line"/><div className="roadmap-step"><span>03</span><div><b>Launch</b><small>Take the first steps</small></div></div></div></div><div className="floating-card float-one"><span className="float-icon"><IndianRupee size={17}/></span><div><small>START WITH CLARITY</small><b>Know your costs</b></div></div><div className="floating-card float-two"><span className="float-icon green"><TrendingUp size={17}/></span><div><small>BUILT AROUND YOU</small><b>Practical next steps</b></div></div></div>
        </div><div className="hero-stats"><div><span className="stat-icon"><Lightbulb size={17}/></span><span>{t.stat1}</span></div><div><span className="stat-icon"><Store size={17}/></span><span>{t.stat2}</span></div><div><span className="stat-icon"><Users size={17}/></span><span>{t.stat3}</span></div></div>
      </section>

      <section className="section services-section" id="services"><div className="section-heading"><div className="eyebrow">{t.servicesEyebrow}</div><h2>{t.servicesTitle}</h2><p>{t.servicesDesc}</p></div><div className="service-grid">
        {[{icon:Lightbulb,title:t.idea,desc:t.ideaDesc,help:"Business idea"},{icon:BriefcaseBusiness,title:t.plan,desc:t.planDesc,help:"Business plan"},{icon:Building2,title:t.setup,desc:t.setupDesc,help:"Setup guidance"},{icon:TrendingUp,title:t.growth,desc:t.growthDesc,help:"Marketing & sales"}].map((s,i)=><article className="service-card" key={s.title}><div className="service-icon">{<s.icon size={22}/>}</div><span className="service-number">0{i+1}</span><h3>{s.title}</h3><p>{s.desc}</p><button className="text-link" onClick={() => jumpToForm(s.help)}>{t.getStarted}<ArrowRight size={16}/></button></article>)}
      </div></section>

      <section className="section process-section" id="how"><div className="section-heading"><div className="eyebrow">{t.howEyebrow}</div><h2>{t.howTitle}</h2></div><div className="process-grid"><article><span className="process-no">01</span><div className="process-icon"><MessageCircle size={22}/></div><h3>{t.step1}</h3><p>{t.step1d}</p></article><article><span className="process-no">02</span><div className="process-icon"><FileCheck2 size={22}/></div><h3>{t.step2}</h3><p>{t.step2d}</p></article><article><span className="process-no">03</span><div className="process-icon"><Zap size={22}/></div><h3>{t.step3}</h3><p>{t.step3d}</p></article></div></section>

      <section className="section pricing-section" id="pricing"><div className="section-heading"><div className="eyebrow">{t.pricingEyebrow}</div><h2>{t.pricingTitle}</h2><p>{t.pricingDesc}</p></div><div className="pricing-grid">{packages.map(p=><article className={p.popular ? "price-card popular" : "price-card"} key={p.id}>{p.popular && <div className="popular-label">{t.popular}</div>}<div className="price-icon"><p.icon size={21}/></div><h3>{t[p.titleKey as keyof typeof t]}</h3><p className="price-desc">{t[p.descKey as keyof typeof t]}</p><div className="price-value">{p.price}</div><span className="price-note">{t.priceNote}</span><ul>{p.features.map(f=><li key={f}><Check size={15}/>{f}</li>)}</ul><button className={p.popular ? "button button-primary full-width" : "button button-secondary full-width"} onClick={() => jumpToForm(p.id === "discovery" ? "Business idea" : p.id === "idea" ? "Business idea" : p.id === "plan" ? "Business plan" : p.id === "setup" ? "Setup guidance" : "Marketing & sales")}>{t.choose}<ArrowRight size={16}/></button></article>)}</div><p className="pricing-disclaimer">{t.noGuarantee} Pricing shown is a proposed pilot fee; taxes, statutory fees and third-party costs may be additional where applicable.</p></section>

      <section className="section apply-section" id="apply"><div className="apply-intro"><div className="eyebrow"><span className="live-dot"/>{t.formEyebrow}</div><h2>{t.formTitle}</h2><p>{t.formDesc}</p><div className="apply-benefits"><div><span><Check size={16}/></span>Personalised next-step guidance</div><div><span><Check size={16}/></span>Transparent scope and pricing</div><div><span><Check size={16}/></span>No promise of guaranteed results</div></div><div className="contact-card"><div className="contact-icon"><CircleHelp size={20}/></div><div><b>Not sure where to start?</b><p>Tell us what you have in mind. We can start with your goal and available budget.</p></div></div></div>
        <div className="form-card"><div className="form-card-head"><div><span className="form-step">STARTUP APPLICATION</span><h3>{t.formTitle}</h3></div><span className="secure-mark"><ShieldCheck size={17}/>Private</span></div>
          {successCode ? <div className="success-panel"><span className="success-icon"><Check size={28}/></span><h3>{t.successTitle}</h3><p>{t.successDesc}</p><div className="reference-code">{successCode}</div><button className="button button-secondary" onClick={async()=>{await navigator.clipboard?.writeText(successCode);setCopied(true);}}>{copied ? t.copied : t.copyCode}</button><p className="small muted">Keep this code. Do not share sensitive documents or OTPs.</p></div>
          : <form className="startup-form" onSubmit={submitApplication}>
            {(!firebaseConfigured || !appCheckConfigured) && <div className="notice-box"><b>{t.setupNeeded}</b><p>{t.setupDesc}</p></div>}
            <div className="form-grid"><Field label={t.name}><input autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} minLength={2} maxLength={100} required placeholder={lang==="hi"?"आपका नाम":"Your full name"}/></Field><Field label={t.phone}><input type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} pattern="[0-9+()\-\s]{8,20}" required placeholder="+91 …"/></Field><Field label={t.city}><input autoComplete="address-level2" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} maxLength={100} required placeholder={lang==="hi"?"जैसे सागर":"e.g. Sagar"}/></Field><Field label={t.state}><input autoComplete="address-level1" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} maxLength={100} required/></Field><Field label={t.language}><select value={form.language} onChange={e=>setForm({...form,language:e.target.value})}><option>Hindi</option><option>English</option><option>Other</option></select></Field><Field label={t.category}><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></Field><Field label={t.stage}><select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}>{stages.map(c=><option key={c}>{c}</option>)}</select></Field><Field label={t.budget}><select value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}>{budgets.map(c=><option key={c}>{c}</option>)}</select></Field><Field label={t.mode}><select value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}><option>Offline</option><option>Online</option><option>Hybrid</option></select></Field><Field label={t.help}><select value={form.help} onChange={e=>setForm({...form,help:e.target.value})}><option>Business idea</option><option>Business plan</option><option>Supplier research</option><option>Setup guidance</option><option>Marketing & sales</option><option>Registration guidance</option></select></Field></div>
            <Field label={t.description}><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} maxLength={1200} rows={3} placeholder={lang==="hi"?"आप क्या शुरू करना चाहते हैं?":"What would you like to build?"}/></Field>
            <div className="honeypot" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label></div>
            <label className="consent-row"><input type="checkbox" checked={form.consent} onChange={e=>setForm({...form,consent:e.target.checked})} required/><span>{t.consent} <a href="#privacy">{t.privacy}</a></span></label>
            {formError && <div className="error-box" role="alert">{formError}</div>}
            <button className="button button-primary button-large full-width" type="submit" disabled={formBusy}>{formBusy ? t.submitting : t.submit}<ArrowRight size={18}/></button>
            <p className="form-footnote"><LockKeyhole size={13}/>{t.noGuarantee}</p>
          </form>}
        </div>
      </section>

      <section className="section faq-section" id="faq"><div className="section-heading"><div className="eyebrow">{t.faqEyebrow}</div><h2>{t.faqTitle}</h2></div><div className="faq-list">{faqs.map(([q,a],i)=><article className={faqOpen===i?"faq-item expanded":"faq-item"} key={q}><button onClick={()=>setFaqOpen(faqOpen===i?null:i)}><span>{t[q]}</span><ChevronDown size={19}/></button>{faqOpen===i && <p>{t[a]}</p>}</article>)}</div></section>
    </main>
    <footer className="site-footer" id="privacy"><div className="footer-top"><a href="#" className="brand"><span className="brand-mark">RB</span><span>RBA <b>STARTUP MISSION</b><small>BY ROYAL BULLS ADVISORY</small></span></a><p>{t.footerLine}</p><div className="footer-links"><a href="#services">{t.navServices}</a><a href="#pricing">{t.navPricing}</a><a href="/admin">{t.signIn}</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Royal Bulls Advisory Pvt. Ltd.</span><span>Business advisory and setup assistance · India</span></div><p className="legal-note">{t.noGuarantee} Proposed fees are subject to a written scope of work. No government affiliation is implied.</p></footer>
  </div>;
}

export default App;
