"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  onNewChat: () => void;
}

export function SidebarHeader({ onNewChat }: SidebarHeaderProps) {
  return (
    <div className="p-3 border-b border-zinc-800">
      <Button
        onClick={onNewChat}
        variant="outline"
        className="w-full justify-start gap-2 bg-transparent border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:text-white cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </Button>
    </div>
  );
}
