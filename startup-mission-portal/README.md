# RBA Startup Mission Portal

Independent, India-focused startup advisory portal by Royal Bulls Advisory Pvt. Ltd. Pilot market: Sagar, Madhya Pradesh.

## Current implementation

- Responsive public landing page and service/pricing sections
- Startup assistance application form with client validation
- Firebase callable-function submission (App Check enforced)
- Server-side validation, honeypot, short-window duplicate guard
- Admin sign-in and staff-only application list/status update
- Firestore deny-by-default rules
- English/Hindi content toggle for the core landing and form experience

## Stack

React, TypeScript, Vite, Firebase Authentication, Cloud Firestore, Firebase Functions v2.

## Local development

1. Use Node.js 20 or newer.
2. `cp .env.example .env.local` and populate Firebase web-app values.
3. In Firebase Console, enable Email/Password Authentication and create a Firestore database.
4. Configure Firebase App Check for the web app (reCAPTCHA Enterprise site key) and register the app.
5. From this directory run `npm install`, then `npm run dev`.
6. In `functions/`, run `npm install` and `npm run build`.
7. Deploy rules/functions/hosting only after reviewing the checklist below.

## Required before public production launch

- Set `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` and initialise App Check in the client using your real site key; do not disable server enforcement to make the form work.
- Create Firebase Auth users for staff and set custom claims (`admin: true` or `startupAdvisor: true`) through a trusted Admin SDK script or controlled server process. Never set staff claims from the browser.
- Verify Firestore rules, App Check enforcement, duplicate guard behaviour, rate limiting and abuse protection.
- Configure the actual company support phone/email, privacy notice, terms, refund policy, grievance contact, retention and deletion process.
- Configure real package terms and tax treatment. No online payment is claimed to be implemented; integrate a provider only after merchant onboarding and verified server webhooks.
- Run `npm run build`, functions build, security tests, accessibility/mobile tests, and production smoke tests.
- Set Firebase budget alerts, monitoring and backups. Avoid collecting Aadhaar, bank details, OTPs or unnecessary identity documents.

## Deploy

From this folder, after the checks above:
- `npm run build`
- `cd functions && npm install && npm run build && cd ..`
- `firebase deploy --only firestore:rules,functions:startup-mission,hosting`

Use the correct Firebase project explicitly (for example `firebase use <project-id>`) and review the deployment target before deploying.

## Packages (proposed pilot pricing)

- Startup Discovery — ₹99
- Business Idea Report — ₹499
- Business Plan Pro — ₹999
- Startup Setup Assist — ₹1,999
- Business Launch Partner — ₹2,999–₹4,999

Pricing is configurable in product policy; no payment gateway is active in this starter implementation.

## Security model

Public application writes happen through an App-Check-enforced callable function. Firestore direct writes are denied. Staff reads require trusted custom claims. The callable function validates inputs and creates an application code. The current duplicate guard is a coarse safeguard, not a substitute for a dedicated rate limiter. Do not launch until App Check is initialised and staff claims are provisioned.
