import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { CRMLead, CRMLeadStatus } from "../types";
import { User, Users, Plus, Phone, MessageSquare, Tag, BookmarkCheck, CalendarRange, Sparkles } from "lucide-react";

interface CRMBoardProps {
  currentUser: { id: string; name: string; role: string } | null;
  onTriggerAiWithQuery?: (query: string) => void;
}

export default function CRMBoard({ currentUser, onTriggerAiWithQuery }: CRMBoardProps) {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [leadSource, setLeadSource] = useState("Website Referral");
  const [notes, setNotes] = useState("");

  const fetchLeads = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, "crm"), where("advisorId", "==", currentUser.id));
      const querySnapshot = await getDocs(q);
      const list: CRMLead[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CRMLead);
      });

      // If no leads, seed some initial leads for premium presentation
      if (list.length === 0) {
        const seedLeads: Omit<CRMLead, "id">[] = [
          {
            advisorId: currentUser.id,
            customerName: "Rakesh Sharma",
            customerEmail: "rakesh.sharma@gmail.com",
            customerPhone: "+91 98765-43210",
            leadSource: "Google Search",
            status: "new",
            notes: "Inquired about business expansion loan.",
            loanStatus: "In Discussion",
            updatedAt: new Date(),
          },
          {
            advisorId: currentUser.id,
            customerName: "Priya Patel",
            customerEmail: "priya.patel@hotmail.com",
            customerPhone: "+91 99123-45678",
            leadSource: "RBA Campaign",
            status: "negotiation",
            notes: "Documents submitted for personal loan.",
            loanStatus: "In Review",
            updatedAt: new Date(),
          }
        ];

        for (const item of seedLeads) {
          const docRef = await addDoc(collection(db, "crm"), item);
          list.push({ id: docRef.id, ...item } as CRMLead);
        }
      }

      setLeads(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "crm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [currentUser]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setMessage(null);

    const payload: Omit<CRMLead, "id"> = {
      advisorId: currentUser.id,
      customerName,
      customerEmail,
      customerPhone,
      leadSource,
      status: "new",
      notes,
      loanStatus: "Identified",
      updatedAt: new Date(),
    };

    try {
      await addDoc(collection(db, "crm"), payload);
      setMessage("Lead added successfully!");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setNotes("");
      fetchLeads();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "crm");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: CRMLeadStatus) => {
    try {
      const leadRef = doc(db, "crm", leadId);
      await updateDoc(leadRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      setMessage("Lead stage transitioned successfully!");
      fetchLeads();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `crm/${leadId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-neutral-900 rounded-2xl text-white">
          <Users className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Advisor CRM Board</h2>
          <p className="text-xs text-neutral-400">Automate customer progression and relationship states</p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Add Lead Form */}
      <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-neutral-950 text-sm tracking-tight mb-4 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-400" /> Quick Lead Logger
        </h3>
        <form onSubmit={handleCreateLead} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Client Phone
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 99999-99999"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Client Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Lead Source
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
              >
                <option value="Website Referral">Website Referral</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Direct Call">Direct Call</option>
                <option value="Academy Lead">Academy Lead</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Initial Interaction Log
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-medium text-neutral-800 outline-none h-16 resize-none"
              placeholder="E.g., Client requires home financing within 3 weeks..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 transition rounded-xl text-white font-bold text-xs shadow-md"
          >
            {submitting ? "Logging Lead..." : "Log CRM Lead"}
          </button>
        </form>
      </div>

      {/* Leads Columns/Columns Grid */}
      <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-bold text-neutral-950 text-sm tracking-tight mb-4 flex items-center gap-1.5">
          <BookmarkCheck className="w-4 h-4 text-emerald-400" /> Pipeline Stage Overview
        </h3>

        {loading ? (
          <div className="text-center py-6 text-neutral-400 text-xs font-mono">Synchronizing pipelines...</div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-neutral-900">{lead.customerName}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-neutral-200 text-neutral-700 font-mono">
                      {lead.leadSource}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-neutral-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      {lead.customerPhone}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <Tag className="w-3.5 h-3.5" />
                      {lead.loanStatus}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2 font-medium bg-white/70 p-2.5 rounded-xl border border-neutral-100">
                    {lead.notes}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1 font-mono text-right">
                      Pipeline Stage
                    </label>
                    <select
                      value={lead.status}
                      onChange={(e) => lead.id && handleUpdateStatus(lead.id, e.target.value as CRMLeadStatus)}
                      className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 outline-none w-32"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won (Closed)</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  {onTriggerAiWithQuery && (
                    <button
                      onClick={() => onTriggerAiWithQuery(`Analyze this CRM lead: Name is ${lead.customerName}, current stage is ${lead.status}, interest is ${lead.loanStatus}, and logs show: "${lead.notes}". Draft a highly personalized follow-up message to suggest as a reply.`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[10px] font-bold transition shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>AI Suggest Reply</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
