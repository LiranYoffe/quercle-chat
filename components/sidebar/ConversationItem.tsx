"use client";

import { useState } from "react";
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/db";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);

  const handleRename = () => {
    if (editValue.trim() && editValue !== conversation.title) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Delete this conversation?")) {
      onDelete();
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
        isActive
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
      )}
      onClick={onClick}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />

      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") {
              setEditValue(conversation.title);
              setIsEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-zinc-600 outline-none text-sm text-white"
          autoFocus
        />
      ) : (
        <span className="flex-1 truncate text-sm" title={conversation.title}>
          {conversation.title}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-700",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-zinc-800 border-zinc-700">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-zinc-100 focus:bg-zinc-700 focus:text-white cursor-pointer"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="text-red-400 focus:bg-zinc-700 focus:text-red-400 cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
