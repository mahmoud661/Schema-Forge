"use client";

import React from "react";
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

export const LabeledHandle = ({
  id,
  title,
  type,
  position,
  className,
  handleClassName,
  labelClassName,
}: LabeledHandleProps) => {
  return (
    <div className={cn("flex items-center relative", className)}>
      <Handle
        id={id}
        type={type}
        position={position}
        className={cn(
          "h-3 w-3 rounded-full bg-primary border-2 border-white",
          position === Position.Left && "-ml-1.5",
          position === Position.Right && "-mr-1.5",
          handleClassName
        )}
        // Remove absolute positioning from style to let Handle component handle it
        style={{ zIndex: 50 }} 
        isConnectable={true}
      />
      <span
        className={cn(
          "truncate text-xs",
          position === Position.Left && "pl-3",
          position === Position.Right && "text-right pr-3",
          labelClassName
        )}
      >
        {title}
      </span>
    </div>
  );
};