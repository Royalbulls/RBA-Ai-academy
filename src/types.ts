export type UserRole = "customer" | "advisor" | "admin";

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  phone?: string;
  role: UserRole;
  onboardingCompleted?: boolean;
  isGuest?: boolean;
  objective?: string;
  learningGoals?: string;
  businessDetails?: string;
  writingStyle?: string;
  languagePreference?: string;
  pinnedKnowledge?: string[];
  createdAt: any;
  updatedAt: any;
}

export type LoanType = "personal" | "business" | "home";
export type LoanStatus = "pending" | "documents_submitted" | "approved" | "rejected";

export interface LoanApplication {
  id?: string;
  userId: string;
  type: LoanType;
  amountRequested: number;
  status: LoanStatus;
  applicantName: string;
  applicantPhone: string;
  monthlyIncome: number;
  createdAt: any;
  updatedAt: any;
}

export type CRMLeadStatus = "new" | "contacted" | "negotiation" | "won" | "lost";

export interface CRMLead {
  id?: string;
  advisorId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  leadSource: string;
  status: CRMLeadStatus;
  notes: string;
  loanStatus: string;
  updatedAt: any;
}

export interface MarketplaceLead {
  id?: string;
  title: string;
  type: string;
  location: string;
  commissionAmount: number;
  status: "available" | "claimed";
  claimedBy: string | null;
  createdAt: any;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: "credit" | "debit" | "withdrawal";
  description: string;
  date: any;
}

export interface Wallet {
  userId: string;
  balance: number;
  commissionEarned: number;
  referralEarnings: number;
  transactions: WalletTransaction[];
}

export interface Certificate {
  id?: string;
  userId: string;
  userName: string;
  courseName: string;
  qrCodeData: string;
  issuedAt: any;
  digitalSignature: string;
}

export interface KnowledgeDoc {
  id?: string;
  title: string;
  category: string;
  content: string;
  uploadedBy: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ActionPayload {
  type: "OPEN_LOAN_WORKFLOW" | "OPEN_CRM" | "OPEN_WALLET" | "START_ROLEPLAY" | "OPEN_ACADEMY" | "OPEN_MARKETPLACE" | "OPEN_CERTIFICATE" | "OPEN_KNOWLEDGE" | "NONE";
  data?: any;
}
