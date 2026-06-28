import React, { useState, useEffect } from "react";
import { collection, query, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile, LoanApplication, CRMLead, MarketplaceLead } from "../types";
import { ShieldCheck, Users, Landmark, BadgeAlert, FileCheck, CirclePlus, UserMinus, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Query users
      const usersSnap = await getDocs(query(collection(db, "users")));
      const usersList: UserProfile[] = [];
      usersSnap.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersList);

      // Query loans
      const loansSnap = await getDocs(query(collection(db, "loans")));
      const loansList: LoanApplication[] = [];
      loansSnap.forEach((doc) => {
        loansList.push({ id: doc.id, ...doc.data() } as LoanApplication);
      });
      setLoans(loansList);

      // Query marketplace leads
      const leadsSnap = await getDocs(query(collection(db, "leads")));
      const leadsList: MarketplaceLead[] = [];
      leadsSnap.forEach((doc) => {
        leadsList.push({ id: doc.id, ...doc.data() } as MarketplaceLead);
      });
      setLeads(leadsList);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "admin_records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateLoanStatus = async (loanId: string, newStatus: "approved" | "rejected") => {
    try {
      const loanRef = doc(db, "loans", loanId);
      await updateDoc(loanRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      setMessage(`Loan application successfully ${newStatus}!`);
      fetchAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `loans/${loanId}`);
    }
  };

  const handleChangeRole = async (userId: string, newRole: "customer" | "advisor" | "admin") => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date(),
      });
      setMessage("User role updated successfully!");
      fetchAdminData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-neutral-900 rounded-2xl text-white">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Admin OS Dashboard</h2>
          <p className="text-xs text-neutral-400">Total control over loans, advisor commissions, and user roles</p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Analytics Widgets */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-4.5 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-1.5 text-neutral-400">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Enrolled Users</span>
          </div>
          <h3 className="text-2xl font-bold text-neutral-950 font-mono">{users.length}</h3>
        </div>

        <div className="bg-white border border-neutral-200 p-4.5 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-1.5 text-neutral-400">
            <Landmark className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Active Loans</span>
          </div>
          <h3 className="text-2xl font-bold text-neutral-950 font-mono">{loans.length}</h3>
        </div>

        <div className="bg-white border border-neutral-200 p-4.5 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-1.5 text-neutral-400">
            <BadgeAlert className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Unclaimed Leads</span>
          </div>
          <h3 className="text-2xl font-bold text-neutral-950 font-mono">
            {leads.filter((l) => l.status === "available").length}
          </h3>
        </div>
      </div>

      {/* 1. Loan Review Panel */}
      <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-neutral-950 text-sm tracking-tight mb-4 flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-emerald-400" /> Pending Loan verifications
        </h3>

        {loans.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs">No loan applications filed yet.</div>
        ) : (
          <div className="space-y-3.5">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex justify-between items-center text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-neutral-900 capitalize">{loan.type} Loan</span>
                    <span className="text-[10px] font-mono text-neutral-400">by {loan.applicantName}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-[10px] font-mono text-neutral-500">
                    <span>Requested: INR {loan.amountRequested.toLocaleString()}</span>
                    <span>Phone: {loan.applicantPhone}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {loan.status === "documents_submitted" || loan.status === "pending" ? (
                    <>
                      <button
                        onClick={() => loan.id && handleUpdateLoanStatus(loan.id, "approved")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 transition text-[10px] font-bold text-white rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => loan.id && handleUpdateLoanStatus(loan.id, "rejected")}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 transition text-[10px] font-bold text-white rounded-lg"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-neutral-400 px-3 py-1.5 bg-neutral-100 rounded-lg">
                      {loan.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. User Accounts Controller */}
      <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-neutral-950 text-sm tracking-tight mb-4 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-400" /> User Roles manager
        </h3>

        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex justify-between items-center text-xs"
            >
              <div>
                <span className="font-extrabold text-neutral-900 block">{u.name}</span>
                <span className="text-[10px] text-neutral-400 font-mono">{u.email}</span>
              </div>

              <div>
                <select
                  value={u.role}
                  onChange={(e) => handleChangeRole(u.id, e.target.value as any)}
                  className="bg-white border border-neutral-200 rounded-xl px-2.5 py-1 text-xs font-bold text-neutral-800 outline-none"
                >
                  <option value="customer">Customer</option>
                  <option value="advisor">Advisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
