import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SchemaNode } from "@/app/schemas/editor/[id]/types/types";
import { Edge } from "@xyflow/react";

export interface SchemaMetadata {
  id: string;
  title: string;
  description: string;
  tags: string[];
  lastModified: string; // ISO date string
  createdAt: string;    // ISO date string
  sqlCode?: string;
  nodes?: SchemaNode[];
  edges?: Edge[];
  enumTypes?: { name: string; values: string[] }[];
  settings?: {
    caseSensitiveIdentifiers: boolean;
    useInlineConstraints: boolean;
  };
}

interface SchemasCollectionState {
  schemas: SchemaMetadata[];
  addSchema: (schema: Omit<SchemaMetadata, 'id' | 'createdAt' | 'lastModified'>) => string;
  updateSchema: (id: string, data: Partial<Omit<SchemaMetadata, 'id' | 'createdAt'>>) => void;
  deleteSchema: (id: string) => void;
  getSchema: (id: string) => SchemaMetadata | undefined;
}

export const useSchemasCollection = create<SchemasCollectionState>()(
  persist(
    (set, get) => ({
      schemas: [],
      addSchema: (schema) => {
        const id = `schema_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();
        const newSchema: SchemaMetadata = {
          ...schema,
          id,
          createdAt: now,
          lastModified: now,
        };
        
        set((state) => ({
          schemas: [...state.schemas, newSchema]
        }));
        
        return id;
      },
      updateSchema: (id, data) => {
        set((state) => ({
          schemas: state.schemas.map((schema) => 
            schema.id === id 
              ? { 
                  ...schema, 
                  ...data, 
                  lastModified: new Date().toISOString() 
                } 
              : schema
          )
        }));
      },
      deleteSchema: (id) => {
        set((state) => ({
          schemas: state.schemas.filter((schema) => schema.id !== id)
        }));
      },
      getSchema: (id) => {
        return get().schemas.find((schema) => schema.id === id);
      }
    }),
    { name: 'schemas-collection-storage' }
  )
);
