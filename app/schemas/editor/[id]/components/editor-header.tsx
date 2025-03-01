"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  Undo,
  Redo,
  Home,
  Code,
  MessageSquare,
  Database,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditorHeaderProps {
  onSave: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function EditorHeader({
  onSave,
  activeTab,
  setActiveTab,
}: EditorHeaderProps) {
  const router = useRouter();

  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80 mr-4"
        >
          <Database className="h-5 w-5 text-primary" />
          <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            SchemaForge
          </span>
        </Link>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="visual" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="sql" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              SQL
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm">
          <Redo className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/browse")}
        >
          <Home className="h-4 w-4 mr-1" />
          Exit
        </Button>
        <Button size="sm" onClick={onSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
