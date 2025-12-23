"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { SUGGESTED_MODELS } from "@/lib/hooks/useSettings";

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelect({ value, onChange }: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter models based on input
  const filteredModels = SUGGESTED_MODELS.filter((model) =>
    model.toLowerCase().includes(inputValue.toLowerCase())
  );

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

  const handleSelect = (model: string) => {
    onChange(model);
    setInputValue(model);
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
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
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

      {isOpen && filteredModels.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 shadow-lg max-h-60 overflow-y-auto">
          {filteredModels.map((model) => {
            const isFree = model.includes(":free");
            const isSelected = model === value;

            return (
              <button
                key={model}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(model);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-700 transition-colors",
                  isSelected && "bg-zinc-700"
                )}
              >
                <span className="truncate text-zinc-100">{model}</span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {isFree && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-green-500/10 text-green-500 rounded">
                      <Sparkles className="h-3 w-3" />
                      Free
                    </span>
                  )}
                  {isSelected && <Check className="h-4 w-4 text-blue-500" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
