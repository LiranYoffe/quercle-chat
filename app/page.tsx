"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { useConversations } from "@/lib/hooks/useConversations";
import { useMessages } from "@/lib/hooks/useMessages";
import { useSettings } from "@/lib/hooks/useSettings";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { useStreamingAgentChat } from "@/lib/hooks/useStreamingAgentChat";
import type { UIMessage } from "@/lib/types/message-parts";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMobile = useIsMobile();

  const { settings, setSettings, isConfigured, isLoaded } = useSettings();
  const {
    conversations,
    createConversation,
    updateConversation,
    deleteConversation,
  } = useConversations();
  const { messages: dbMessages, addMessage } = useMessages(activeConversationId);

  // Restore last active conversation on mount
  useEffect(() => {
    const savedConversationId = localStorage.getItem("activeConversationId");
    if (savedConversationId) {
      setActiveConversationId(savedConversationId);
    } else if (conversations.length > 0) {
      // Auto-select most recent conversation if no saved ID
      const mostRecent = [...conversations].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      )[0];
      setActiveConversationId(mostRecent.id);
    }
  }, [conversations]);

  // Persist active conversation ID whenever it changes
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem("activeConversationId", activeConversationId);
    } else {
      localStorage.removeItem("activeConversationId");
    }
  }, [activeConversationId]);

  // Initialize Streaming Agent chat hook (CLIENT-SIDE!)
  const { messages, isStreaming, error, sendMessage: sendChatMessage, setMessages } = useStreamingAgentChat({
    conversationId: activeConversationId,
    openRouterApiKey: settings.openRouterApiKey || "",
    quercleApiKey: settings.quercleApiKey || "",
    model: settings.model,
    provider: settings.provider,
    onMessageSaved: async (message: UIMessage) => {
      // Save message to database
      if (activeConversationId) {
        await addMessage(message, activeConversationId);
      }
    },
  });

  const handleNewChat = useCallback(async () => {
    const id = await createConversation();
    setActiveConversationId(id);
    // Messages will be cleared by the useEffect when activeConversationId changes
    // Close sidebar on mobile after creating new chat
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [createConversation, isMobile]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      // Don't clear messages here - we'll load them after dbMessages updates
      // Close sidebar on mobile after selecting conversation
      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    [isMobile]
  );

  // Load database messages into hook's state when conversation changes
  // Don't reload during streaming to avoid overwriting streaming messages
  useEffect(() => {
    if (!isStreaming) {
      if (activeConversationId && dbMessages) {
        setMessages(dbMessages.map(m => ({
          id: m.id,
          role: m.role,
          parts: m.parts,
          createdAt: m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt),
        })));
      } else {
        setMessages([]);
      }
    }
  }, [activeConversationId, dbMessages, setMessages, isStreaming]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Create conversation if none exists
      let convId = activeConversationId;
      if (!convId) {
        convId = await createConversation(content.slice(0, 50));
        setActiveConversationId(convId);
      }

      // Generate title from first message
      if (dbMessages.length === 0) {
        await updateConversation(convId, {
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        });
      }

      // Send message through custom chat hook
      await sendChatMessage(content);
    },
    [
      activeConversationId,
      createConversation,
      dbMessages.length,
      updateConversation,
      sendChatMessage,
    ]
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
        // Messages will be cleared by the useEffect when activeConversationId changes to null
      }
    },
    [activeConversationId, deleteConversation]
  );

  // Helper to get timestamp from date
  const getTimestamp = (date: Date | string) =>
    date instanceof Date ? date.getTime() : new Date(date).getTime();

  // Combine DB messages with in-memory messages (for current conversation)
  // Sort by createdAt to ensure chronological order (oldest first)
  const displayMessages = (activeConversationId
    ? [
        ...dbMessages,
        ...messages
          .filter(m => !dbMessages.find(dbm => dbm.id === m.id))
          .map(m => ({ ...m, conversationId: activeConversationId }))
      ]
    : messages.map(m => ({ ...m, conversationId: activeConversationId || '' }))
  ).sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt));

  // Show loading while settings are being loaded
  if (!isLoaded) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sidebar = (
    <Sidebar
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
      onRenameConversation={(id, title) => updateConversation(id, { title })}
      onDeleteConversation={handleDeleteConversation}
      onOpenSettings={() => setSettingsOpen(true)}
    />
  );

  return (
    <AppShell
      sidebar={sidebar}
      isSidebarOpen={sidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
    >
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />
      <ChatArea
        messages={displayMessages}
        onSend={handleSendMessage}
        isLoading={isStreaming}
        isConfigured={isConfigured}
        onOpenSettings={() => setSettingsOpen(true)}
        error={error}
      />
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={setSettings}
      />
    </AppShell>
  );
}
