import Dexie, { type EntityTable } from "dexie";
import type { MessagePart } from "@/lib/types/message-parts";

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  createdAt: Date;
}

// Legacy types for backward compatibility (if needed)
export interface ToolCallInfo {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: "pending" | "complete" | "error";
}

const db = new Dexie("quercle-chat") as Dexie & {
  conversations: EntityTable<Conversation, "id">;
  messages: EntityTable<Message, "id">;
};

// Version 1: Original schema
db.version(1).stores({
  conversations: "id, updatedAt",
  messages: "id, conversationId, createdAt",
});

// Version 2: Migrate to message parts structure
db.version(2)
  .stores({
    conversations: "id, updatedAt",
    messages: "id, conversationId, createdAt",
  })
  .upgrade((tx) => {
    // Migrate existing messages to new parts structure
    return tx
      .table("messages")
      .toCollection()
      .modify((message: any) => {
        // If message already has parts, skip
        if (message.parts) return;

        const parts: MessagePart[] = [];

        // Convert content to text part
        if (message.content) {
          parts.push({
            type: "text",
            text: message.content,
          });
        }

        // Convert toolCalls to tool parts
        if (message.toolCalls && Array.isArray(message.toolCalls)) {
          for (const toolCall of message.toolCalls) {
            const toolType =
              toolCall.name === "quercleSearch"
                ? ("tool-quercleSearch" as const)
                : ("tool-quercleFetch" as const);

            parts.push({
              type: toolType,
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              state: toolCall.status === "complete" ? "output-available" : "output-error",
              input: toolCall.input,
              output: toolCall.output,
              errorText: toolCall.status === "error" ? toolCall.output : undefined,
            });
          }
        }

        // Replace old properties with new structure
        message.parts = parts;
        delete message.content;
        delete message.toolCalls;
      });
  });

export { db };
