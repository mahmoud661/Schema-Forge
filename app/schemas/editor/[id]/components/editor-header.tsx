"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  Home,
  Code,
  MessageSquare,
  Database,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExitConfirmationDialog } from "./exit-confirmation-dialog";
import { ScreenshotControls } from "./screenshot-controls";

interface EditorHeaderProps {
  onSave: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasUnsavedChanges: boolean;
  allowExit?: () => void;
  reactFlowInstanceRef?: React.MutableRefObject<any>;
}

export function EditorHeader({
  onSave,
  activeTab,
  setActiveTab,
  hasUnsavedChanges,
  allowExit,
  reactFlowInstanceRef
}: EditorHeaderProps) {
  const router = useRouter();
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const handleExitClick = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirmation(true);
    } else {
      router.push("/browse");
    }
  };

  const handleSaveAndExit = () => {
    onSave();
    if (allowExit) allowExit();
    router.push("/browse");
  };

  const handleExitWithoutSaving = () => {
    if (allowExit) allowExit();
    router.push("/browse");
  };

  const showScreenshotControls = activeTab === "visual";

  return (
    <>
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
          {showScreenshotControls && reactFlowInstanceRef && (
            <ScreenshotControls reactFlowInstanceRef={reactFlowInstanceRef} />
          )}
          <Button
            id="exit-editor-button"
            variant="secondary"
            size="sm"
            onClick={handleExitClick}
          >
            <Home className="h-4 w-4 mr-1" />
            Exit
            {hasUnsavedChanges && (
              <span className="ml-1 h-2 w-2 rounded-full bg-amber-500" title="Unsaved changes"></span>
            )}
          </Button>
          <Button size="sm" onClick={onSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Exit confirmation dialog */}
      <ExitConfirmationDialog
        isOpen={showExitConfirmation}
        onClose={() => setShowExitConfirmation(false)}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSaving={handleExitWithoutSaving}
      />
    </>
  );
}
