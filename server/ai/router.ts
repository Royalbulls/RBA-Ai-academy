import { GoogleGenAI, Type } from "@google/genai";
import { AICoreEngine } from "./core";
import { Skills } from "./skills";
import { ToolRegistry } from "./registry";
import { KnowledgeEngine } from "./knowledge";
import { AISession } from "./types";
import { generateContentWithRetry } from "./geminiCall";

/**
 * Main orchestrator for the RBA AI Operating System conversational pipeline.
 */
export class ConversationRouter {
  
  /**
   * Routes the message through: Memory -> Intent Detection -> Knowledge RAG -> Tool Execution -> Gemini Synthesis -> Context Update.
   */
  static async routeMessage(
    sessionId: string,
    userId: string,
    userName: string,
    userRole: "customer" | "advisor" | "admin",
    userMessage: string,
    aiClient: GoogleGenAI
  ) {
    // 1. Core Engine: Restore or initialize context session
    const session = AICoreEngine.getOrCreateSession(sessionId, userId, userName, userRole);
    
    // Add user message to active memory buffer
    AICoreEngine.appendHistory(sessionId, {
      role: "user",
      text: userMessage,
      timestamp: new Date()
    });

    // 2. Intent Detection & Skill Routing
    // Analyze message to see if we should activate a specific Skill
    const detectedSkillId = this.detectSkillIntent(userMessage, session);
    if (detectedSkillId && detectedSkillId !== session.context.currentSkillId) {
      AICoreEngine.updateContext(sessionId, { currentSkillId: detectedSkillId });
    }

    const activeSkillId = session.context.currentSkillId || "loan_skill"; // Default fallback
    const activeSkill = Skills[activeSkillId] || Skills.loan_skill;

    // 3. Knowledge Engine: Search SOP documents (RAG)
    const knowledgeDocs = KnowledgeEngine.search(userMessage, 1);
    const knowledgeContext = knowledgeDocs.length > 0 
      ? `Retrieved SOP Guidelines:\n${knowledgeDocs.map(d => `[Source: ${d.title}]\n${d.content}`).join("\n")}`
      : "No specific SOP documents were matching this query.";

    // 4. Action Engine: Check if a registered Tool should be triggered
    const toolCallPlan = await this.planToolExecution(userMessage, activeSkillId, aiClient);
    
    let toolResultText = "";
    let clientAction = { type: "NONE", data: {} };

    if (toolCallPlan && toolCallPlan.toolName && ToolRegistry[toolCallPlan.toolName]) {
      const toolToExecute = ToolRegistry[toolCallPlan.toolName];
      console.log(`[ACTION ENGINE] Executing tool "${toolToExecute.definition.name}" with args:`, toolCallPlan.args);
      
      try {
        const result = await toolToExecute.execute(toolCallPlan.args, session.context);
        if (result.success) {
          toolResultText = `[Tool Execution Success] Result: ${result.message}`;
          if (result.clientAction) {
            clientAction = result.clientAction;
          }
        } else {
          toolResultText = `[Tool Execution Failed] Error: ${result.message}`;
        }
      } catch (err: any) {
        toolResultText = `[Tool Execution Exception] Error: ${err.message || "Unknown error"}`;
      }
    }

    // 5. Build dynamic contextualized instructions for Gemini
    const baseSystemPrompt = activeSkill.getSystemInstructions(session.context);
    
    const augmentedSystemPrompt = `
${baseSystemPrompt}

=========================================
OPERATING CONTEXT:
- Active Skill Module: ${activeSkill.name} (${activeSkill.id})
- User: ${userName} (Role: ${userRole}, ID: ${userId})
${knowledgeDocs.length > 0 ? `\n- RAG CONTEXT:\n${knowledgeContext}\n` : ""}
${toolResultText ? `\n- ACTION RESULT:\n${toolResultText}\n` : ""}
=========================================

RESPONSE INSTRUCTIONS:
1. Deliver a natural, highly helpful, and conversational response (bilingual: Hindi/English mixed, i.e. Hinglish).
2. If a tool was successfully executed, include its confirmation message naturally to reassure the user.
3. Keep the layout neat. Use standard markdown formatting (such as bullet points) for readability.
4. Suggest 3 to 4 related quick suggestion cards to guide their next steps.
5. Maintain standard client action payloads. If a clientAction is provided above, make sure the final action JSON matches it.

Respond ONLY in JSON.
    `.trim();

    // 6. Gemini Synthesis
    const contents = session.history.map(turn => ({
      role: turn.role === "user" ? "user" : "model",
      parts: [{ text: turn.text }]
    }));

    const synthesisResponse = await generateContentWithRetry(
      aiClient,
      {
        contents,
        config: {
          systemInstruction: augmentedSystemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              suggestedCards: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  data: { type: Type.OBJECT }
                },
                required: ["type"]
              }
            },
            required: ["text", "suggestedCards", "action"]
          }
        }
      },
      "gemini-3.5-flash",
      "gemini-flash-latest"
    );

    const outputText = synthesisResponse.text;
    if (!outputText) {
      throw new Error("Unable to synthesize AI response.");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(outputText.trim());
    } catch (e) {
      // Robust fallback if parsing fails
      parsedResponse = {
        text: outputText,
        suggestedCards: ["Apply for Loan", "Check Wallet", "Open CRM"],
        action: { type: "NONE", data: {} }
      };
    }

    // Preserve executed client action if it was resolved by the tool
    if (clientAction.type !== "NONE") {
      parsedResponse.action = clientAction;
    }

    // Append synthesized model response to memory
    AICoreEngine.appendHistory(sessionId, {
      role: "model",
      text: parsedResponse.text,
      timestamp: new Date()
    });

    return parsedResponse;
  }

  /**
   * Local intent matcher to switch Skills.
   */
  private static detectSkillIntent(message: string, session: AISession): string | null {
    const msg = message.toLowerCase();

    if (msg.includes("loan") || msg.includes("लोन") || msg.includes("interest") || msg.includes("emi")) {
      return "loan_skill";
    }
    if (msg.includes("crm") || msg.includes("lead") || msg.includes("लीड") || msg.includes("client") || msg.includes("ग्राहक")) {
      return "crm_skill";
    }
    if (msg.includes("academy") || msg.includes("learn") || msg.includes("objection") || msg.includes("roleplay") || msg.includes("अकादमी") || msg.includes("सिखना")) {
      return "academy_skill";
    }
    if (msg.includes("wallet") || msg.includes("commission") || msg.includes("earnings") || msg.includes("बैलेंस") || msg.includes("वॉलेट")) {
      return "wallet_skill";
    }
    if (msg.includes("sop") || msg.includes("policy") || msg.includes("manual") || msg.includes("नियम") || msg.includes("दस्तावेज़")) {
      return "knowledge_skill";
    }

    return null;
  }

  /**
   * Asks Gemini if any tool matches the user's intent, and extracts the parameters.
   */
  private static async planToolExecution(
    message: string, 
    activeSkillId: string, 
    aiClient: GoogleGenAI
  ): Promise<{ toolName: string; args: any } | null> {
    const msg = message.toLowerCase();

    // Fast-path local heuristics before querying LLM for performance
    const matchesLoan = msg.includes("apply") || msg.includes("personal") || msg.includes("business") || msg.includes("home");
    const matchesCrm = msg.includes("add") || msg.includes("create") || msg.includes("save") || msg.includes("contact");
    const matchesWallet = msg.includes("balance") || msg.includes("commission") || msg.includes("earning") || msg.includes("payout");
    const matchesKnowledge = msg.includes("search") || msg.includes("find") || msg.includes("sop") || msg.includes("policy");
    const matchesPractice = msg.includes("start") || msg.includes("practice") || msg.includes("objection");

    if (!matchesLoan && !matchesCrm && !matchesWallet && !matchesKnowledge && !matchesPractice) {
      return null; // Skip if no action keywords found
    }

    try {
      const toolPlanningInstruction = `
You are the Tool Planning Orchestrator within RBA AI OS.
Determine if the user's latest query requires calling one of these specific registered tools:

1. "apply_for_loan": Use this ONLY when the user explicitly requests to start a loan application (e.g., "Create personal loan application", "Apply for home loan").
   Parameters:
   - applicantName (string, required)
   - applicantPhone (string, required)
   - type (string, personal|business|home, required)
   - monthlyIncome (number, required)
   - amountRequested (number, required)

2. "create_crm_lead": Use this when the user requests to save/add a client or create a pipeline lead in CRM.
   Parameters:
   - clientName (string, required)
   - clientPhone (string, required)
   - interest (string, required)
   - status (string, optional)
   - notes (string, optional)

3. "get_wallet_balance": Use this when the user asks to check commissions, wallet balance, withdrawable cash, or TDS reports.
   Parameters: none

4. "search_knowledge": Use this when the user asks to look up, search, or check SOP policies, documents, or compliance sheets.
   Parameters:
   - query (string, required)

5. "start_sales_practice": Use this when the user wants to start practicing objections or starting the sales training simulator.
   Parameters:
   - customerType (string, required, e.g. skeptical, busy, frugal)
   - product (string, required, e.g. Personal Loan, Business Loan)

If NO tool is matching the user's intent, set toolName to "NONE".
Provide extracted parameters based on the message.

Respond ONLY in JSON.
      `.trim();

      const planningResponse = await generateContentWithRetry(
        aiClient,
        {
          contents: `Analyze the query: "${message}" and choose the correct tool.`,
          config: {
            systemInstruction: toolPlanningInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                toolName: { type: Type.STRING },
                args: { type: Type.OBJECT }
              },
              required: ["toolName"]
            }
          }
        },
        "gemini-3.5-flash",
        "gemini-flash-latest"
      );

      const planText = planningResponse.text;
      if (!planText) return null;

      const parsedPlan = JSON.parse(planText.trim());
      if (parsedPlan.toolName && parsedPlan.toolName !== "NONE") {
        return {
          toolName: parsedPlan.toolName,
          args: parsedPlan.args || {}
        };
      }
    } catch (e) {
      console.error("[Tool Planning Exception]", e);
    }

    return null;
  }
}
