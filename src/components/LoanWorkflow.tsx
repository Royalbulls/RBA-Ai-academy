import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { LoanApplication, LoanType } from "../types";
import { FileText, Plus, Landmark, Phone, BadgeIndianRupee, ChevronRight, CheckCircle, Clock } from "lucide-react";

interface LoanWorkflowProps {
  currentUser: { id: string; name: string; role: string } | null;
  prefillData?: { type?: LoanType; amountRequested?: number };
}

export default function LoanWorkflow({ currentUser, prefillData }: LoanWorkflowProps) {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<LoanType>(prefillData?.type || "personal");
  const [amount, setAmount] = useState<number>(prefillData?.amountRequested || 100000);
  const [applicantName, setApplicantName] = useState(currentUser?.name || "");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState<number>(50000);

  useEffect(() => {
    if (prefillData?.type) setType(prefillData.type);
    if (prefillData?.amountRequested) setAmount(prefillData.amountRequested);
  }, [prefillData]);

  const fetchLoans = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, "loans"), where("userId", "==", currentUser.id));
      const querySnapshot = await getDocs(q);
      const list: LoanApplication[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as LoanApplication);
      });
      setLoans(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [currentUser]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setMessage(null);

    const payload: Omit<LoanApplication, "id"> = {
      userId: currentUser.id,
      type,
      amountRequested: Number(amount),
      status: "pending",
      applicantName,
      applicantPhone,
      monthlyIncome: Number(monthlyIncome),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await addDoc(collection(db, "loans"), payload);
      setMessage("Loan application submitted successfully!");
      fetchLoans();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "loans");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocs = async (loanId: string) => {
    try {
      const loanRef = doc(db, "loans", loanId);
      await updateDoc(loanRef, {
        status: "documents_submitted",
        updatedAt: new Date(),
      });
      setMessage("Documents uploaded. Application moved to verification!");
      fetchLoans();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `loans/${loanId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-neutral-900 rounded-2xl text-white">
          <Landmark className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Loan Operations</h2>
          <p className="text-xs text-neutral-400">Apply and track personal & business loans</p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      {/* Application Form */}
      <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          <h3 className="font-bold text-neutral-950 text-sm tracking-tight flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-400" /> New Application Form
          </h3>
          {/* AI Bootstrap Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] text-neutral-400 font-mono font-bold">AI BOOTSTRAP:</span>
            <button
              type="button"
              onClick={() => {
                setType("business");
                setAmount(2500000);
                setApplicantPhone("+91 98450-23110");
                setMonthlyIncome(280000);
              }}
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 transition cursor-pointer"
            >
              💼 MSME Expand
            </button>
            <button
              type="button"
              onClick={() => {
                setType("home");
                setAmount(6000000);
                setApplicantPhone("+91 88720-41399");
                setMonthlyIncome(150000);
              }}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 transition cursor-pointer"
            >
              🏠 Home Construct
            </button>
          </div>
        </div>
        
        <form onSubmit={handleApply} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Loan Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LoanType)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
              >
                <option value="personal">Personal Loan</option>
                <option value="business">Business Loan</option>
                <option value="home">Home Loan</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Amount Requested (INR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Applicant Name
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-medium text-neutral-800 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                placeholder="+91 99999-99999"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-medium text-neutral-800 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Monthly Net Income (INR)
            </label>
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 transition rounded-xl text-white font-bold text-xs shadow-md"
          >
            {submitting ? "Submitting Application..." : "Submit Loan Application"}
          </button>
        </form>
      </div>

      {/* Applications List */}
      <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-neutral-950 text-sm tracking-tight mb-4 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-400" /> Active Applications
        </h3>

        {loading ? (
          <div className="text-center py-6 text-neutral-400 text-xs">Loading loan list...</div>
        ) : loans.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            No loan applications found. Fill the form to apply.
          </div>
        ) : (
          <div className="space-y-3.5">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold capitalize text-neutral-900">
                      {loan.type} Loan
                    </span>
                    <span
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold ${
                        loan.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : loan.status === "documents_submitted"
                          ? "bg-blue-100 text-blue-800"
                          : loan.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {loan.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-500 font-mono">
                    <span className="flex items-center gap-1">
                      <BadgeIndianRupee className="w-3.5 h-3.5 text-neutral-400" />
                      {loan.amountRequested.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      {loan.applicantPhone}
                    </span>
                  </div>
                </div>

                {loan.status === "pending" && (
                  <button
                    onClick={() => loan.id && handleUploadDocs(loan.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 transition text-[10px] font-bold text-white rounded-lg border border-neutral-900 shadow-sm"
                  >
                    <span>Upload Docs</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
