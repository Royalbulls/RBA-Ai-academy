import { Tool, AIOSContext } from "./types";
import { KnowledgeEngine } from "./knowledge";

export const ToolRegistry: Record<string, Tool> = {
  // 1. Tool: apply_for_loan
  apply_for_loan: {
    definition: {
      name: "apply_for_loan",
      description: "Registers a client loan application after gathering relevant criteria (applicantName, applicantPhone, type, monthlyIncome, amountRequested). Validates rules and logs it.",
      permissionLevel: "all",
      parameters: {
        applicantName: { type: "string", description: "Full name of the loan applicant", required: true },
        applicantPhone: { type: "string", description: "10-digit mobile number of the applicant", required: true },
        type: { type: "string", description: "Type of loan ('personal', 'business', or 'home')", required: true },
        monthlyIncome: { type: "number", description: "Monthly income of the applicant in INR", required: true },
        amountRequested: { type: "number", description: "Total loan principal amount requested in INR", required: true }
      }
    },
    execute: async (args: {
      applicantName: string;
      applicantPhone: string;
      type: "personal" | "business" | "home";
      monthlyIncome: number;
      amountRequested: number;
    }, context: AIOSContext) => {
      // Validate data
      if (args.amountRequested <= 0) {
        return { success: false, message: "लोन की राशि ₹0 से अधिक होनी चाहिए।" };
      }
      if (args.monthlyIncome <= 0) {
        return { success: false, message: "कृपया सही मासिक आय दर्ज करें।" };
      }

      // Check underwriting rules based on SOP
      let eligibilityNote = "Under review.";
      const maxLtvEmi = args.monthlyIncome * 0.50; // max 50% LTI
      const estEmi = (args.amountRequested * 0.12) / 12; // Simple 12% p.a interest proxy

      if (estEmi > maxLtvEmi) {
        eligibilityNote = "सलाह: मासिक आय की तुलना में ऋण राशि अधिक है। SOP के अनुसार 50% से अधिक EMI सीमा पार हो रही है।";
      } else {
        eligibilityNote = "SOP के अनुसार आपकी मासिक आय योग्य है। आपकी लोन पात्रता उत्कृष्ट है!";
      }

      const clientActionPayload = {
        type: "OPEN_LOAN_WORKFLOW",
        data: {
          type: args.type,
          amountRequested: args.amountRequested,
          applicantName: args.applicantName,
          applicantPhone: args.applicantPhone,
          monthlyIncome: args.monthlyIncome,
          eligibilityNote
        }
      };

      return {
        success: true,
        data: { eligibilityNote, estEmi },
        message: `लोन आवेदन तैयार है! हमने **₹${args.amountRequested.toLocaleString()}** ${args.type} लोन के लिए ड्राफ्ट तैयार कर लिया है। ${eligibilityNote}`,
        clientAction: clientActionPayload
      };
    }
  },

  // 2. Tool: create_crm_lead
  create_crm_lead: {
    definition: {
      name: "create_crm_lead",
      description: "Creates a new client record / lead tracking inside the Advisor CRM workspace.",
      permissionLevel: "advisor",
      parameters: {
        clientName: { type: "string", description: "Name of the potential customer", required: true },
        clientPhone: { type: "string", description: "Contact number", required: true },
        interest: { type: "string", description: "Financial product interest (e.g. 'Personal Loan', 'GST Business Loan')", required: true },
        status: { type: "string", description: "Current workflow stage ('new', 'contacted', 'doc_pending', 'won')", required: false },
        notes: { type: "string", description: "Specific comments or context", required: false }
      }
    },
    execute: async (args: {
      clientName: string;
      clientPhone: string;
      interest: string;
      status?: string;
      notes?: string;
    }, context: AIOSContext) => {
      const stage = args.status || "new";
      
      const clientActionPayload = {
        type: "OPEN_CRM",
        data: {
          leadDraft: {
            name: args.clientName,
            phone: args.clientPhone,
            interest: args.interest,
            status: stage,
            notes: args.notes || "Created via RBA AI Voice/Text Agent."
          }
        }
      };

      return {
        success: true,
        data: { leadId: `lead_${Date.now()}` },
        message: `लीड तैयार है! **${args.clientName}** को CRM बोर्ड में शामिल कर लिया गया है (स्टेज: **${stage}**)।`,
        clientAction: clientActionPayload
      };
    }
  },

  // 3. Tool: get_wallet_balance
  get_wallet_balance: {
    definition: {
      name: "get_wallet_balance",
      description: "Fetches current commission wallet balance, withdrawable funds, pending credits, and TDS deduction details.",
      permissionLevel: "all",
      parameters: {}
    },
    execute: async (args: {}, context: AIOSContext) => {
      const isGuest = context.userId.startsWith("anon") || context.sessionMemory.isGuest;
      
      const walletData = isGuest ? {
        balance: 0,
        withdrawable: 0,
        pending: 0,
        tdsDeductions: 0,
        currency: "INR",
        note: "Anonymous/Guest users have no active payouts."
      } : {
        balance: 45780,
        withdrawable: 38500,
        pending: 7280,
        tdsDeductions: 2289,
        currency: "INR",
        note: "5% TDS deducted under Section 194H."
      };

      const clientActionPayload = {
        type: "OPEN_WALLET",
        data: walletData
      };

      return {
        success: true,
        data: walletData,
        message: isGuest 
          ? "आप वर्तमान में एक अतिथि (Guest) उपयोगकर्ता हैं। कमीशन ट्रैक करने के लिए कृपया अपने मोबाइल नंबर या गूगल अकाउंट से लॉग इन करें।"
          : `आपका उपलब्ध कमीशन बैलेंस **₹${walletData.withdrawable.toLocaleString()}** है और **₹${walletData.pending.toLocaleString()}** पेंडिंग में है।`,
        clientAction: clientActionPayload
      };
    }
  },

  // 4. Tool: search_knowledge
  search_knowledge: {
    definition: {
      name: "search_knowledge",
      description: "Performs an internal knowledge base search across all Standard Operating Procedures (SOPs), manuals, and policy sheets.",
      permissionLevel: "all",
      parameters: {
        query: { type: "string", description: "Search terms or keywords representing the user query", required: true }
      }
    },
    execute: async (args: { query: string }, context: AIOSContext) => {
      const results = KnowledgeEngine.search(args.query, 2);
      
      const clientActionPayload = {
        type: "OPEN_KNOWLEDGE",
        data: {
          searchQuery: args.query,
          results: results.map(r => ({ id: r.id, title: r.title, category: r.category }))
        }
      };

      if (results.length === 0) {
        return {
          success: true,
          data: { results: [] },
          message: `क्षमा करें, मुझे "${args.query}" से संबंधित कोई विशिष्ट SOP दस्तावेज़ नहीं मिला। आप लोन या कमीशन से जुड़े सवाल पूछ सकते हैं।`,
          clientAction: clientActionPayload
        };
      }

      const formattedResults = results.map(r => `### ${r.title}\n${r.content}`).join("\n\n");

      return {
        success: true,
        data: { results },
        message: `मुझे आपके प्रश्न के लिए SOP नॉलेज बेस में ये जानकारी मिली है:\n\n${formattedResults}`,
        clientAction: clientActionPayload
      };
    }
  },

  // 5. Tool: start_sales_practice
  start_sales_practice: {
    definition: {
      name: "start_sales_practice",
      description: "Launches the sales academy objection handling training simulator with a customizable prospect persona.",
      permissionLevel: "all",
      parameters: {
        customerType: { type: "string", description: "Prospect type ('skeptical', 'busy', 'frugal', 'confused')", required: true },
        product: { type: "string", description: "Product of focus (e.g. 'Personal Loan', 'Business Loan')", required: true }
      }
    },
    execute: async (args: { customerType: string; product: string }, context: AIOSContext) => {
      const clientActionPayload = {
        type: "START_ROLEPLAY",
        data: {
          customerType: args.customerType,
          product: args.product
        }
      };

      return {
        success: true,
        data: args,
        message: `अकादमी अभ्यास सत्र शुरू हो गया है! एक **${args.customerType}** ग्राहक **${args.product}** के लिए आपसे संपर्क कर रहा है। उससे बात करने के लिए सिम्युलेटर का उपयोग करें।`,
        clientAction: clientActionPayload
      };
    }
  }
};
