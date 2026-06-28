import { AISession, ChatTurn, AIOSContext } from "./types";

export class AICoreEngine {
  // In-memory sessions storage (could easily be persisted to Firestore users collection in the future)
  private static sessions: Map<string, AISession> = new Map();

  /**
   * Retrieves or instantiates a safe context-aware chat session for a user.
   */
  static getOrCreateSession(
    sessionId: string, 
    userId: string, 
    userName: string, 
    userRole: "customer" | "advisor" | "admin"
  ): AISession {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      // Keep the context current with user details
      existing.context.userId = userId;
      existing.context.userRole = userRole;
      existing.context.userName = userName;
      existing.lastActive = new Date();
      return existing;
    }

    // Create brand new stateful workspace
    const newSession: AISession = {
      sessionId,
      userId,
      history: [],
      context: {
        userId,
        userRole,
        userName,
        sessionMemory: {},
      },
      lastActive: new Date()
    };

    this.sessions.set(sessionId, newSession);
    return newSession;
  }

  /**
   * Appends messages to the conversation memory buffer.
   */
  static appendHistory(sessionId: string, turn: ChatTurn): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.history.push(turn);
    session.lastActive = new Date();

    // Bound memory size to avoid token overflow
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }
  }

  /**
   * Updates contextual parameters (e.g. current selected Skill) inside the session context.
   */
  static updateContext(sessionId: string, updates: Partial<AIOSContext>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.context = {
      ...session.context,
      ...updates
    };
    session.lastActive = new Date();
  }

  /**
   * Clean up stale sessions (older than 30 minutes) to prevent memory leak
   */
  static cleanupStaleSessions(): void {
    const threshold = 30 * 60 * 1000; // 30 mins
    const now = Date.now();

    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActive.getTime() > threshold) {
        this.sessions.delete(key);
      }
    }
  }
}
