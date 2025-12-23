"use client";

import { useState, useEffect, useCallback } from "react";

interface Settings {
  openRouterApiKey: string;
  quercleApiKey: string;
  model: string;
  provider: string; // Optional provider preference (e.g., "deepinfra", "together")
}

const STORAGE_KEY = "quercle-chat-settings";
const DEFAULT_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free"; // Free model with tool support

const defaultSettings: Settings = {
  openRouterApiKey: "",
  quercleApiKey: "",
  model: DEFAULT_MODEL,
  provider: "", // Auto-select (will be set when providers load)
};

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettingsState({ ...defaultSettings, ...parsed });
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  const setSettings = useCallback((updates: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const isConfigured =
    settings.openRouterApiKey.length > 0 && settings.quercleApiKey.length > 0;

  return {
    settings,
    setSettings,
    isConfigured,
    isLoaded,
  };
}

// Suggested models for OpenRouter
export const SUGGESTED_MODELS = [
  // Paid models with reliable tool support
  "meta-llama/llama-3.1-8b-instruct",
  "meta-llama/llama-3.1-70b-instruct",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-chat",
  "google/gemini-2.0-flash-001",
  "anthropic/claude-sonnet-4",
  // Free models (no tool support)
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen3-4b:free",
  "google/gemini-2.0-flash-exp:free",
];

