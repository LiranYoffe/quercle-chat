"use client";

import { ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";

interface AppShellProps {
  children: ReactNode;
  sidebar: ReactNode;
  isSidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
}

export function AppShell({
  children,
  sidebar,
  isSidebarOpen,
  onSidebarOpenChange,
}: AppShellProps) {
  const isDesktop = useIsDesktop();

  return (
    <div className="fixed inset-0 flex bg-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside className="w-70 h-full border-r border-zinc-800 shrink-0 overflow-hidden bg-zinc-900">
          {sidebar}
        </aside>
      )}

      {/* Mobile Sidebar Sheet */}
      {!isDesktop && (
        <Sheet open={isSidebarOpen} onOpenChange={onSidebarOpenChange}>
          <SheetContent side="left" className="w-70 p-0 bg-zinc-900 border-zinc-800">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-zinc-950">
        {children}
      </main>
    </div>
  );
}
