"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarFooterProps {
  onOpenSettings: () => void;
}

export function SidebarFooter({ onOpenSettings }: SidebarFooterProps) {
  return (
    <div className="p-3 border-t border-zinc-800">
      <Button
        onClick={onOpenSettings}
        variant="ghost"
        className="w-full justify-start gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>
    </div>
  );
}
