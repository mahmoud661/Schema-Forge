"use client";

import { cn } from "@/lib/utils";

interface DatabaseSchemaNodeProps {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
}

export function DatabaseSchemaNode({
  children,
  className,
  selected,
}: DatabaseSchemaNodeProps) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm transition-colors", selected && "border-primary", className)}>
      {children}
    </div>
  );
}

export function DatabaseSchemaNodeHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b bg-muted/50 px-6 py-4">
      <h3 className="font-semibold leading-none tracking-tight">{children}</h3>
    </div>
  );
}

export function DatabaseSchemaNodeBody({ children }: { children: React.ReactNode }) {
  return <div className="p-6">{children}</div>;
}

export function DatabaseSchemaTableRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between py-1">{children}</div>;
}

export function DatabaseSchemaTableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex items-center", className)}>{children}</div>;
}