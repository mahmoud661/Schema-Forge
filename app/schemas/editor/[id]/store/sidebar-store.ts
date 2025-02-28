import { create } from 'zustand';

export type SidebarType = 'schema' | 'sql' | 'ai' | 'edge';

interface SidebarState {
  widths: {
    [key in SidebarType]?: number;
  };
  updateWidth: (type: SidebarType, width: number) => void;
}

const defaultWidths = {
  schema: 320,
  sql: 400,
  ai: 320,
  edge: 320
};

export const useSidebarStore = create<SidebarState>((set) => ({
  widths: defaultWidths,
  updateWidth: (type, width) => set((state) => ({
    widths: {
      ...state.widths,
      [type]: width
    }
  }))
}));
