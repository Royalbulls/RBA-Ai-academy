export type PermissionLevel = "customer" | "advisor" | "admin" | "all";

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  permissionLevel: PermissionLevel;
}

export interface Tool {
  definition: ToolDefinition;
  execute: (args: any, context: AIOSContext) => Promise<{
    success: boolean;
    data?: any;
    message: string;
    clientAction?: {
      type: string;
      data: any;
    };
  }>;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  tools: string[]; // List of tool names associated with this skill
  getSystemInstructions: (context: AIOSContext) => string;
}

export interface ChatTurn {
  role: "user" | "model" | "system";
  text: string;
  timestamp: Date;
}

export interface AIOSContext {
  userId: string;
  userRole: "customer" | "advisor" | "admin";
  userName: string;
  currentSkillId?: string;
  sessionMemory: Record<string, any>;
  retrievedKnowledge?: string[];
  activeWorkflow?: string;
}

export interface AISession {
  sessionId: string;
  userId: string;
  history: ChatTurn[];
  context: AIOSContext;
  lastActive: Date;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: "SOP" | "Policy" | "Manual" | "Docx" | "Pdf";
  content: string;
  category: string;
}
