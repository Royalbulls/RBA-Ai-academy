import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { MarketplaceLead, Certificate, KnowledgeDoc } from "../types";
import { Landmark, Compass, Award, Search, BookOpen, ShieldCheck, Tag, MapPin, Upload, Plus, FileText, BadgeCheck, Sparkles } from "lucide-react";

interface OtherModulesProps {
  currentUser: { id: string; name: string; role: string } | null;
  moduleType: "marketplace" | "certificate" | "knowledge";
  onTriggerAiWithQuery?: (query: string) => void;
}

export default function OtherModules({ currentUser, moduleType, onTriggerAiWithQuery }: OtherModulesProps) {
  const [message, setMessage] = useState<string | null>(null);

  // Marketplace states
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Certificate states
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [certifying, setCertifying] = useState(false);

  // Knowledge repo states
  const [docsList, setDocsList] = useState<KnowledgeDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("SOP Manual");

  // Fetch Marketplace Leads
  const fetchMarketplaceLeads = async () => {
    setLoadingLeads(true);
    try {
      const q = query(collection(db, "leads"));
      const querySnapshot = await getDocs(q);
      const list: MarketplaceLead[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as MarketplaceLead);
      });

      if (list.length === 0) {
        // Seed Marketplace
        const seedMarketplace: Omit<MarketplaceLead, "id">[] = [
          {
            title: "Urgent SME Expansion Capital",
            type: "Business Loan",
            location: "New Delhi, DL",
            commissionAmount: 18000,
            status: "available",
            claimedBy: null,
            createdAt: new Date(),
          },
          {
            title: "Home Finance - New Construction",
            type: "Home Loan",
            location: "Mumbai, MH",
            commissionAmount: 25000,
            status: "available",
            claimedBy: null,
            createdAt: new Date(),
          },
          {
            title: "Doctor Professional Credit Line",
            type: "Personal Loan",
            location: "Bangalore, KA",
            commissionAmount: 12000,
            status: "claimed",
            claimedBy: "demo_advisor",
            createdAt: new Date(),
          }
        ];

        for (const item of seedMarketplace) {
          const docRef = await addDoc(collection(db, "leads"), item);
          list.push({ id: docRef.id, ...item } as MarketplaceLead);
        }
      }

      setLeads(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "leads");
    } finally {
      setLoadingLeads(false);
    }
  };

  // Fetch Certificates
  const fetchCertificates = async () => {
    if (!currentUser) return;
    setLoadingCerts(true);
    try {
      const q = query(collection(db, "certificates"), where("userId", "==", currentUser.id));
      const querySnapshot = await getDocs(q);
      const list: Certificate[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Certificate);
      });
      setCertificates(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "certificates");
    } finally {
      setLoadingCerts(false);
    }
  };

  // Fetch Knowledge Base
  const fetchKnowledgeBase = async () => {
    setLoadingDocs(true);
    try {
      const q = query(collection(db, "knowledge"));
      const querySnapshot = await getDocs(q);
      const list: KnowledgeDoc[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as KnowledgeDoc);
      });

      if (list.length === 0) {
        const seedDocs: Omit<KnowledgeDoc, "id">[] = [
          {
            title: "RBA Personal Loan SOP (2026)",
            category: "SOP Manual",
            content: "Standard operating procedures for verifying customer eligibility. Check monthly net income, CIBIL scores above 750, and lock structural foreclosure metrics before submitting files.",
            uploadedBy: "Admin Staff",
            createdAt: new Date(),
          },
          {
            title: "Business Loan Commission Policy",
            category: "Policy",
            content: "Advisors secure a 2.5% recurring payout commission on verified disbursements. Ref payouts clear into withdrawable ledger balance within 7 business days of loan finalization.",
            uploadedBy: "Admin Staff",
            createdAt: new Date(),
          }
        ];

        for (const item of seedDocs) {
          const docRef = await addDoc(collection(db, "knowledge"), item);
          list.push({ id: docRef.id, ...item } as KnowledgeDoc);
        }
      }

      setDocsList(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "knowledge");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (moduleType === "marketplace") fetchMarketplaceLeads();
    if (moduleType === "certificate") fetchCertificates();
    if (moduleType === "knowledge") fetchKnowledgeBase();
  }, [moduleType, currentUser]);

  const handleClaimLead = async (leadId: string) => {
    if (!currentUser) return;
    try {
      const leadRef = doc(db, "leads", leadId);
      await updateDoc(leadRef, {
        status: "claimed",
        claimedBy: currentUser.id,
      });
      setMessage("Lead claimed successfully! Check your CRM board.");
      fetchMarketplaceLeads();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const handleAddSOP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setUploadingDoc(true);
    try {
      const payload: Omit<KnowledgeDoc, "id"> = {
        title: newDocTitle,
        category: newDocCategory,
        content: newDocContent,
        uploadedBy: currentUser.name,
        createdAt: new Date(),
      };
      await addDoc(collection(db, "knowledge"), payload);
      setMessage("Knowledge document uploaded into enterprise SOP index!");
      setNewDocTitle("");
      setNewDocContent("");
      fetchKnowledgeBase();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "knowledge");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleGenerateMockCertificate = async () => {
    if (!currentUser) return;
    setCertifying(true);
    try {
      const certId = `CERT_${Math.floor(Math.random() * 90000) + 10000}`;
      const payload: Omit<Certificate, "id"> = {
        userId: currentUser.id,
        userName: currentUser.name,
        courseName: "Loan Advisor Mastery Certification",
        qrCodeData: `https://royalbullsadvisory.com/verify/${certId}`,
        issuedAt: new Date().toISOString(),
        digitalSignature: `SIG_RBA_KEY_${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      };

      await addDoc(collection(db, "certificates"), payload);
      setMessage("New completion certificate issued and signed!");
      fetchCertificates();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "certificates");
    } finally {
      setCertifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold">
          {message}
        </div>
      )}

      {/* 1. Lead Marketplace */}
      {moduleType === "marketplace" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-900 rounded-2xl text-white">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Leads Marketplace</h2>
              <p className="text-xs text-neutral-400">Claim nearby financial advisory leads on-demand</p>
            </div>
          </div>

          {loadingLeads ? (
            <div className="text-center py-6 text-xs text-neutral-400 font-mono">Scouting lead listings...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white border border-neutral-200/60 p-5 rounded-3xl shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-neutral-100 text-neutral-700 font-mono">
                        {lead.type}
                      </span>
                      <span className={`text-[10px] font-bold font-mono ${
                        lead.status === "available" ? "text-emerald-500" : "text-neutral-400"
                      }`}>
                        {lead.status === "available" ? "● OPEN" : "CLAIMED"}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-neutral-900 text-sm tracking-tight">{lead.title}</h4>
                    
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-neutral-500 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {lead.location}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <Tag className="w-3.5 h-3.5" />
                        Comm: INR {lead.commissionAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-neutral-100 pt-3.5 flex gap-2">
                    {lead.status === "available" ? (
                      <>
                        <button
                          onClick={() => lead.id && handleClaimLead(lead.id)}
                          className="flex-1 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Claim Lead
                        </button>
                        {onTriggerAiWithQuery && (
                          <button
                            onClick={() => onTriggerAiWithQuery(`Qualify the following marketplace listing: Title: "${lead.title}", Type: "${lead.type}", Location: "${lead.location}", Commission: "INR ${lead.commissionAmount.toLocaleString()}". Detail the target client profile and strategic objection handling techniques.`)}
                            className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                            title="AI Qualify Lead"
                          >
                            <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                            <span className="hidden sm:inline">AI Qualify</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 bg-neutral-100 text-neutral-400 font-bold text-xs rounded-xl"
                      >
                        Lead Already Claimed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Certificate Engine */}
      {moduleType === "certificate" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-900 rounded-2xl text-white">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Certification Center</h2>
              <p className="text-xs text-neutral-400">Generate verified, QR-embedded advisory credentials</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/60 p-5 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-neutral-950 text-xs uppercase tracking-wider font-mono">
                My Official Credentials
              </h3>
              <button
                onClick={handleGenerateMockCertificate}
                disabled={certifying}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 text-xs font-bold text-white rounded-xl"
              >
                {certifying ? "Signing..." : "Issue Advisory Certificate"}
              </button>
            </div>

            {loadingCerts ? (
              <div className="text-center py-6 text-xs text-neutral-400 font-mono">Fetching keys...</div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                No completion credentials issued yet. Lock lesson completion inside your Academy courses first.
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-5 bg-neutral-900 text-white rounded-3xl border border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h4 className="font-extrabold text-sm tracking-tight">{cert.courseName}</h4>
                      </div>
                      
                      <div className="text-[10px] text-neutral-400 space-y-1 font-mono leading-relaxed">
                        <p>ISSUED TO: <span className="text-neutral-200 font-bold">{cert.userName}</span></p>
                        <p>SIGNATURE: <span className="text-neutral-200">{cert.digitalSignature}</span></p>
                        <p>VERIFICATION KEY: <span className="text-neutral-200">{cert.id || "GEN_KEY"}</span></p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {onTriggerAiWithQuery && (
                          <button
                            onClick={() => onTriggerAiWithQuery(`Explain how this "${cert.courseName}" signed with verification key "${cert.id || "GEN_KEY"}" certifies high-integrity credit compliance and how to explain its value to an SME loan applicant.`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>AI Explain Value</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const link = document.createElement("a");
                            const content = `=========================================\n       ROYAL BULLS ADVISORY\n      OFFICIAL COMPLETION KEY\n=========================================\n\nThis certifies that ${cert.userName} has successfully completed the: \n"${cert.courseName}"\n\nVerification ID: ${cert.id || "GEN_KEY"}\nIssued At: ${new Date(cert.issuedAt).toLocaleDateString()}\nDigital Signature: ${cert.digitalSignature}\n\n=========================================\nSecure verification signature: SHA256-${cert.digitalSignature}`;
                            const file = new Blob([content], { type: "text/plain" });
                            link.href = URL.createObjectURL(file);
                            link.download = `RBA_Certificate_${cert.id || "GEN_KEY"}.txt`;
                            link.click();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                          title="Download official compliance completion key"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Download Completion Key</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Code Simulation */}
                    <div className="shrink-0 bg-white p-2.5 rounded-2xl flex flex-col items-center">
                      <div className="w-20 h-20 bg-neutral-100 border border-neutral-200 flex items-center justify-center relative">
                        <div className="w-16 h-16 border-4 border-neutral-800 border-double grid grid-cols-2 p-1 gap-1">
                          <div className="border border-neutral-800 bg-neutral-800" />
                          <div className="border border-neutral-800 bg-neutral-800" />
                          <div className="border border-neutral-800 bg-neutral-800" />
                          <div className="border border-neutral-800" />
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-neutral-600 mt-1 font-mono tracking-wider">
                        SCAN VERIFY
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Knowledge Base SOPs */}
      {moduleType === "knowledge" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-900 rounded-2xl text-white">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">SOP Knowledge Base</h2>
              <p className="text-xs text-neutral-400">Search corporate policy indices and training materials</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-neutral-100 border border-neutral-200/80 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query SOP directives..."
                className="bg-transparent border-none outline-none text-xs w-full text-neutral-800 font-semibold"
              />
            </div>
          </div>

          {/* Add SOP Document */}
          <div className="bg-white border border-neutral-200/60 p-5 rounded-3xl shadow-sm">
            <h3 className="font-bold text-neutral-950 text-xs uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" /> Upload Directive Manual
            </h3>
            
            <form onSubmit={handleAddSOP} className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Document Title
                  </label>
                  <input
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-850 outline-none"
                    placeholder="E.g., Home Finance Verification"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-850 outline-none"
                  >
                    <option value="SOP Manual">SOP Manual</option>
                    <option value="Policy Document">Policy Document</option>
                    <option value="Product Guideline">Product Guideline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Manual Content
                </label>
                <textarea
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-medium text-neutral-850 outline-none h-16 resize-none"
                  placeholder="Detail the manual procedures..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploadingDoc}
                className="py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow transition"
              >
                {uploadingDoc ? "Indexing..." : "Index SOP"}
              </button>
            </form>
          </div>

          {/* List indexed Docs */}
          {loadingDocs ? (
            <div className="text-center py-6 text-xs text-neutral-400 font-mono">Synchronizing files...</div>
          ) : (
            <div className="space-y-3.5">
              {docsList
                .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.content.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((docItem) => (
                  <div
                    key={docItem.id}
                    className="bg-white border border-neutral-200/60 p-4.5 rounded-2xl shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-neutral-900 text-xs">{docItem.title}</h4>
                      <span className="text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-neutral-100 text-neutral-700">
                        {docItem.category}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-2 font-medium leading-relaxed">
                      {docItem.content}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2.5 text-[9px] text-neutral-400 font-mono">
                      <span>Indexed by: {docItem.uploadedBy}</span>
                      {onTriggerAiWithQuery && (
                        <button
                          onClick={() => onTriggerAiWithQuery(`Explain standard operating procedure concept from "${docItem.title}" (${docItem.category}): "${docItem.content}". Give me a step-by-step compliant implementation checklist.`)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[9px] font-bold transition cursor-pointer"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                          <span>AI Explain SOP</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
