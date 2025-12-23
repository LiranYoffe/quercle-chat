"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLoopAgent, stepCountIs } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createQuercleTools } from "@quercle/ai-sdk";
import type { UIMessage, MessagePart } from "@/lib/types/message-parts";
import { nanoid } from "nanoid";

export interface UseStreamingAgentChatOptions {
  conversationId: string | null;
  openRouterApiKey: string;
  quercleApiKey: string;
  model: string;
  provider?: string;
  onMessageSaved?: (message: UIMessage) => Promise<void>;
}

export function useStreamingAgentChat(options: UseStreamingAgentChatOptions) {
  const {
    openRouterApiKey,
    quercleApiKey,
    model,
    provider,
    onMessageSaved,
  } = options;

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track current assistant message being built
  const currentAssistantMessageRef = useRef<UIMessage | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      console.log("[STREAMING] sendMessage called");

      if (!openRouterApiKey || !quercleApiKey) {
        setError(new Error("API keys not configured"));
        return;
      }

      setError(null);
      setIsStreaming(true);

      // Helper to update assistant message in state
      const updateAssistantMessage = (parts: any[]) => {
        if (currentAssistantMessageRef.current) {
          currentAssistantMessageRef.current.parts = parts;
          setMessages(prev =>
            prev.map(m => m.id === currentAssistantMessageRef.current?.id
              ? { ...currentAssistantMessageRef.current! }
              : m
            )
          );
        }
      };

      try {
        // Add user message
        const userMessage: UIMessage = {
          id: nanoid(),
          role: "user",
          parts: [{ type: "text", text }],
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        if (onMessageSaved) {
          await onMessageSaved(userMessage);
        }

        // Initialize assistant message
        const assistantMessage: UIMessage = {
          id: nanoid(),
          role: "assistant",
          parts: [],
          createdAt: new Date(),
        };
        currentAssistantMessageRef.current = assistantMessage;
        setMessages((prev) => [...prev, assistantMessage]);

        // Create tools
        const { quercleSearch, quercleFetch } = createQuercleTools({
          apiKey: quercleApiKey,
        });

        // Create provider
        const openrouterProvider = createOpenRouter({
          apiKey: openRouterApiKey,
        });

        // Build full conversation messages including current user message
        const allMessages = [
          ...messages.map(m => ({
            role: m.role,
            content: m.parts
              .filter(p => p.type === 'text')
              .map((p: any) => p.text)
              .join('\n'),
          })),
          { role: 'user' as const, content: text },
        ];

        console.log("[AGENT] Creating ToolLoopAgent and streaming...");

        // Build model config with optional provider
        const modelConfig: any = {};
        if (provider && provider.trim().length > 0) {
          modelConfig.providerOptions = {
            order: [provider],
            allow_fallbacks: true,
          };
          console.log("[AGENT] Using provider:", provider);
        } else {
          console.log("[AGENT] No provider specified, using default");
        }

        // Generate current date string
        const currentDate = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Create ToolLoopAgent
        const agent = new ToolLoopAgent({
          model: openrouterProvider(model, modelConfig),
          tools: {
            search: quercleSearch,
            fetch: quercleFetch,
          } as any, // Type assertion to avoid TS inference depth issues
          stopWhen: stepCountIs(10), // Allow up to 10 tool execution rounds (works best with GPT-4, Claude, Gemini)
          instructions: `You are Quercle chat agent. Today's date is ${currentDate}.`,
        });

        // Stream response (use messages only, not prompt)
        console.log("[AGENT] Calling agent.stream with", allMessages.length, "messages");
        const stream = await agent.stream({
          messages: allMessages,
        });

        console.log("[AGENT] Stream created, starting to process fullStream...");

        // Track current text
        let currentText = '';
        let chunkCount = 0;

        // Process full stream to get ALL events (text, tool-call, tool-result, reasoning, etc.)
        for await (const chunk of stream.fullStream) {
          chunkCount++;
          console.log("[AGENT] Received chunk #" + chunkCount + ", type:", chunk.type);

          const currentParts: MessagePart[] = [...(currentAssistantMessageRef.current?.parts || [])];

          if (chunk.type === 'text-delta') {
            const deltaText = (chunk as any).text;
            if (deltaText) {
              currentText += deltaText;

              // Update text part
              const textPartIndex = currentParts.findIndex((p: any) => p.type === 'text');
              if (textPartIndex >= 0) {
                currentParts[textPartIndex] = { type: 'text', text: currentText };
              } else {
                currentParts.push({ type: 'text', text: currentText });
              }

              updateAssistantMessage(currentParts);
            }
          }
          else if (chunk.type === 'reasoning-start') {
            // Create a new reasoning part
            console.log("[AGENT] Reasoning started");
            currentParts.push({ type: 'reasoning', text: '' });
            updateAssistantMessage(currentParts);
          }
          else if (chunk.type === 'reasoning-delta') {
            const deltaReasoning = (chunk as any).text;
            if (deltaReasoning) {
              // Find the LAST reasoning part and update it
              const lastReasoningIndex = currentParts.map((p: any) => p.type).lastIndexOf('reasoning');
              if (lastReasoningIndex >= 0) {
                const currentReasoningText = (currentParts[lastReasoningIndex] as any).text || '';
                currentParts[lastReasoningIndex] = {
                  type: 'reasoning',
                  text: currentReasoningText + deltaReasoning
                };
                updateAssistantMessage(currentParts);
              }
            }
          }
          else if (chunk.type === 'tool-call') {
            const toolCallId = (chunk as any).toolCallId;
            const toolName = (chunk as any).toolName as "search" | "fetch";
            const toolType = toolName === "search"
              ? ("tool-search" as const)
              : ("tool-fetch" as const);
            const input = (chunk as any).input; // AI SDK v6 uses 'input' not 'args'

            console.log("[AGENT] Tool call:", toolName, "ID:", toolCallId, "Input:", input);

            currentParts.push({
              type: toolType,
              toolCallId: toolCallId,
              toolName: toolName,
              state: 'input-available',
              input: input || {},
            });

            console.log("[AGENT] Parts array after push (count=" + currentParts.length + "):",
              currentParts.map((p: any) => p.type === 'text' || p.type === 'reasoning' ? p.type : `${p.type}[${p.toolCallId?.slice(-4)}]`).join(', '));

            updateAssistantMessage(currentParts);
          }
          else if (chunk.type === 'tool-result') {
            const toolCallId = (chunk as any).toolCallId;
            const output = (chunk as any).output; // AI SDK v6 uses 'output' not 'result'

            console.log("[AGENT] Tool result for:", toolCallId, "Output length:", typeof output === 'string' ? output.length : 'N/A');

            const toolPart = currentParts.find(
              (p: any) => p.type.startsWith('tool-') && p.toolCallId === toolCallId
            );

            if (toolPart) {
              if (output !== undefined && output !== null) {
                const hasError = typeof output === 'object' && output.error !== undefined;
                (toolPart as any).state = hasError ? 'output-error' : 'output-available';
                (toolPart as any).output = hasError
                  ? undefined
                  : (typeof output === 'string' ? output : JSON.stringify(output));
                (toolPart as any).errorText = hasError
                  ? (typeof output.error === 'string' ? output.error : JSON.stringify(output.error))
                  : undefined;
              } else {
                (toolPart as any).state = 'output-available';
                (toolPart as any).output = '';
              }

              updateAssistantMessage([...currentParts]);
            }
          }
        }

        console.log("[AGENT] Full stream complete after", chunkCount, "chunks. Total text length:", currentText.length);

        // Final cleanup and save
        if (currentAssistantMessageRef.current) {
          let finalParts = currentAssistantMessageRef.current.parts.filter((p: any) => {
            if (p.type === 'text') {
              return p.text && p.text.trim().length > 0;
            }
            return true;
          });

          currentAssistantMessageRef.current.parts = finalParts;

          console.log("[AGENT] Final parts:", finalParts.map((p: any) => p.type));

          setMessages(prev =>
            prev.map(m => m.id === currentAssistantMessageRef.current?.id
              ? { ...currentAssistantMessageRef.current! }
              : m
            )
          );

          if (onMessageSaved) {
            await onMessageSaved(currentAssistantMessageRef.current);
          }
        }

      } catch (err) {
        console.error("[AGENT] Error:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsStreaming(false);
        currentAssistantMessageRef.current = null;
      }
    },
    [messages, openRouterApiKey, quercleApiKey, model, provider, onMessageSaved]
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    setMessages,
  };
}
