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
  clearError: () => void; // Add method to explicitly clear errors
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
  setSqlCode: (code) => {
    // Clear any errors when setting new SQL code
    set({ sqlCode: code, error: null });
  },
  setEditingSqlCode: (code) => set({ editingSqlCode: code }),
  setIsEditing: (isEditing) => {
    // When turning off edit mode, clear any errors
    if (!isEditing) {
      set({ isEditing, error: null });
    } else {
      set({ isEditing });
    }
  },
  
  startAiEditing: () => {
    console.log('[SQL Editor Store] Starting AI editing mode');
    // Clear any existing errors when starting AI editing
    set({ isAiEditing: true, error: null });
  },
  
  finishAiEditing: (success = false) => {
    console.log('[SQL Editor Store] Finishing AI editing mode, success:', success);
    set({ 
      isAiEditing: false,
      successAnimation: success,
      // Clear any errors when AI editing finishes successfully
      error: success ? null : get().error,
      // Turn off editing mode automatically
      isEditing: false,
    });
    
    // Reset success animation after a delay
    if (success) {
      setTimeout(() => {
        set({ successAnimation: false });
      }, 3000);
    }
  },
  
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setSuccessAnimation: (value) => set({ successAnimation: value }),
}));

// Listen to schema store changes and update SQL code
useSchemaStore.subscribe(
  (state) => state.schema.sqlCode,
  (sqlCode) => {
    console.log('[SQL Editor Store] Syncing SQL code from schema store');
    if (sqlCode && sqlCode.trim() !== '') {
      useSqlEditorStore.setState({ sqlCode, error: null });
    }
  }
);
