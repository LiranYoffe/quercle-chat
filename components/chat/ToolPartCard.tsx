"use client";

import { useState } from "react";
import { Loader2, Check, X, Search, Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolPart } from "@/lib/types/message-parts";

interface ToolPartCardProps {
  part: ToolPart;
}

export function ToolPartCard({ part }: ToolPartCardProps) {
  const [isExpanded, setIsExpanded] = useState(part.state === "output-available");

  // Get appropriate icon and status based on state
  const getStatusIcon = () => {
    switch (part.state) {
      case "input-streaming":
      case "input-available":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "output-available":
        return <Check className="h-4 w-4 text-green-500" />;
      case "output-error":
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getToolIcon = () => {
    return part.toolName === "quercleSearch" ? (
      <Search className="h-4 w-4" />
    ) : (
      <Globe className="h-4 w-4" />
    );
  };

  const getToolLabel = () => {
    const toolName = part.toolName === "quercleSearch" ? "Search" : "Fetch";

    switch (part.state) {
      case "input-streaming":
        return `Preparing ${toolName}...`;
      case "input-available":
        if (part.toolName === "quercleSearch" && part.input?.query) {
          return `Searching: ${part.input.query}`;
        } else if (part.toolName === "quercleFetch" && part.input?.url) {
          try {
            const hostname = new URL(part.input.url as string).hostname;
            return `Fetching: ${hostname}`;
          } catch {
            return `Fetching URL...`;
          }
        }
        return `Calling ${toolName}...`;
      case "output-available":
        if (part.toolName === "quercleSearch" && part.input?.query) {
          return `Searched: ${part.input.query}`;
        } else if (part.toolName === "quercleFetch" && part.input?.url) {
          try {
            const hostname = new URL(part.input.url as string).hostname;
            return `Fetched: ${hostname}`;
          } catch {
            return `Fetched URL`;
          }
        }
        return `${toolName} completed`;
      case "output-error":
        return `${toolName} failed`;
    }
  };

  const getStateColor = () => {
    switch (part.state) {
      case "input-streaming":
      case "input-available":
        return "border-blue-500/30 bg-blue-500/5";
      case "output-available":
        return "border-green-500/30 bg-green-500/5";
      case "output-error":
        return "border-red-500/30 bg-red-500/5";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden transition-colors",
        getStateColor()
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-zinc-800/50 transition-colors text-left"
      >
        {getStatusIcon()}
        {getToolIcon()}
        <span className="flex-1 text-sm font-medium text-zinc-200">
          {getToolLabel()}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-500 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-3 py-2.5 border-t border-zinc-700 bg-zinc-900/50 space-y-3">
          {/* Input parameters */}
          {part.input && Object.keys(part.input).length > 0 && (
            <div>
              <div className="text-xs font-medium text-zinc-500 mb-1.5">
                Parameters:
              </div>
              <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output result */}
          {part.state === "output-available" && part.output && (
            <div>
              <div className="text-xs font-medium text-zinc-500 mb-1.5">
                Result:
              </div>
              <pre className="text-xs text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                {part.output}
              </pre>
            </div>
          )}

          {/* Error message */}
          {part.state === "output-error" && part.errorText && (
            <div>
              <div className="text-xs font-medium text-red-500 mb-1.5">Error:</div>
              <pre className="text-xs text-red-400 whitespace-pre-wrap font-mono">
                {part.errorText}
              </pre>
            </div>
          )}

          {/* Loading state message */}
          {(part.state === "input-streaming" ||
            part.state === "input-available") && (
            <div className="text-xs text-zinc-500 italic">
              Executing tool...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
