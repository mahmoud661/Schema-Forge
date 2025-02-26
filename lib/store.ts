"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';

interface Schema {
  id: string;
  title: string;
  description: string;
  tags: string[];
  template?: string;
  nodes?: Node[];
  edges?: Edge[];
  createdAt: string;
  updatedAt: string;
}

interface SchemaStore {
  schemas: Schema[];
  addSchema: (schema: Schema) => void;
  updateSchema: (id: string, schema: Partial<Schema>) => void;
  deleteSchema: (id: string) => void;
}

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set) => ({
      schemas: [],
      addSchema: (schema) =>
        set((state) => ({
          schemas: [...state.schemas, schema],
        })),
      updateSchema: (id, updatedSchema) =>
        set((state) => ({
          schemas: state.schemas.map((schema) =>
            schema.id === id
              ? { ...schema, ...updatedSchema, updatedAt: new Date().toISOString() }
              : schema
          ),
        })),
      deleteSchema: (id) =>
        set((state) => ({
          schemas: state.schemas.filter((schema) => schema.id !== id),
        })),
    }),
    {
      name: 'schema-storage',
    }
  )
);