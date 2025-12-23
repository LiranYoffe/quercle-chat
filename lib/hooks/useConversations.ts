"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Conversation } from "../db";
import { v4 as uuid } from "uuid";

export function useConversations() {
  const conversations = useLiveQuery(
    () => db.conversations.orderBy("updatedAt").reverse().toArray(),
    []
  );

  const createConversation = async (title = "New Chat"): Promise<string> => {
    const id = uuid();
    const now = new Date();
    await db.conversations.add({
      id,
      title,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  };

  const updateConversation = async (
    id: string,
    updates: Partial<Pick<Conversation, "title">>
  ) => {
    await db.conversations.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  };

  const deleteConversation = async (id: string) => {
    await db.transaction("rw", [db.conversations, db.messages], async () => {
      await db.messages.where("conversationId").equals(id).delete();
      await db.conversations.delete(id);
    });
  };

  return {
    conversations: conversations ?? [],
    isLoading: conversations === undefined,
    createConversation,
    updateConversation,
    deleteConversation,
  };
}
