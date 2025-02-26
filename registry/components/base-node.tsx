import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BaseNodeProps = {
  className?: string;
  selected?: boolean;
  children: ReactNode;
};

export const BaseNode = ({ className, selected, children }: BaseNodeProps) => {
  return (
    <div
      className={cn(
        "min-w-[180px] overflow-hidden rounded-md border bg-card p-2 shadow-sm",
        selected && "ring-2 ring-primary ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
};
