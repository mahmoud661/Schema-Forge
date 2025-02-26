"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Table, KeyRound, Hash, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  selectedNode: string | null;
  onUpdateNode: (data: any) => void;
}

const dataTypes = [
  { id: "uuid", label: "UUID", icon: KeyRound },
  { id: "varchar", label: "VARCHAR", icon: Type },
  { id: "text", label: "TEXT", icon: Type },
  { id: "int4", label: "INTEGER", icon: Hash },
  { id: "money", label: "MONEY", icon: Hash },
  { id: "timestamp", label: "TIMESTAMP", icon: Hash },
  { id: "boolean", label: "BOOLEAN", icon: Hash },
];

export function Sidebar({ selectedNode, onUpdateNode }: SidebarProps) {
  const [draggedType, setDraggedType] = useState<string | null>(null);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedType(nodeType);
  };

  const onDragEnd = () => {
    setDraggedType(null);
  };

  return (
    <div className="w-80 border-r bg-background p-4 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold mb-2">Add Table</h3>
        <div
          className="p-3 border rounded-lg cursor-move transition-colors hover:bg-muted"
          draggable
          onDragStart={(e) => onDragStart(e, 'databaseSchema')}
          onDragEnd={onDragEnd}
        >
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            <span>Database Table</span>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-2">Data Types</h3>
        <div className="grid gap-2">
          {dataTypes.map((type) => (
            <div
              key={type.id}
              className={cn(
                "p-2 border rounded-lg cursor-move transition-colors hover:bg-muted flex items-center gap-2",
                draggedType === type.id && "border-primary"
              )}
              draggable
              onDragStart={(e) => onDragStart(e, type.id)}
              onDragEnd={onDragEnd}
            >
              <type.icon className="h-4 w-4" />
              <span className="text-sm">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-4">Table Properties</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Table Name</Label>
                <Input placeholder="Enter table name" />
              </div>
              <div className="space-y-2">
                <Label>Columns</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Column name" className="flex-1" />
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}