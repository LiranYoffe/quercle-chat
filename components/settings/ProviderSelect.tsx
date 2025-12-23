"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Loader2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchProviders, type Provider } from "@/lib/openrouter/fetchProviders";

interface ProviderSelectProps {
  value: string;
  onChange: (value: string) => void;
  model: string;
  apiKey?: string;
}

export function ProviderSelect({ value, onChange, model, apiKey }: ProviderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch providers when model changes
  useEffect(() => {
    if (!model) {
      setProviders([]);
      return;
    }

    const fetchProvidersData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const providersData = await fetchProviders(model, apiKey);
        console.log("[PROVIDER SELECT] Fetched", providersData.length, "providers for model:", model);
        console.log("[PROVIDER SELECT] Current provider:", value);
        setProviders(providersData);

        // Auto-select first tool-supporting provider if current isn't valid
        if (providersData.length > 0) {
          const currentValid = providersData.some((p) => p.id === value);
          console.log("[PROVIDER SELECT] Is current provider valid?", currentValid);

          if (!currentValid) {
            const toolProvider = providersData.find((p) => p.supportsTools);
            const newProvider = toolProvider?.id || providersData[0].id;
            console.log("[PROVIDER SELECT] Auto-selecting provider:", newProvider);
            onChange(newProvider);
          }
        } else {
          // No providers available - use Auto mode (empty string)
          console.log("[PROVIDER SELECT] No providers available, setting to Auto mode");
          onChange("");
        }
      } catch (err) {
        console.error("Failed to fetch providers:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch providers");
        setProviders([]); // Clear providers on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchProvidersData();
  }, [model, apiKey]); // Don't include value/onChange to avoid loops

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

  const handleSelect = (providerId: string) => {
    onChange(providerId);
    setIsOpen(false);
  };

  const selectedProvider = providers.find((p) => p.id === value);
  const displayName = selectedProvider?.name || value || "Auto (OpenRouter)";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md",
          "bg-zinc-800 border border-zinc-700 text-white",
          "hover:bg-zinc-700 transition-colors cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : selectedProvider?.supportsTools ? (
            <Wrench className="h-4 w-4 text-green-500" />
          ) : null}
          <span>{isLoading ? "Loading providers..." : displayName}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {error && (
        <p className="text-xs text-amber-500 mt-1">{error}</p>
      )}

      {isOpen && !isLoading && providers.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 shadow-lg max-h-60 overflow-y-auto">
          {/* Auto option */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect("");
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-700 transition-colors cursor-pointer",
              value === "" && "bg-zinc-700"
            )}
          >
            <div className="flex flex-col items-start">
              <span className="text-zinc-100">Auto (OpenRouter)</span>
              <span className="text-xs text-zinc-500">
                Let OpenRouter choose the best provider
              </span>
            </div>
            {value === "" && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
          </button>

          {providers.map((provider) => {
            const isSelected = provider.id === value;

            return (
              <button
                key={provider.id || "auto"}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(provider.id);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-700 transition-colors cursor-pointer",
                  isSelected && "bg-zinc-700"
                )}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-100">{provider.name}</span>
                    {provider.supportsTools && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-green-500/10 text-green-500 rounded">
                        <Wrench className="h-3 w-3" />
                        Tools
                      </span>
                    )}
                  </div>
                  {provider.contextLength && (
                    <span className="text-xs text-zinc-500">
                      {Math.round(provider.contextLength / 1000)}k context
                    </span>
                  )}
                </div>
                {isSelected && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
