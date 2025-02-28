"use client";

import { createContext, useState, useContext, ReactNode } from "react";

type SidebarType = "schema" | "sql" | "ai" | "edge";

interface SidebarWidthsState {
  [key: string]: number;
}

interface SidebarContextType {
  sidebarWidths: SidebarWidthsState;
  updateSidebarWidth: (type: SidebarType, width: number) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const defaultWidths: SidebarWidthsState = {
  schema: 320,
  sql: 400,
  ai: 320,
  edge: 320
};

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarWidths, setSidebarWidths] = useState<SidebarWidthsState>(defaultWidths);

  const updateSidebarWidth = (type: SidebarType, width: number) => {
    setSidebarWidths(prev => ({
      ...prev,
      [type]: width
    }));
  };

  return (
    <SidebarContext.Provider value={{ sidebarWidths, updateSidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarWidths() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarWidths must be used within a SidebarProvider');
  }
  return context;
}
