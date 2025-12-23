"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/lib/db";

interface ChatAreaProps {
  messages: Message[];
  onSend: (message: string) => void;
  isLoading: boolean;
  isConfigured: boolean;
  onOpenSettings: () => void;
  error?: Error | null;
}

export function ChatArea({
  messages,
  onSend,
  isLoading,
  isConfigured,
  onOpenSettings,
  error,
}: ChatAreaProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MessageList
        messages={messages}
        isStreaming={isLoading}
        isConfigured={isConfigured}
        onOpenSettings={onOpenSettings}
        error={error}
      />
      <ChatInput
        onSend={onSend}
        disabled={isLoading || !isConfigured}
        placeholder={
          !isConfigured
            ? "Configure API keys to start chatting..."
            : isLoading
              ? "Thinking..."
              : "Message Quercle..."
        }
      />
    </div>
  );
}
