"use client";

import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface LabeledHandleProps {
  id: string;
  title: string;
  type: "source" | "target";
  position: Position;
  className?: string;
  handleClassName?: string;
  labelClassName?: string;
}

export function LabeledHandle({
  id,
  title,
  type,
  position,
  className,
  handleClassName,
  labelClassName,
}: LabeledHandleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Handle
        id={id}
        type={type}
        position={position}
        className={cn("!bg-primary !border-border", handleClassName)}
      />
      <span className={cn("text-sm text-muted-foreground", labelClassName)}>
        {title}
      </span>
    </div>
  );
}