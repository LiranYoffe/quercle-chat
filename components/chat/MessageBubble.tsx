"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToolPartCard } from "./ToolPartCard";
import { Loader2, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessagePart } from "@/lib/types/message-parts";

interface MessageBubbleProps {
  role: "user" | "assistant";
  parts: MessagePart[];
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  parts,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = role === "user";

  // Check if we should show loading indicator (streaming with no parts yet)
  const showLoadingIndicator = isStreaming && parts.length === 0;

  // Check if message has visible content
  const hasVisibleContent = parts.some(
    (p) =>
      (p.type === "text" && p.text.trim().length > 0) ||
      (p.type === "reasoning" && p.text.trim().length > 0) ||
      p.type === "tool-search" ||
      p.type === "tool-fetch" ||
      p.type === "step-start"
  );

  // Don't render empty messages (unless streaming is in progress)
  if (!hasVisibleContent && !isStreaming) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {!isUser && (
          <AvatarImage src="/icon.png" alt="Quercle" />
        )}
        <AvatarFallback
          className={cn(
            "text-sm font-medium",
            isUser
              ? "bg-zinc-700 text-zinc-100"
              : "bg-blue-600 text-white"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : "Q"}
        </AvatarFallback>
      </Avatar>

      <div className={cn("max-w-[80%] space-y-2", isUser && "items-end")}>
        {/* Loading indicator when streaming starts */}
        {showLoadingIndicator && (
          <div className="rounded-2xl px-4 py-3 bg-zinc-800 border border-zinc-700">
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        {/* Render message parts */}
        {parts.map((part, index) => {
          switch (part.type) {
            case "text":
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-100"
                  )}
                >
                  <div className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                    {part.text || ''}
                  </div>
                  {isStreaming && index === parts.length - 1 && (
                    <span className="inline-block w-2 h-4 ml-1 bg-zinc-400 animate-pulse rounded-sm" />
                  )}
                </div>
              );

            case "reasoning":
              // Collapsible thinking/reasoning block (expanded by default)
              return (
                <details
                  key={index}
                  open
                  className="rounded-lg border border-purple-500/30 bg-purple-500/5 overflow-hidden w-full group"
                >
                  <summary className="px-3 py-2.5 cursor-pointer hover:bg-purple-500/10 transition-colors flex items-center justify-between select-none w-full list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-purple-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-purple-300">
                        Thinking process
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-purple-400 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-3 py-2.5 border-t border-purple-500/20 bg-zinc-900/50">
                    <div className="whitespace-pre-wrap text-xs text-zinc-400 leading-relaxed font-mono">
                      {part.text || ''}
                    </div>
                  </div>
                </details>
              );

            case "tool-search":
            case "tool-fetch":
              return <ToolPartCard key={index} part={part} />;

            case "step-start":
              // Render step divider for multi-step tool calling
              return index > 0 ? (
                <div key={index} className="flex items-center gap-2 py-1">
                  <hr className="flex-1 border-zinc-700" />
                  <span className="text-xs text-zinc-500">Step {part.stepNumber}</span>
                  <hr className="flex-1 border-zinc-700" />
                </div>
              ) : null;

            default:
              // Fallback for unknown part types
              return null;
          }
        })}
      </div>
    </div>
  );
}
