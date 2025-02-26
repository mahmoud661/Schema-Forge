import { Node, Edge } from "@xyflow/react";

interface Template {
  nodes: Node[];
  edges: Edge[];
}

interface Templates {
  [key: string]: Template;
}

export const templates: Templates = {
  ecommerce: {
    nodes: [
      {
        id: "1",
        position: { x: 0, y: 0 },
        type: "databaseSchema",
        data: {
          label: "Products",
          schema: [
            { title: "id", type: "uuid" },
            { title: "name", type: "varchar" },
            { title: "price", type: "decimal" },
            { title: "category_id", type: "uuid" },
          ],
        },
      },
      {
        id: "2",
        position: { x: 350, y: 0 },
        type: "databaseSchema",
        data: {
          label: "Categories",
          schema: [
            { title: "id", type: "uuid" },
            { title: "name", type: "varchar" },
            { title: "description", type: "text" },
          ],
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        sourceHandle: "category_id", // Using the title as handle ID
        targetHandle: "id",         // Using the title as handle ID
        type: "smoothstep",
        animated: true,
      },
    ],
  },
  blog: {
    nodes: [
      {
        id: "1",
        position: { x: 0, y: 0 },
        type: "databaseSchema",
        data: {
          label: "Posts",
          schema: [
            { title: "id", type: "uuid" },
            { title: "title", type: "varchar" },
            { title: "content", type: "text" },
            { title: "author_id", type: "uuid" },
          ],
        },
      },
      {
        id: "2",
        position: { x: 350, y: 0 },
        type: "databaseSchema",
        data: {
          label: "Users",
          schema: [
            { title: "id", type: "uuid" },
            { title: "name", type: "varchar" },
            { title: "email", type: "varchar" },
          ],
        },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        sourceHandle: "author_id", // Using the title as handle ID
        targetHandle: "id",       // Using the title as handle ID
        type: "smoothstep",
        animated: true,
      },
    ],
  },
  inventory: {
    nodes: [
      {
        id: "1",
        position: { x: 0, y: 0 },
        type: "databaseSchema",
        data: {
          label: "Products",
          schema: [
            { title: "id", type: "uuid" },
            { title: "name", type: "varchar" },
            { title: "description", type: "varchar" },
            { title: "warehouse_id", type: "uuid" },
            { title: "supplier_id", type: "uuid" },
            { title: "price", type: "money" },
            { title: "quantity", type: "int4" },
          ],
        },
      },
      {
        id: "2",
        position: { x: 350, y: -100 },
        type: "databaseSchema",
        data: {
          label: "Warehouses",
          schema: [
            { title: "id", type: "uuid" },
            { title: "name", type: "varchar" },
            { title: "address", type: "varchar" },
            { title: "capacity", type: "int4" },
          ],
        },
      },
      {
        id: "3",
        position: { x: 350, y: 200 },
        type: "databaseSchema",
        data: {
          label: "Suppliers",
          schema: [
            { title: "id", type: "uuid" },
            { title: "name", type: "varchar" },
            { title: "description", type: "varchar" },
            { title: "country", type: "varchar" },
          ],
        },
      },
    ],
    edges: [
      {
        id: "products-warehouses",
        source: "1",
        target: "2",
        sourceHandle: "warehouse_id", // Using the title as handle ID
        targetHandle: "id",           // Using the title as handle ID
        type: "smoothstep",
        animated: true,
      },
      {
        id: "products-suppliers",
        source: "1",
        target: "3",
        sourceHandle: "supplier_id", // Using the title as handle ID
        targetHandle: "id",          // Using the title as handle ID
        type: "smoothstep",
        animated: true,
      },
    ],
  },
};