"use client";

import { Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

export function Header({ onMenuClick, onSettingsClick }: HeaderProps) {
  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900 shrink-0 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <h1 className="font-semibold text-white">Quercle Chat</h1>

      <Button
        variant="ghost"
        size="icon"
        onClick={onSettingsClick}
        className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        <Settings className="h-5 w-5" />
        <span className="sr-only">Settings</span>
      </Button>
    </header>
  );
}
