# Firestore Security Rules Specification

This document outlines the security architecture, validation policies, and access controls for the **RBA AI OS** platform. It aligns with the **Eight Pillars of Hardened Rules** to ensure secure, backend-controlled authorization.

---

## 1. Role & Permission Hierarchy

| Role | Description | Access Level | Promotion Method |
|:---|:---|:---|:---|
| **Guest** | Unauthenticated or anonymous session | Limited Read | Automatic upon guest launch |
| **Customer** | Authenticated business owner, loan applicant, student | Own Profile, Own Loans, Academy Courses | Automatic upon login |
| **Advisor** | Authenticated sales partner, underwriter | Own CRM leads, own Wallet, Marketplace Leads, Academy | Backend approval only (Cloud Function) |
| **Admin** | System operator, owner | Read & Write on all collections, Audit, user promotion | Custom Claims / manual root override |

---

## 2. Collections & Access Controls

### A. `users/{userId}`
- **Read**: Owner or Admin.
- **Create**: Owner only.
  - Role must be `"customer"`.
  - Timestamp validation required.
- **Update**: Owner or Admin.
  - Standard users cannot modify protected fields (`role`, `permissions`, `subscription`, `isAdmin`, `customClaims`, `createdBy`).
  - Allowed fields: `name`, `displayName`, `email`, `photoURL`, `phoneNumber`, `phone`, `objective`, `onboardingCompleted`, `updatedAt`, `isGuest`.
- **Delete**: Admin only.

### B. `loans/{loanId}`
- **Read**: Owner or Admin.
- **Create**: Owner only.
  - Target status must be `"pending"`.
- **Update**: Owner or Admin.
  - Standard users can only transition status to `"documents_submitted"` and modify fields such as income, phone, and name.
  - Standard users cannot modify other critical fields or update status to approved/rejected.
- **Delete**: Admin only.

### C. `crm/{leadId}`
- **Read**: Assigned Advisor or Admin.
- **Create**: Assigned Advisor or Admin.
- **Update**: Assigned Advisor or Admin.
- **Delete**: Admin only.

### D. `leads/{marketplaceLeadId}`
- **Read**: Authenticated Users (Advisors can browse).
- **Create**: Admin only.
- **Update**: Advisor (to transition from `"available"` to `"claimed"` with `claimedBy` matching the caller's UID) or Admin.
- **Delete**: Admin only.

### E. `academy/{courseId}`
- **Read**: Authenticated Users.
- **Write**: Admin only.

### F. `wallets/{userId}`
- **Read**: Owner or Admin.
- **Write**: Admin only.

### G. `certificates/{certificateId}`
- **Read**: Public (anyone can look up for digital verification).
- **Write**: Admin only.

### H. `knowledge/{docId}`
- **Read**: Authenticated Users.
- **Write**: Admin only.
