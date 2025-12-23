"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Message } from "../db";
import type { UIMessage } from "@/lib/types/message-parts";

export function useMessages(conversationId: string | null) {
  const messages = useLiveQuery(
    () =>
      conversationId
        ? db.messages
            .where("conversationId")
            .equals(conversationId)
            .sortBy("createdAt")
        : [],
    [conversationId]
  );

  const addMessage = async (
    message: UIMessage,
    overrideConversationId?: string
  ): Promise<string> => {
    const targetConvId = overrideConversationId ?? conversationId;
    if (!targetConvId) throw new Error("No conversation selected");

    const messageToSave: Message = {
      ...message,
      conversationId: targetConvId,
    };

    await db.messages.add(messageToSave);

    // Update conversation's updatedAt
    await db.conversations.update(targetConvId, {
      updatedAt: new Date(),
    });

    return message.id;
  };

  const updateMessage = async (
    id: string,
    updates: Partial<Pick<Message, "parts">>
  ) => {
    await db.messages.update(id, updates);
  };

  const deleteMessage = async (id: string) => {
    await db.messages.delete(id);
  };

  return {
    messages: messages ?? [],
    isLoading: messages === undefined,
    addMessage,
    updateMessage,
    deleteMessage,
  };
}
