import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Save } from "lucide-react";

interface ExitConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
}

export function ExitConfirmationDialog({
  isOpen,
  onClose,
  onSaveAndExit,
  onExitWithoutSaving,
}: ExitConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes. What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            If you exit without saving, all changes made since your last save will be lost.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="mt-2 sm:mt-0 order-3 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onExitWithoutSaving}
            className="order-2"
          >
            Exit Without Saving
          </Button>
          <Button 
            variant="default" 
            onClick={onSaveAndExit}
            className="gap-2 order-1 sm:order-3"
          >
            <Save className="h-4 w-4" />
            Save and Exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
