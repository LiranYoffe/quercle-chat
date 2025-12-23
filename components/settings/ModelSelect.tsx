"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { SUGGESTED_MODELS } from "@/lib/hooks/useSettings";
import {
  fetchModels,
  type OpenRouterModel,
} from "@/lib/openrouter/fetchModels";

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  apiKey?: string;
}

const MAX_DISPLAYED_MODELS = 50;

export function ModelSelect({ value, onChange, apiKey }: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter models based on input
  const getFilteredModels = () => {
    const searchTerm = inputValue.toLowerCase();

    if (models.length > 0) {
      // Filter fetched models
      const filtered = models.filter(
        (model) =>
          model.id.toLowerCase().includes(searchTerm) ||
          model.name.toLowerCase().includes(searchTerm)
      );
      return filtered.slice(0, MAX_DISPLAYED_MODELS);
    }

    // Fall back to suggested models
    const filtered = SUGGESTED_MODELS.filter((model) =>
      model.toLowerCase().includes(searchTerm)
    ).map(
      (id): OpenRouterModel => ({
        id,
        name: id,
        isFree: id.includes(":free"),
        supportsTools: true,
      })
    );
    return filtered.slice(0, MAX_DISPLAYED_MODELS);
  };

  const filteredModels = getFilteredModels();

  // Fetch models when dropdown opens
  const handleOpen = async () => {
    setIsOpen(true);

    if (!hasFetched && models.length === 0) {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedModels = await fetchModels(apiKey);
        setModels(fetchedModels);
        setHasFetched(true);
      } catch (err) {
        console.error("Failed to fetch models:", err);
        setError("Failed to load models. Using suggested models.");
        // Keep using SUGGESTED_MODELS as fallback
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync input with value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setInputValue(modelId);
    setIsOpen(false);
  };

  const handleInputBlur = () => {
    if (inputValue.trim() && inputValue !== value) {
      onChange(inputValue.trim());
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) {
              handleOpen();
            }
          }}
          onFocus={handleOpen}
          onBlur={handleInputBlur}
          placeholder="Enter model ID..."
          className="pr-8 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              <span className="ml-2 text-sm text-zinc-400">
                Loading models...
              </span>
            </div>
          ) : (
            <>
              {error && (
                <div className="px-3 py-2 text-xs text-amber-500 border-b border-zinc-700">
                  {error}
                </div>
              )}
              {filteredModels.length === 0 ? (
                <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                  No models found
                </div>
              ) : (
                filteredModels.map((model) => {
                  const isFree = model.isFree;
                  const isSelected = model.id === value;

                  return (
                    <button
                      key={model.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(model.id);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-700 transition-colors",
                        isSelected && "bg-zinc-700"
                      )}
                    >
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="truncate text-zinc-100 w-full text-left">
                          {model.id}
                        </span>
                        {model.contextLength && (
                          <span className="text-xs text-zinc-500">
                            {Math.round(model.contextLength / 1000)}k context
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isFree && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-green-500/10 text-green-500 rounded">
                            <Sparkles className="h-3 w-3" />
                            Free
                          </span>
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
              {models.length > MAX_DISPLAYED_MODELS &&
                filteredModels.length === MAX_DISPLAYED_MODELS && (
                  <div className="px-3 py-2 text-xs text-zinc-500 border-t border-zinc-700 text-center">
                    Showing {MAX_DISPLAYED_MODELS} of {models.length} models.
                    Type to filter.
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
