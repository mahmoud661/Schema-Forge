import { Metadata } from "next";
import SchemaEditorClient from "./schema-editor-client";

export const metadata: Metadata = {
  title: "Schema Editor - SchemaForge",
  description: "Edit and visualize your database schema",
};

// Generate all possible static paths including template-based IDs
export function generateStaticParams() {
  const paths = [];

  // Add fixed routes
  paths.push({ id: "new" });



  return paths;
}

export default function SchemaEditorPage() {
  return <SchemaEditorClient />;
}
