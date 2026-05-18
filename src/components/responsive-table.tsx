import React from "react";
import { cn } from "@/lib/utils";

/**
 * Wrapper that adds horizontal scroll on mobile for tables.
 */
export function ResponsiveTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0", className)}>
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}
