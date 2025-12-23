"use client";

import { Settings, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SidebarFooterProps {
  onOpenSettings: () => void;
}

export function SidebarFooter({ onOpenSettings }: SidebarFooterProps) {
  return (
    <div className="p-3 border-t border-zinc-800 space-y-2">
      <div className="flex items-center justify-center gap-4">
        <a
          href="https://github.com/LiranYoffe/quercle-chat"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
        <span className="text-zinc-600">•</span>
        <a
          href="https://quercle.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <Image src="/icon.png" alt="Quercle" width={16} height={16} />
          quercle.dev
        </a>
      </div>
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
