import { create } from 'zustand';
import { useSchemaStore } from '@/hooks/use-schema';

interface SqlEditorState {
  // Core SQL state
  sqlCode: string;
  editingSqlCode: string;
  isEditing: boolean;
  isAiEditing: boolean;
  successAnimation: boolean;
  error: string | null;
  
  // Actions
  setSqlCode: (code: string) => void;
  setEditingSqlCode: (code: string) => void;
  setIsEditing: (isEditing: boolean) => void;
  startAiEditing: () => void;
  finishAiEditing: (success?: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessAnimation: (value: boolean) => void;
}

export const useSqlEditorStore = create<SqlEditorState>((set, get) => ({
  // Initial state
  sqlCode: useSchemaStore.getState().schema.sqlCode || '',
  editingSqlCode: '',
  isEditing: false,
  isAiEditing: false,
  successAnimation: false,
  error: null,
  
  // Actions
  setSqlCode: (code) => set({ sqlCode: code }),
  setEditingSqlCode: (code) => set({ editingSqlCode: code }),
  setIsEditing: (isEditing) => set({ isEditing }),
  
  startAiEditing: () => {
    console.log('[SQL Editor Store] Starting AI editing mode');
    set({ isAiEditing: true });
  },
  
  finishAiEditing: (success = false) => {
    console.log('[SQL Editor Store] Finishing AI editing mode, success:', success);
    set({ 
      isAiEditing: false,
      successAnimation: success,
    });
    
    // Reset success animation after a delay
    if (success) {
      setTimeout(() => {
        set({ successAnimation: false });
      }, 3000);
    }
  },
  
  setError: (error) => set({ error }),
  setSuccessAnimation: (value) => set({ successAnimation: value }),
}));

// Listen to schema store changes and update SQL code
useSchemaStore.subscribe(
  (state) => state.schema.sqlCode,
  (sqlCode) => {
    console.log('[SQL Editor Store] Syncing SQL code from schema store');
    useSqlEditorStore.setState({ sqlCode });
  }
);
