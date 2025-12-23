// Message parts structure matching AI SDK patterns for client-side implementation

export type MessagePart = TextPart | ToolPart | StepStartPart | ReasoningPart;

export interface TextPart {
  type: "text";
  text: string;
}

export interface ReasoningPart {
  type: "reasoning";
  text: string;
}

export interface ToolPart {
  type: "tool-quercleSearch" | "tool-quercleFetch";
  toolCallId: string;
  toolName: "quercleSearch" | "quercleFetch";
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: Record<string, unknown>;
  output?: string;
  errorText?: string;
}

export interface StepStartPart {
  type: "step-start";
  stepNumber: number;
}

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  createdAt: Date;
}

// Helper type guards
export function isTextPart(part: MessagePart): part is TextPart {
  return part.type === "text";
}

export function isToolPart(part: MessagePart): part is ToolPart {
  return part.type === "tool-quercleSearch" || part.type === "tool-quercleFetch";
}

export function isStepStartPart(part: MessagePart): part is StepStartPart {
  return part.type === "step-start";
}

export function isReasoningPart(part: MessagePart): part is ReasoningPart {
  return part.type === "reasoning";
}
