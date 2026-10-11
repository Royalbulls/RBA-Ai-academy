# RBA Startup Mission Portal — Product & Technical Blueprint

**Product owner:** Royal Bulls Advisory Pvt. Ltd.  
**Initiative:** RBA Startup Mission  
**Target market:** India-wide, launch pilot in Sagar, Madhya Pradesh  
**Status:** Implementation blueprint; not yet deployed  
**Primary promise:** Your business idea. Our strategy. Your own business.

## 1. Product goal

Build a mobile-first startup assistance portal that captures prospective entrepreneurs, assesses their needs, sells clearly scoped advisory packages, tracks delivery, and supports follow-up. The portal must work for first-time founders, women entrepreneurs, small retailers, service businesses, home businesses, and existing businesses seeking growth.

The platform is an advisory and enablement service. It must not promise business success, loans, grants, licences, government benefits, or guaranteed revenue.

## 2. Recommended architecture

Extend the existing RBA AI OS / RBA AI Academy repository rather than starting a disconnected product.

- Frontend: existing React + TypeScript + Vite application.
- Authentication: Firebase Authentication.
- Database: Cloud Firestore.
- File uploads: Firebase Storage only when required; private by default.
- Server-side privileged actions: Firebase Cloud Functions or the existing trusted server layer.
- AI: optional Gemini-powered idea discovery and draft generation, with human review before a report is delivered.
- Payments: integrate a provider such as Razorpay only after merchant onboarding, payment verification, refund rules, and webhook validation are configured.
- Notifications: email/WhatsApp integration only after approved provider credentials and consent workflows exist.
- Hosting: current Firebase/Google hosting setup after security rules and production configuration are verified.

Do not put secret API keys, payment secrets, admin privileges, or trusted pricing logic in client-side code.

## 3. User roles

1. **Visitor:** reads service pages, pricing, FAQs, and submits an enquiry.
2. **Applicant / Customer:** views own application, status, invoices, deliverables, and follow-up.
3. **Advisor / Case Manager:** sees assigned leads and cases, adds internal notes, prepares deliverables, and updates workflow status.
4. **Admin:** manages users, services, packages, assignments, status transitions, payments, reports, and audit records.
5. **Finance role (optional):** views payment and refund records but cannot edit advisory content or user roles.

Admin access must be granted server-side or through trusted custom claims. Never allow a public user to assign themselves an admin/advisor role.

## 4. Public website routes

- `/` — landing page and primary CTA
- `/services` — service catalogue
- `/pricing` — transparent packages and inclusions
- `/apply` — startup assistance application
- `/how-it-works` — service process
- `/about` — company and mission
- `/faq` — common questions
- `/contact` — contact and support
- `/privacy`, `/terms`, `/refund-policy`, `/disclaimer` — legal and service terms

## 5. Customer portal routes

- `/portal` — customer overview
- `/portal/applications` — application list and status
- `/portal/applications/:id` — case details and timeline
- `/portal/payments` — payment and invoice history
- `/portal/documents` — deliverables shared with customer
- `/portal/profile` — profile and consent preferences

Customers may read only their own records. Internal notes, staff assignment data, fraud signals, and other customers' data must never be exposed to customers.

## 6. Admin routes

- `/admin` — operational dashboard
- `/admin/leads` — new enquiries and qualification
- `/admin/applications` — case pipeline, search, filters, status
- `/admin/applications/:id` — full case workspace
- `/admin/customers` — customer records with least-privilege access
- `/admin/services` — package catalogue and versioned pricing
- `/admin/payments` — verified payment events, refunds, reconciliation
- `/admin/advisors` — assignments and workload
- `/admin/reports` — funnel, service turnaround, revenue, refunds
- `/admin/audit-log` — sensitive admin actions

## 7. Application form

Required fields:
- Full name
- Mobile number
- State and city/district
- Preferred language (Hindi / English / other)
- Business stage (idea / planning / existing business / expansion)
- Business category
- Preferred operating model (online / offline / hybrid)
- Approximate available investment range
- Experience level
- Type of help requested
- Preferred contact time
- Consent to be contacted and privacy notice acknowledgement

Optional:
- Business description
- Existing website/social page
- Preferred meeting format

Do not collect Aadhaar numbers, bank account details, passwords, OTPs, or unnecessary identity documents at initial enquiry. If later legally necessary, collect only through an approved secure process and explain the purpose.

After submission, generate a non-guessable application ID, show a confirmation screen, and send a receipt only if a verified notification channel is configured. Add server-side validation, rate limiting, spam protection, and duplicate enquiry handling.

## 8. Service packages (configurable, not hard-coded)

Initial proposed packages for pilot testing:

- Startup Discovery — ₹99: initial needs assessment.
- Business Idea Report — ₹499: 2–3 suitable ideas, preliminary budget ranges, assumptions and risks.
- Business Plan Pro — ₹999: business model, target customer, pricing logic, cost assumptions and 90-day action plan.
- Startup Setup Assist — ₹1,999: agreed setup checklist, supplier research and process guidance.
- Business Launch Partner — ₹2,999–₹4,999: defined launch support, marketing assets and early-stage review.

These are proposed prices, not validated market rates. Admins must manage price, tax treatment, package inclusions, delivery timeline, exclusions, refund conditions and version history. The checkout page must show the exact scope before payment.

## 9. Case workflow

`new` → `contact_pending` → `qualified` / `not_qualified` → `consultation_scheduled` → `proposal_sent` → `awaiting_payment` → `paid` → `in_progress` → `review` → `delivered` → `follow_up` → `closed`

Additional controlled states: `on_hold`, `cancelled`, `refund_requested`, `refunded`.

Every status transition should record actor, timestamp, previous state, new state, and optional reason. Payment success must be confirmed server-side through a verified provider webhook, not a client redirect or screenshot.

## 10. Firestore data model

- `users/{uid}`: display name, verified contact, locale, createdAt, consent state; no client-writable role.
- `startupApplications/{applicationId}`: applicant uid when authenticated, contact details, location, category, stage, budget range, requested help, consent, status, assigned advisor, timestamps.
- `applicationEvents/{eventId}`: applicationId, event type, actor, timestamp, public-safe message, internal/private flag.
- `servicePackages/{packageId}`: active version, title, price, inclusions, exclusions, tax note, delivery target, active flag.
- `orders/{orderId}`: customer uid, applicationId, package version snapshot, amount, currency, tax breakdown, order state.
- `paymentEvents/{eventId}`: provider reference, verified event type, order id, amount, signature verification result, timestamp; server-written only.
- `deliverables/{deliverableId}`: applicationId, customer uid, title, private storage path, version, status, publishedAt.
- `advisorAssignments/{assignmentId}`: applicationId, advisor uid, assignedBy, timestamp.
- `consents/{consentId}`: uid/applicationId, notice version, purposes, timestamp, source.
- `auditLogs/{logId}`: actor, action, target, timestamp, redacted metadata; server-written only.

Use server timestamps, document-size limits, retention rules, and pagination. Avoid duplicating sensitive personal data across collections.

## 11. Security and privacy acceptance criteria

- Firestore rules deny access by default.
- Unauthenticated visitors can create a validated enquiry through a rate-limited server endpoint; they cannot query application collections.
- Customers can read only their own applications, orders, and published deliverables.
- Advisors can access only assigned cases and necessary fields.
- Finance users have payment-only access as configured.
- Admin role is controlled by trusted claims and server-side authorization.
- Payment records, role changes, refunds, exports, and deliverable publication are audited.
- Storage rules restrict files to authorised users; private files use short-lived access where supported.
- Logs redact mobile numbers and other personal information.
- Consent, privacy notice, deletion/correction requests, grievance contact, and retention rules are implemented before public launch.
- Test against cross-user reads/writes, role escalation, invalid status transitions, forged payment callbacks, and oversized/spam submissions.

## 12. Admin dashboard KPIs

- New enquiries by day/week/source/state
- Contacted and qualified leads
- Consultation conversion rate
- Proposal-to-payment conversion
- Revenue collected and refunds, based on verified events
- Cases by status and advisor workload
- Average first-response and delivery time
- Overdue cases
- Customer feedback and complaints
- Repeat purchase/referral rate

Do not report projected revenue as actual revenue. Label sample/demo records clearly and exclude them from production totals.

## 13. AI assistance guardrails

AI may draft idea options, interview questions, preliminary cost assumptions, marketing copy, and business-plan sections. Each report must show assumptions, uncertainty, date of research, and items requiring local verification. AI must not invent supplier quotes, official scheme eligibility, registration approval, market counts, or guaranteed profits. Human review is required before paid deliverables are published.

## 14. Delivery roadmap

### Phase 1 — Working MVP
- Responsive public landing pages
- Validated application form
- Firebase Authentication
- Customer application status page
- Admin lead/case dashboard
- Manual package selection and payment tracking
- Private deliverables
- Security rules and test suite

### Phase 2 — Paid workflow
- Server-created payment orders
- Verified provider webhooks
- Invoices/receipts and refund workflow
- Email/WhatsApp notifications with consent
- Advisor assignment and SLA reminders

### Phase 3 — Scalable operations
- AI-assisted report drafting with human review
- State/category-specific service templates
- Supplier/partner directory with verification and disclosure
- Referral tracking
- Analytics exports and workload planning
- Multi-language content and accessibility improvements

## 15. Definition of done

The portal is not production-ready until:
1. Application data persists to Firestore and survives refresh/login.
2. Customer and staff permissions pass automated security tests.
3. Admin actions are server-authorized and audited.
4. Payment status is webhook-verified or clearly marked manual/unverified.
5. All primary forms have loading, success, validation and error states.
6. Mobile layouts are usable at 360px width.
7. Empty, loading, offline and permission-denied states are handled.
8. Privacy, terms, refund and disclaimer pages are published.
9. A production build and smoke tests pass.
10. No demo data, test credentials, or secrets are shipped into production.

## 16. Suggested first implementation task

Add the RBA Startup Mission as a distinct module inside the existing RBA AI OS navigation, preserving current AI Academy, CRM, loan workflows and admin features. Implement the public application flow and internal case management first. Do not replace the existing app shell or rewrite the large main application file unnecessarily; use focused, reusable components and services.
