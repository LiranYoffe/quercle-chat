"use client";

import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "@/lib/db";

interface SidebarContentProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function SidebarContent({
  conversations,
  activeConversationId,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
}: SidebarContentProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm py-8">
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id)}
              onRename={(title) => onRenameConversation(conv.id, title)}
              onDelete={() => onDeleteConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
