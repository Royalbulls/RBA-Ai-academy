import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

initializeApp();
const db = getFirestore();

const allowedCategories = new Set([
  "Retail & Trading", "Food & Beverage", "Professional Services",
  "Manufacturing", "Digital / Online", "Agriculture", "Education & Training",
  "Beauty & Wellness", "Home Business", "Other"
]);
const allowedStages = new Set(["Idea stage", "Planning", "Existing business", "Business expansion"]);
const allowedBudgets = new Set(["Below ₹5,000", "₹5,000–₹15,000", "₹15,000–₹50,000", "₹50,000–₹2 lakh", "Above ₹2 lakh", "Not decided"]);
const allowedHelp = new Set(["Business idea", "Business plan", "Supplier research", "Setup guidance", "Marketing & sales", "Registration guidance"]);

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const submitStartupApplication = onCall(
  { region: "asia-south1", enforceAppCheck: true },
  async (request) => {
    const data = request.data ?? {};
    const name = clean(data.name, 100);
    const phone = clean(data.phone, 20);
    const city = clean(data.city, 100);
    const state = clean(data.state, 100);
    const language = clean(data.language, 30);
    const category = clean(data.category, 60);
    const stage = clean(data.stage, 40);
    const budget = clean(data.budget, 40);
    const mode = clean(data.mode, 30);
    const help = clean(data.help, 50);
    const description = clean(data.description, 1200);
    const consent = data.consent === true;
    const website = clean(data.website, 200); // honeypot; real users leave blank

    if (website) throw new HttpsError("invalid-argument", "Unable to accept this request.");
    if (name.length < 2 || !/^[0-9+()-s]{8,20}$/.test(phone) || city.length < 2 || state.length < 2) {
      throw new HttpsError("invalid-argument", "Please check your name, phone number and location.");
    }
    if (!allowedCategories.has(category) || !allowedStages.has(stage) || !allowedBudgets.has(budget) ||
        !allowedHelp.has(help) || !["Online", "Offline", "Hybrid"].includes(mode) ||
        !["Hindi", "English", "Other"].includes(language) || !consent) {
      throw new HttpsError("invalid-argument", "Please complete all required fields and consent.");
    }

    const now = Date.now();
    const phoneKey = phone.replace(/D/g, "").slice(-10);
    if (phoneKey.length < 8) throw new HttpsError("invalid-argument", "Enter a valid contact number.");

    // Coarse duplicate guard. App Check is mandatory; this is not a substitute for a
    // production rate limiter or a privacy-reviewed retention policy.
    const recent = await db.collection("startupApplications")
      .where("phoneKey", "==", phoneKey)
      .where("createdAtMs", ">", now - 10 * 60 * 1000)
      .limit(1).get();
    if (!recent.empty) {
      throw new HttpsError("resource-exhausted", "An application with this number was submitted recently. Please wait before retrying.");
    }

    const ref = db.collection("startupApplications").doc();
    await ref.set({
      applicationCode: "RBA-" + now.toString(36).toUpperCase() + "-" + ref.id.slice(0, 5).toUpperCase(),
      name, phone, phoneKey, city, state, language, category, stage, budget, mode, help,
      description, consent, consentVersion: "2026-10-v1",
      status: "new", source: "public-portal",
      ownerUid: request.auth?.uid ?? null,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
      updatedAt: FieldValue.serverTimestamp()
    });
    logger.info("Startup application received", { applicationId: ref.id });
    return { success: true, applicationCode: (await ref.get()).get("applicationCode") };
  }
);

export const updateStartupApplicationStatus = onCall(
  { region: "asia-south1", enforceAppCheck: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Please sign in.");
    const token = request.auth.token as Record<string, unknown>;
    if (token.admin !== true && token.startupAdvisor !== true) {
      throw new HttpsError("permission-denied", "Authorised staff access is required.");
    }
    const id = clean(request.data?.id, 150);
    const status = clean(request.data?.status, 40);
    const note = clean(request.data?.note, 500);
    const allowedStatuses = new Set(["contact_pending", "qualified", "not_qualified", "consultation_scheduled", "proposal_sent", "awaiting_payment", "paid", "in_progress", "review", "delivered", "follow_up", "closed", "on_hold", "cancelled"]);
    if (!id || !allowedStatuses.has(status)) throw new HttpsError("invalid-argument", "Invalid application or status.");
    const ref = db.collection("startupApplications").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Application not found.");
    await db.runTransaction(async tx => {
      tx.update(ref, { status, internalNote: note, updatedAt: FieldValue.serverTimestamp(), updatedBy: request.auth!.uid });
      const event = db.collection("startupApplicationEvents").doc();
      tx.set(event, { applicationId: id, actorUid: request.auth!.uid, action: "status_changed", status, note, createdAt: FieldValue.serverTimestamp() });
    });
    return { success: true };
  }
);