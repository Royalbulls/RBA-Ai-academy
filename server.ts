import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { ConversationRouter } from "./server/ai/router";
import { generateContentWithRetry } from "./server/ai/geminiCall";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialize Gemini SDK client
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required on the server");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // API Route: AI Action Engine / Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, currentUser } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const ai = getAi();

      // Extract user info for stateful context tracking
      const userId = currentUser?.id || "anon_guest";
      const userName = currentUser?.name || "Guest User";
      const userRole = currentUser?.role || "customer";
      const sessionId = currentUser?.id || "anon_session"; // Persist conversation per user

      const result = await ConversationRouter.routeMessage(
        sessionId,
        userId,
        userName,
        userRole,
        message,
        ai
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Chat API error:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Sales Objections Role Play Simulator
  app.post("/api/roleplay/message", async (req, res) => {
    try {
      const { message, history, customerType, product } = req.body;
      const ai = getAi();

      const contents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }],
          });
        }
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      const systemInstruction = `You are a simulated customer in an interactive sales practice session for Royal Bulls Advisory.
Customer Persona: ${customerType || "Skeptical & Price-Sensitive"}
Product of Interest: ${product || "Personal Loan"}

Rules for Roleplay Conversation:
1. Speak in character as a real, slightly difficult prospect (concerned about interest rates, hidden fees, processing speed, documentation).
2. Raise objections, ask hard questions, or voice doubts. Do not give in too quickly.
3. Keep your conversational response succinct and realistic.
4. IMPORTANT: At the end of your response, always attach a JSON evaluation block encapsulated in <rating_report> tags so the UI can parse your coaching feedback. Example:
<rating_report>
{
  "score": 82,
  "objectionMet": false,
  "feedback": "You did a good job explaining our custom interest rates, but you didn't address my question about hidden foreclosure charges."
}
</rating_report>`;

      const response = await generateContentWithRetry(
        ai,
        {
          contents,
          config: {
            systemInstruction,
          },
        },
        "gemini-3.5-flash",
        "gemini-flash-latest"
      );

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Roleplay API error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RBA AI OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
