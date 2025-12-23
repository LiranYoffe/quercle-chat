"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApiKeyInput } from "./ApiKeyInput";
import { ModelSelect } from "./ModelSelect";
import { ProviderSelect } from "./ProviderSelect";

interface Settings {
  openRouterApiKey: string;
  quercleApiKey: string;
  model: string;
  provider: string;
}

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSave: (settings: Partial<Settings>) => void;
}

export function SettingsSheet({
  open,
  onOpenChange,
  settings,
  onSave,
}: SettingsSheetProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local state when sheet opens
  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);

  // Log provider changes for debugging
  useEffect(() => {
    console.log("[SETTINGS] Current settings:", {
      model: localSettings.model,
      provider: localSettings.provider,
    });
  }, [localSettings.model, localSettings.provider]);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-zinc-900 border-zinc-800">
        <SheetHeader>
          <SheetTitle className="text-white">Settings</SheetTitle>
          <SheetDescription className="text-zinc-400">
            Configure your API keys and model preferences.
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4 bg-zinc-800" />

        <div className="flex-1 space-y-6 overflow-y-auto">
          <ApiKeyInput
            label="OpenRouter API Key"
            value={localSettings.openRouterApiKey}
            onChange={(v) =>
              setLocalSettings((s) => ({ ...s, openRouterApiKey: v }))
            }
            placeholder="sk-or-..."
            helpText="Get your key at"
            helpLink="https://openrouter.ai/keys"
            helpLinkText="openrouter.ai"
          />

          <ApiKeyInput
            label="Quercle API Key"
            value={localSettings.quercleApiKey}
            onChange={(v) =>
              setLocalSettings((s) => ({ ...s, quercleApiKey: v }))
            }
            placeholder="qk_..."
            helpText="Get your key at"
            helpLink="https://quercle.dev"
            helpLinkText="quercle.dev"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Model</label>
            <ModelSelect
              value={localSettings.model}
              onChange={(m) => setLocalSettings((s) => ({ ...s, model: m }))}
              apiKey={localSettings.openRouterApiKey}
            />
            <p className="text-xs text-zinc-500">
              Select a suggested model or enter any OpenRouter model ID.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Provider</label>
            <ProviderSelect
              value={localSettings.provider}
              onChange={(p) => setLocalSettings((s) => ({ ...s, provider: p }))}
              model={localSettings.model}
              apiKey={localSettings.openRouterApiKey}
            />
            <p className="text-xs text-zinc-500">
              Choose which backend provider to use. Green wrench = supports Quercle tools.
            </p>
          </div>
        </div>

        <Separator className="my-4 bg-zinc-800" />

        <SheetFooter className="flex-row gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-zinc-700 text-zinc-100 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
