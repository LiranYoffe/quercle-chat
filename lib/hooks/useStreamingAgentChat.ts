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

        // Build model config with optional provider routing
        // OpenRouter expects provider routing under "provider" key, not "providerOptions"
        const modelConfig: any = {};
        if (provider && provider.trim().length > 0) {
          // Provider ID might be "DeepInfra:bf16" - extract just the provider name for order
          // The order array expects just provider names like "DeepInfra"
          const providerName = provider.split(":")[0];
          modelConfig.provider = {
            order: [providerName],
            allow_fallbacks: false, // Don't fall back to other providers
          };
          console.log("[AGENT] Using provider:", providerName, "(from", provider, ")");
        } else {
          console.log("[AGENT] No provider specified, using default (Auto)");
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
        const eventTypeCounts: Record<string, number> = {};

        // Process full stream to get ALL events (text, tool-call, tool-result, reasoning, etc.)
        for await (const chunk of stream.fullStream) {
          chunkCount++;
          const chunkType = chunk.type;
          eventTypeCounts[chunkType] = (eventTypeCounts[chunkType] || 0) + 1;

          // Log ALL events to find what happens during tool errors
          if (chunkType !== 'text-delta') {
            console.log("[AGENT] Event #" + chunkCount + ":", chunkType, JSON.stringify(chunk).slice(0, 500));
          }

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
          else if (chunk.type === 'error') {
            // Handle error events - this could be API errors or tool execution errors
            const errorObj = (chunk as any).error;
            let errorMessage = 'An error occurred';
            let providerName = '';

            // Extract error message from various possible structures
            if (errorObj) {
              if (errorObj.message) {
                errorMessage = errorObj.message;
              }
              // Try to get more details from responseBody if available
              if (errorObj.responseBody) {
                try {
                  const body = typeof errorObj.responseBody === 'string'
                    ? JSON.parse(errorObj.responseBody)
                    : errorObj.responseBody;

                  // Get provider name from metadata
                  if (body?.error?.metadata?.provider_name) {
                    providerName = body.error.metadata.provider_name;
                  }

                  // Try to get detailed error from metadata.raw (OpenRouter format)
                  if (body?.error?.metadata?.raw) {
                    try {
                      const rawError = JSON.parse(body.error.metadata.raw);
                      if (rawError?.detail) {
                        errorMessage = rawError.detail;
                      } else if (rawError?.message) {
                        errorMessage = rawError.message;
                      } else if (rawError?.error) {
                        errorMessage = typeof rawError.error === 'string' ? rawError.error : JSON.stringify(rawError.error);
                      }
                    } catch {
                      // If raw isn't JSON, use it directly
                      errorMessage = body.error.metadata.raw;
                    }
                  } else if (body?.error?.message) {
                    errorMessage = body.error.message;
                  } else if (body?.message) {
                    errorMessage = body.message;
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            } else if ((chunk as any).message) {
              errorMessage = (chunk as any).message;
            }

            // Include provider name in error message if available
            const fullErrorMessage = providerName
              ? `${providerName}: ${errorMessage}`
              : errorMessage;

            console.log("[AGENT] Error event received:", fullErrorMessage);
            console.log("[AGENT] Full error:", JSON.stringify(errorObj));

            // Check if there are any pending tools to mark as failed
            const pendingTools = currentParts.filter(
              (p: any) =>
                (p.type === "tool-search" || p.type === "tool-fetch") &&
                (p.state === "input-streaming" || p.state === "input-available")
            );

            if (pendingTools.length > 0) {
              // Mark pending tools as failed
              currentParts.forEach((p: any) => {
                if (
                  (p.type === "tool-search" || p.type === "tool-fetch") &&
                  (p.state === "input-streaming" || p.state === "input-available")
                ) {
                  p.state = "output-error";
                  p.errorText = fullErrorMessage;
                }
              });
              updateAssistantMessage([...currentParts]);
            } else {
              // No pending tools - this is an API error before any tools were called
              // Show the error as a text message so the user knows what happened
              const errorText = `⚠️ ${fullErrorMessage}`;
              const existingTextIndex = currentParts.findIndex((p: any) => p.type === 'text');
              if (existingTextIndex >= 0) {
                const existingText = (currentParts[existingTextIndex] as any).text || '';
                currentParts[existingTextIndex] = {
                  type: 'text',
                  text: existingText + (existingText ? '\n\n' : '') + errorText
                };
              } else {
                currentParts.push({ type: 'text', text: errorText });
              }
              updateAssistantMessage([...currentParts]);
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
            const isError = (chunk as any).isError; // AI SDK error flag
            const result = (chunk as any).result; // Some versions use 'result'

            const actualOutput = output ?? result;

            console.log("[AGENT] Tool result for:", toolCallId);
            console.log("[AGENT] - isError:", isError);
            console.log("[AGENT] - output type:", typeof actualOutput);
            console.log("[AGENT] - output value:", actualOutput);
            console.log("[AGENT] - full chunk:", JSON.stringify(chunk));

            const toolPart = currentParts.find(
              (p: any) => p.type.startsWith('tool-') && p.toolCallId === toolCallId
            );

            if (toolPart) {
              // Check for error in multiple ways:
              // 1. isError flag from AI SDK
              // 2. output.error property
              // 3. output is an Error object
              // 4. output string contains error indicators
              const outputStr = typeof actualOutput === 'string' ? actualOutput : JSON.stringify(actualOutput || '');
              const hasErrorInString = outputStr.toLowerCase().includes('error') &&
                (outputStr.includes('400') || outputStr.includes('401') || outputStr.includes('403') ||
                 outputStr.includes('404') || outputStr.includes('500') || outputStr.includes('failed'));

              const hasError =
                isError === true ||
                (typeof actualOutput === 'object' && actualOutput !== null && actualOutput.error !== undefined) ||
                actualOutput instanceof Error ||
                hasErrorInString;

              console.log("[AGENT] - hasError:", hasError, "hasErrorInString:", hasErrorInString);

              if (hasError) {
                (toolPart as any).state = 'output-error';
                (toolPart as any).output = undefined;
                (toolPart as any).errorText =
                  actualOutput instanceof Error
                    ? actualOutput.message
                    : typeof actualOutput === 'object' && actualOutput?.error
                      ? (typeof actualOutput.error === 'string' ? actualOutput.error : JSON.stringify(actualOutput.error))
                      : typeof actualOutput === 'string'
                        ? actualOutput
                        : 'Tool execution failed';
              } else if (actualOutput !== undefined && actualOutput !== null) {
                (toolPart as any).state = 'output-available';
                (toolPart as any).output = typeof actualOutput === 'string' ? actualOutput : JSON.stringify(actualOutput);
              } else {
                (toolPart as any).state = 'output-available';
                (toolPart as any).output = '';
              }

              updateAssistantMessage([...currentParts]);
            } else {
              console.log("[AGENT] - WARNING: Could not find tool part for toolCallId:", toolCallId);
              console.log("[AGENT] - Available tool parts:", currentParts.filter((p: any) => p.type.startsWith('tool-')).map((p: any) => p.toolCallId));
            }
          }
          else if (chunk.type === 'tool-error') {
            // THIS IS THE KEY EVENT - tool execution failed!
            const toolErrorChunk = chunk as any;
            const toolCallId = toolErrorChunk.toolCallId;
            const errorMessage = toolErrorChunk.error?.message || toolErrorChunk.message || 'Tool execution failed';

            console.log("[AGENT] TOOL-ERROR event received!");
            console.log("[AGENT] - toolCallId:", toolCallId);
            console.log("[AGENT] - error:", errorMessage);
            console.log("[AGENT] - full chunk:", JSON.stringify(chunk));

            // Find the matching tool part and mark it as failed
            const toolPart = currentParts.find(
              (p: any) => p.type.startsWith('tool-') && p.toolCallId === toolCallId
            );

            if (toolPart) {
              console.log("[AGENT] Found tool part, marking as error");
              (toolPart as any).state = 'output-error';
              (toolPart as any).errorText = errorMessage;
              updateAssistantMessage([...currentParts]);
            } else {
              // If no specific toolCallId, mark ALL pending tools as failed
              console.log("[AGENT] No matching tool part, marking all pending tools as error");
              let hasUpdated = false;
              currentParts.forEach((p: any) => {
                if (
                  (p.type === "tool-search" || p.type === "tool-fetch") &&
                  (p.state === "input-streaming" || p.state === "input-available")
                ) {
                  p.state = "output-error";
                  p.errorText = errorMessage;
                  hasUpdated = true;
                }
              });
              if (hasUpdated) {
                updateAssistantMessage([...currentParts]);
              }
            }
          }
          else if (chunk.type === 'finish-step') {
            // Check if step finished with no output (provider returned nothing)
            const finishChunk = chunk as any;
            const finishReason = finishChunk.finishReason;
            const outputTokens = finishChunk.usage?.outputTokens ?? 0;

            console.log("[AGENT] Step finished:", finishReason, "outputTokens:", outputTokens);

            // If step finished with "other" or "error" reason and no output, show error
            if ((finishReason === 'other' || finishReason === 'error') && outputTokens === 0) {
              // Check if we have any content yet
              const hasContent = currentParts.some((p: any) =>
                (p.type === 'text' && p.text?.trim()) ||
                p.type === 'tool-search' ||
                p.type === 'tool-fetch'
              );

              if (!hasContent) {
                // No content received - show error to user
                const providerName = finishChunk.providerMetadata?.openrouter?.provider || 'Provider';
                const errorText = `⚠️ ${providerName} returned no response. This model/provider combination may not support tool calling. Try selecting a different provider or model.`;
                currentParts.push({ type: 'text', text: errorText });
                updateAssistantMessage([...currentParts]);
              }
            }
          }
        }

        // Log event type summary
        console.log("[AGENT] Stream complete. Event type counts:", eventTypeCounts);

        console.log("[AGENT] Full stream complete after", chunkCount, "chunks. Total text length:", currentText.length);

        // Final cleanup and save
        if (currentAssistantMessageRef.current) {
          let finalParts = currentAssistantMessageRef.current.parts.map((p: any) => {
            // Mark any still-pending tool parts as failed (no result received)
            if (
              (p.type === "tool-search" || p.type === "tool-fetch") &&
              (p.state === "input-streaming" || p.state === "input-available")
            ) {
              console.log("[AGENT] Marking pending tool as failed:", p.toolCallId);
              return {
                ...p,
                state: "output-error",
                errorText: "Tool execution failed - no response received",
              };
            }
            return p;
          }).filter((p: any) => {
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
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(err instanceof Error ? err : new Error(errorMessage));

        // Mark any pending tool parts as failed
        if (currentAssistantMessageRef.current) {
          const updatedParts = currentAssistantMessageRef.current.parts.map((p: any) => {
            if (
              (p.type === "tool-search" || p.type === "tool-fetch") &&
              (p.state === "input-streaming" || p.state === "input-available")
            ) {
              return {
                ...p,
                state: "output-error",
                errorText: errorMessage,
              };
            }
            return p;
          });
          currentAssistantMessageRef.current.parts = updatedParts;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === currentAssistantMessageRef.current?.id
                ? { ...currentAssistantMessageRef.current! }
                : m
            )
          );
        }
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
