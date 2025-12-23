"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "./EmptyState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Message } from "@/lib/db";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  isConfigured: boolean;
  onOpenSettings: () => void;
  error?: Error | null;
}

export function MessageList({
  messages,
  isStreaming,
  isConfigured,
  onOpenSettings,
  error,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const isEmpty = messages.length === 0 && !error;

  if (!isConfigured || isEmpty) {
    return (
      <EmptyState isConfigured={isConfigured} onOpenSettings={onOpenSettings} />
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-4 pb-2">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, index) => {
            // Check if this is the last message and we're streaming
            const isStreamingMessage = isStreaming && index === messages.length - 1 && msg.role === "assistant";

            return (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                parts={msg.parts}
                isStreaming={isStreamingMessage}
              />
            );
          })}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
