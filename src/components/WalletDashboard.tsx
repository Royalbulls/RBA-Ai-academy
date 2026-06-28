import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Wallet, WalletTransaction } from "../types";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, BadgeCheck, CheckCircle2, CircleDollarSign } from "lucide-react";

interface WalletDashboardProps {
  currentUser: { id: string; name: string; role: string } | null;
}

export default function WalletDashboard({ currentUser }: WalletDashboardProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState<number>(5000);
  const [message, setMessage] = useState<string | null>(null);

  const fetchWallet = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const walletRef = doc(db, "wallets", currentUser.id);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        setWallet(walletSnap.data() as Wallet);
      } else {
        // Initialize sample wallet for premium experience
        const initialWallet: Wallet = {
          userId: currentUser.id,
          balance: 45000,
          commissionEarned: 65000,
          referralEarnings: 12000,
          transactions: [
            {
              id: "tx_1",
              amount: 15000,
              type: "credit",
              description: "Commission payout on closed Business Loan #1032",
              date: new Date().toISOString(),
            },
            {
              id: "tx_2",
              amount: 3000,
              type: "credit",
              description: "Referral bonus for signing Advisor @priya",
              date: new Date(Date.now() - 86400000 * 2).toISOString(),
            }
          ]
        };

        await setDoc(walletRef, initialWallet);
        setWallet(initialWallet);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `wallets/${currentUser.id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [currentUser]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || amount <= 0 || amount > wallet.balance) {
      setMessage("Invalid amount or insufficient wallet balance.");
      return;
    }
    setWithdrawing(true);
    setMessage(null);

    try {
      const walletRef = doc(db, "wallets", wallet.userId);
      
      const newTransaction: WalletTransaction = {
        id: `tx_withdraw_${Date.now()}`,
        amount: Number(amount),
        type: "withdrawal",
        description: `Instant payout requested to Bank Account`,
        date: new Date().toISOString(),
      };

      const updatedWallet: Wallet = {
        ...wallet,
        balance: wallet.balance - amount,
        transactions: [newTransaction, ...wallet.transactions],
      };

      await updateDoc(walletRef, {
        balance: updatedWallet.balance,
        transactions: updatedWallet.transactions,
      });

      setWallet(updatedWallet);
      setMessage(`Withdrawal request of INR ${amount.toLocaleString()} lodged successfully!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `wallets/${wallet.userId}`);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs text-neutral-400 font-mono">Loading commission ledger...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-neutral-900 rounded-2xl text-white">
          <WalletIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Commission Wallet</h2>
          <p className="text-xs text-neutral-400">Track and withdraw your advisor revenues</p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Balances Board */}
      {wallet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-950 text-white p-5 rounded-3xl relative overflow-hidden shadow-lg border border-neutral-900">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-xl" />
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider block mb-1">
              Withdrawable Balance
            </span>
            <h3 className="text-2xl font-bold font-mono text-white">
              INR {wallet.balance.toLocaleString()}
            </h3>
            <span className="text-[9px] text-neutral-400 font-mono block mt-2">
              Cleared • Ready for Instant Transfer
            </span>
          </div>

          <div className="bg-white border border-neutral-200/80 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider block mb-1">
              Total Commissions Earned
            </span>
            <h3 className="text-2xl font-bold font-mono text-neutral-950">
              INR {wallet.commissionEarned.toLocaleString()}
            </h3>
            <span className="text-[9px] text-emerald-600 font-semibold block mt-2">
              +14.5% Growth this month
            </span>
          </div>

          <div className="bg-white border border-neutral-200/80 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider block mb-1">
              Referral Rewards
            </span>
            <h3 className="text-2xl font-bold font-mono text-neutral-950">
              INR {wallet.referralEarnings.toLocaleString()}
            </h3>
            <span className="text-[9px] text-neutral-400 block mt-2">
              4 active sub-advisors enrolled
            </span>
          </div>
        </div>
      )}

      {/* Withdrawal Trigger */}
      <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-neutral-950 text-sm tracking-tight mb-4 flex items-center gap-1.5">
          <CircleDollarSign className="w-4 h-4 text-emerald-400" /> Instant Bank Settlement
        </h3>

        <form onSubmit={handleWithdraw} className="flex gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Settlement amount (INR)"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold text-neutral-800 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={withdrawing || !wallet || wallet.balance < amount}
            className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 transition text-xs font-bold text-white rounded-xl shadow"
          >
            {withdrawing ? "Transferring..." : "Request Bank Settlement"}
          </button>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-neutral-950 text-sm tracking-tight mb-4">
          Settlement & commission ledger
        </h3>

        {wallet && wallet.transactions.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs font-mono">No transaction statements recorded.</div>
        ) : wallet ? (
          <div className="space-y-3">
            {wallet.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-3.5 bg-neutral-50 hover:bg-neutral-100/50 transition border border-neutral-200/80 rounded-2xl text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg border ${
                    tx.type === "credit" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-neutral-100 border-neutral-200 text-neutral-600"
                  }`}>
                    {tx.type === "credit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">{tx.description}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(tx.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-bold block ${
                    tx.type === "credit" ? "text-emerald-600" : "text-neutral-900"
                  }`}>
                    {tx.type === "credit" ? "+" : "-"} INR {tx.amount.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-0.5 justify-end">
                    <BadgeCheck className="w-3.5 h-3.5" /> Set
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
