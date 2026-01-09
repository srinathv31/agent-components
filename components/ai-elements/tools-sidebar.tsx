"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WrenchIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ToolsSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
  className?: string;
  toolCount?: number;
};

export function ToolsSidebar({
  open,
  onOpenChange,
  children,
  className,
  toolCount = 0,
}: ToolsSidebarProps) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l bg-card transition-all duration-300 ease-out",
        open ? "w-96" : "w-0 border-l-0 overflow-hidden",
        className
      )}
    >
      {open && (
        <>
          <ToolsSidebarHeader
            toolCount={toolCount}
            onClose={() => onOpenChange(false)}
          />
          <Separator />
          <ToolsSidebarContent>{children}</ToolsSidebarContent>
        </>
      )}
    </aside>
  );
}

type ToolsSidebarHeaderProps = {
  toolCount: number;
  onClose: () => void;
};

function ToolsSidebarHeader({ toolCount, onClose }: ToolsSidebarHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <WrenchIcon className="size-4 text-muted-foreground" />
        <span className="font-semibold text-sm">Tools</span>
        {toolCount > 0 && (
          <Badge variant="secondary" className="rounded-full px-2 text-xs">
            {toolCount}
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={onClose}
        aria-label="Close tools panel"
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}

type ToolsSidebarContentProps = {
  children?: ReactNode;
};

function ToolsSidebarContent({ children }: ToolsSidebarContentProps) {
  return (
    <ScrollArea className="flex-1 min-w-0">
      <div className="min-w-0 space-y-2 p-4">{children}</div>
    </ScrollArea>
  );
}

export function ToolsSidebarEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-full bg-muted p-3">
        <WrenchIcon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        No tools used yet
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Tool calls will appear here as the AI works
      </p>
    </div>
  );
}
