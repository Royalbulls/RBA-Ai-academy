import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/**
 * 1. Synchronize Custom Claims with Firestore Roles automatically on write.
 * Whenever a user's Firestore document is created or updated, we verify their role
 * and update their Firebase Authentication custom claims securely.
 */
export const syncUserClaims = onDocumentWritten("users/{userId}", async (event) => {
  const userId = event.params.userId;
  const data = event.data?.after.data();

  if (!data) {
    // User deleted: delete custom claims from auth
    try {
      await auth.setCustomUserClaims(userId, null);
      console.log(`Successfully cleared custom claims for deleted user: ${userId}`);
    } catch (err) {
      console.error(`Failed to clear custom claims for deleted user ${userId}:`, err);
    }
    return;
  }

  const role = data.role || "customer";

  try {
    // Set custom claim corresponding to their Firestore role
    await auth.setCustomUserClaims(userId, {
      role: role,
      isAdmin: role === "admin"
    });
    console.log(`Successfully synchronized custom claims for user ${userId} to role: ${role}`);
  } catch (err) {
    console.error(`Failed to synchronize custom claims for user ${userId}:`, err);
  }
});

/**
 * 2. Secure Callable Endpoint: Assign Admin Role
 * This endpoint allows promoting a user to admin. To prevent self-promotion and satisfy
 * Section 5 & 9, it strictly requires the caller to already possess the admin claim.
 */
export const assignAdminRole = onCall(async (request) => {
  // Ensure the caller is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Only authenticated administrators can assign roles."
    );
  }

  // Ensure the caller has admin custom claims
  const callerClaims = request.auth.token;
  if (!callerClaims.isAdmin && callerClaims.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Access Denied: Only administrators can promote users to Admin."
    );
  }

  const targetUid = request.data.uid;
  if (!targetUid) {
    throw new HttpsError(
      "invalid-argument",
      "The parameter 'uid' is required."
    );
  }

  try {
    // Update role in Firestore, which triggers the syncUserClaims Firestore Function
    const userRef = db.collection("users").doc(targetUid);
    await userRef.update({
      role: "admin",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: `User ${targetUid} promoted to admin successfully.`
    };
  } catch (err: any) {
    console.error(`Failed to promote user ${targetUid} to admin:`, err);
    throw new HttpsError(
      "internal",
      `Failed to promote user to admin: ${err.message}`
    );
  }
});

/**
 * 3. Secure Callable Endpoint: Approve Advisor Role
 * This endpoint promotes a verified customer to an approved RBA Advisor.
 * It is strictly restricted to administrative users.
 */
export const approveAdvisor = onCall(async (request) => {
  // Ensure the caller is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Only authenticated administrators can approve advisors."
    );
  }

  // Ensure the caller has admin custom claims
  const callerClaims = request.auth.token;
  if (!callerClaims.isAdmin && callerClaims.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Access Denied: Only administrators can approve advisors."
    );
  }

  const targetUid = request.data.uid;
  if (!targetUid) {
    throw new HttpsError(
      "invalid-argument",
      "The parameter 'uid' is required."
    );
  }

  try {
    // Update Firestore user role to 'advisor', triggering syncUserClaims
    const userRef = db.collection("users").doc(targetUid);
    await userRef.update({
      role: "advisor",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: `User ${targetUid} approved as RBA Advisor successfully.`
    };
  } catch (err: any) {
    console.error(`Failed to approve user ${targetUid} as advisor:`, err);
    throw new HttpsError(
      "internal",
      `Failed to approve advisor: ${err.message}`
    );
  }
});
