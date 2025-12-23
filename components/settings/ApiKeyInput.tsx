"use client";

import { useState } from "react";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  helpLink?: string;
  helpLinkText?: string;
}

export function ApiKeyInput({
  label,
  value,
  onChange,
  placeholder,
  helpText,
  helpLink,
  helpLinkText,
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">{label}</label>
      <div className="relative">
        <Input
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? (
            <EyeOff className="h-4 w-4 text-zinc-500" />
          ) : (
            <Eye className="h-4 w-4 text-zinc-500" />
          )}
          <span className="sr-only">{showKey ? "Hide" : "Show"} API key</span>
        </Button>
      </div>
      {(helpText || helpLink) && (
        <p className="text-xs text-zinc-500">
          {helpText}{" "}
          {helpLink && (
            <a
              href={helpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              {helpLinkText || helpLink}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </p>
      )}
    </div>
  );
}
