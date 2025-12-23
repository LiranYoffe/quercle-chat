"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  isConfigured: boolean;
  onOpenSettings: () => void;
}

export function EmptyState({ isConfigured, onOpenSettings }: EmptyStateProps) {
  if (!isConfigured) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-medium text-white mb-3">
            Welcome to Quercle Chat
          </h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Configure your API keys to get started.
          </p>
          <Button
            onClick={onOpenSettings}
            size="lg"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Configure API Keys
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-medium text-zinc-300">
        Ready when you are.
      </h2>
    </div>
  );
}
