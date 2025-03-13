import { Metadata } from "next";
import SchemaEditorClient from "./schema-editor-client";
import { MobileWarning } from "@/components/mobile-warning";

export const metadata: Metadata = {
  title: "Schema Editor - SchemaForge",
  description: "Edit and visualize your database schema",
};

// Force dynamic rendering for all schema editor pages
export const dynamic = "force-dynamic";

// Explicitly disable static params - we can't know all schema IDs at build time
export const generateStaticParams = undefined;

// This component will be rendered dynamically for each schema ID
export default function SchemaEditorPage() {
  return (
    <>
      <MobileWarning />
      <SchemaEditorClient />
    </>
  );
}
