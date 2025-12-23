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

  // Track which model the current providers are for
  const [providersForModel, setProvidersForModel] = useState<string>("");
  const previousModelRef = useRef<string>("");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange; // Keep ref updated

  // Fetch providers when model changes
  useEffect(() => {
    const previousModel = previousModelRef.current;
    const modelChanged = previousModel !== "" && previousModel !== model;
    previousModelRef.current = model;

    // Clear providers and reset to Auto when model changes
    if (modelChanged) {
      console.log("[PROVIDER SELECT] Model changed from", previousModel, "to", model);
      setProviders([]);
      setProvidersForModel("");
      onChangeRef.current(""); // Reset to Auto
    }

    if (!model) {
      setProviders([]);
      return;
    }

    let cancelled = false;
    const currentModel = model;

    const fetchProvidersData = async () => {
      setIsLoading(true);
      setError(null);

      console.log("[PROVIDER SELECT] Fetching providers for model:", currentModel);

      try {
        const providersData = await fetchProviders(currentModel, apiKey);

        if (cancelled) {
          console.log("[PROVIDER SELECT] Fetch cancelled - model changed during fetch");
          return;
        }

        console.log("[PROVIDER SELECT] Got", providersData.length, "providers for:", currentModel);
        console.log("[PROVIDER SELECT] Providers:", providersData.map(p => p.id));

        setProviders(providersData);
        setProvidersForModel(currentModel);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch providers:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch providers");
        setProviders([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProvidersData();

    return () => {
      cancelled = true;
    };
  }, [model, apiKey]); // Don't include onChange to avoid loops

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
          ) : selectedProvider ? (
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

      {/* Debug: show which model providers are for */}
      {providersForModel && providersForModel !== model && (
        <p className="text-xs text-red-500 mt-1">
          ⚠️ Providers are for: {providersForModel} (not current model)
        </p>
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
                  <span className="text-zinc-100">{provider.name}</span>
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
