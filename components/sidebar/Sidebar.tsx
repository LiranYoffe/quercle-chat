"use client";

import { SidebarHeader } from "./SidebarHeader";
import { SidebarContent } from "./SidebarContent";
import { SidebarFooter } from "./SidebarFooter";
import type { Conversation } from "@/lib/db";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">
      <SidebarHeader onNewChat={onNewChat} />
      <SidebarContent
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onRenameConversation={onRenameConversation}
        onDeleteConversation={onDeleteConversation}
      />
      <SidebarFooter onOpenSettings={onOpenSettings} />
    </div>
  );
}
