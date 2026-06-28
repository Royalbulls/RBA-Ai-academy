# RBA AI OS (Version 2) - Architectural Blueprint

This document contains the complete Product Requirement Document (PRD), Software Architecture Document (SAD), Database Architecture, AI Action Engine Specification, and Skill Engine Design for **RBA AI OS (Version 2)** by Royal Bulls Advisory Pvt. Ltd.

---

## 1. Product Requirement Document (PRD)

### 1.1 Product Vision
**"One AI. One Platform. Every Business Solution."**
RBA AI OS is an AI-first operating system for businesses, entrepreneurs, advisors, and professionals. Unlike traditional dashboards with cluttered sidebars and endless configuration menus, RBA AI OS treats **conversation as the operating system**. Every business workflow, learning module, CRM update, or lead tracking operation is initiated, guided, and automated through a single, highly refined AI chat interface.

### 1.2 Target Audience
- **Entrepreneurs & Business Owners**: Seeking funding, legal services, digital marketing setup, and operational guidance.
- **Financial & Business Advisors**: Utilizing CRM, Lead Marketplace, and Commission Wallet.
- **Students & Professionals**: Enrolling in specialized Academies (Loans, Insurance, Consulting) with AI Role-Play evaluations.
- **RBA Admin Staff**: Monitoring user activity, managing courses, distributing leads, and approving withdrawals.

### 1.3 Key Functional Pillars
1. **Conversational Interface (Core OS)**: Apple-level minimalist chat interface. Suggested action cards guide users without forcing rigid menus.
2. **Dynamic Action Engine**: Evaluates conversational intents, triggers specialized backend Skills, and dynamically manifests workflow-specific interactive components (e.g., Application forms, interactive CRM boards, Wallet widgets) alongside the chat.
3. **Specialized Academy with AI Role-Play**: Interactive learning paths with assignments, mock tests, and a voice/text AI customer simulation that negotiates, raises objections, and scores student sales pitches.
4. **Dynamic CRM & Lead Marketplace**: Automated lead logging, status progression, nearby lead matching, marketplace bidding, and tracking.
5. **Commission Wallet**: Instant reporting of earnings, transactions, referrals, and withdrawals.
6. **Certificate Engine**: Generation of unique verified credentials with digital signatures and QR verification.
7. **RAG-Ready Knowledge Base**: An enterprise repository for policies, SOPs, and manual documents designed to feed future semantic retrieval pipelines.

---

## 2. Software Architecture Document (SAD)

### 2.1 Hybrid Full-Stack Framework
We implement a robust, secure **Full-Stack React + Express** architecture:
- **Frontend (Client)**: React 18+ with Vite, Tailwind CSS, and `motion` for fluid, Apple-style animations. It maintains lightweight states and displays dynamic workflows returned by the Action Engine.
- **Backend (Server)**: Express server serving as a secure gateway. It encapsulates the `@google/genai` SDK, proxies model interactions securely to avoid exposing secret keys, and handles database operations.
- **Database (Persistence)**: Firebase (Firestore and Authentication) providing durable cloud storage, secure rules, real-time sync, and client offline support.

### 2.2 System Architecture Diagram (Data & Control Flow)
```
┌────────────────────────────────────────────────────────┐
│                        CLIENT                          │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   Minimal Chat UI     │   │   Dynamic Workflow   │  │
│  │ (Conversation First)  │   │   (CRM/Wallet/Form)  │  │
│  └───────────┬───────────┘   └──────────▲───────────┘  │
└──────────────┼──────────────────────────┼──────────────┘
               │ JSON payload             │ Action & State update
               ▼                          │
┌──────────────┼──────────────────────────┼──────────────┐
│            SERVER (Express on Port 3000)               │
│  ┌───────────▼───────────┐   ┌──────────┴───────────┐  │
│  │      API Gateway      ├─► │   AI Action Engine   │  │
│  │  (/api/chat, /api/*)  │   │  (gemini-3.5-flash)  │  │
│  └───────────┬───────────┘   └──────────┬───────────┘  │
└──────────────┼──────────────────────────┼──────────────┘
               │                          │
               ▼                          ▼
┌────────────────────────────────────────────────────────┐
│                        BACKEND                         │
│   ┌────────────────────────┐   ┌───────────────────┐   │
│   │  Firebase Auth (Auth)  │   │ Firestore (DB)    │   │
│   └────────────────────────┘   └───────────────────┘   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Database Architecture (Firestore Schema)

We design a scalable, relational, and highly secured collection architecture.

### 3.1 Collections & Fields Specs

#### `users` (Collection)
- `{userId}` (Document ID = Auth UID)
  - `name`: `string`
  - `email`: `string`
  - `role`: `string` (`"customer" | "advisor" | "admin"`)
  - `createdAt`: `timestamp`
  - `updatedAt`: `timestamp`

#### `loans` (Collection)
- `{loanId}` (Document ID = autogenerated ID)
  - `userId`: `string` (Reference to `users`)
  - `type`: `string` (`"personal" | "business" | "home"`)
  - `amountRequested`: `number`
  - `status`: `string` (`"pending" | "documents_submitted" | "approved" | "rejected"`)
  - `applicantName`: `string`
  - `applicantPhone`: `string`
  - `monthlyIncome`: `number`
  - `createdAt`: `timestamp`
  - `updatedAt`: `timestamp`

#### `crm` (Collection)
- `{leadId}` (Document ID = autogenerated ID)
  - `advisorId`: `string` (Reference to `users` where role is advisor)
  - `customerName`: `string`
  - `customerEmail`: `string`
  - `customerPhone`: `string`
  - `leadSource`: `string`
  - `status`: `string` (`"new" | "contacted" | "negotiation" | "won" | "lost"`)
  - `notes`: `string`
  - `loanStatus`: `string`
  - `updatedAt`: `timestamp`

#### `leads` (Collection - Marketplace Leads)
- `{marketplaceLeadId}` (Document ID)
  - `title`: `string`
  - `type`: `string`
  - `location`: `string`
  - `commissionAmount`: `number`
  - `status`: `string` (`"available" | "claimed"`)
  - `claimedBy`: `string` (Reference to `users` or null)
  - `createdAt`: `timestamp`

#### `academy` (Collection)
- `{courseId}` (Document ID)
  - `title`: `string`
  - `description`: `string`
  - `lessons`: `array` of `{ id: string, title: string, duration: string, completed: boolean }`

#### `wallets` (Collection)
- `{userId}` (Document ID = Auth UID)
  - `balance`: `number`
  - `commissionEarned`: `number`
  - `referralEarnings`: `number`
  - `transactions`: `array` of `{ id: string, amount: number, type: string, description: string, date: timestamp }`

#### `certificates` (Collection)
- `{certificateId}` (Document ID)
  - `userId`: `string`
  - `userName`: `string`
  - `courseName`: `string`
  - `qrCodeData`: `string`
  - `issuedAt`: `timestamp`
  - `digitalSignature`: `string`

#### `knowledge` (Collection)
- `{docId}` (Document ID)
  - `title`: `string`
  - `category`: `string`
  - `content`: `string`
  - `uploadedBy`: `string`
  - `createdAt`: `timestamp`

---

## 4. AI Action Engine Specification

The AI Action Engine parses every message through Gemini to determine the **Intent** and returns a structured JSON payload detailing the response and corresponding workflow controls.

### 4.1 Schema of AI Agent Response
```typescript
interface AgentResponse {
  text: string;                  // Conversational response
  suggestedCards: string[];      // Adaptive action cards
  action?: {
    type: string;                // 'OPEN_LOAN_WORKFLOW' | 'OPEN_CRM' | 'OPEN_WALLET' | 'START_ROLEPLAY' | etc.
    data?: any;                  // State parameters to load or prefill
  }
}
```

### 4.2 System Instructions
The agent is primed to act as the central Operating System.
- If a user inquires about a **Loan**, it opens the `LOAN_FORM` workflow, prefilling parameters from the conversation.
- If a user wants to check **CRM**, it redirects to the dynamic CRM grid.
- If a user requests **Learning/Academy**, it serves matching lesson workflows.
- If a user wants to practice sales, it engages in the **AI Role Play Customer Simulation**.

---

## 5. UI Navigation & Operating Modes

RBA AI OS features a beautiful side-by-side bento layout or single unified screen:
- **Left Panel (Core Conversation)**: The premium, distraction-free chat container.
- **Right Panel (Dynamic Workflow Stage)**: Appears fluidly when the AI triggers an action. For example, it transforms into:
  - An interactive, slide-in Loan Application Form
  - A Kanban-style CRM board
  - A Lead Marketplace claim grid
  - A Wallet Dashboard with micro-analytics
  - An Academy interactive player
  - A Certificate card with authentic QR codes and verification states
- **Toggle Mode**: Responsive viewports toggle seamlessly on mobile devices to satisfy Mobile-First directives.

---
This SAD and PRD represents the core specifications of the Royal Bulls Advisory Pvt. Ltd. platform. Proceeding to build.
