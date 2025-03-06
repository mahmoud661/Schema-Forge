"use client";

import { memo, useEffect, useState } from "react";
import { Position, Handle } from "@xyflow/react";
import { useTheme } from "next-themes";
import { themeAwareStringToColor } from "@/lib/utils";
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
} from "@/components/database-schema-node";
import { Badge } from "@/components/ui/badge";
import { EnumNodeData } from "@/app/schemas/editor/[id]/types";

const EnumNode = memo(
  ({ data, selected }: { data: EnumNodeData; selected?: boolean }) => {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return (
        <DatabaseSchemaNode className="p-0 shadow-md min-w-[180px]">
          <DatabaseSchemaNodeHeader>
            <div className="w-full rounded-t-md py-2 px-3 font-medium bg-muted/20">
              {data.name}
            </div>
          </DatabaseSchemaNodeHeader>
          <DatabaseSchemaNodeBody>Loading...</DatabaseSchemaNodeBody>
        </DatabaseSchemaNode>
      );
    }

    const headerColor = themeAwareStringToColor(data.name, {
      darkMode: isDarkMode,
      hue: 280, // Purple hue for enums
    });

    return (
      <DatabaseSchemaNode
        className={`p-0 transition-all duration-200 ${
          selected ? "ring-2 ring-primary shadow-lg" : "shadow-md"
        } min-w-[180px]`}
        selected={selected}
      >
        <DatabaseSchemaNodeHeader>
          <div
            className="w-full rounded-t-md py-2 px-3 font-medium"
            style={{
              backgroundColor: themeAwareStringToColor(data.name, {
                darkMode: isDarkMode,
                hue: 280,
                saturation: isDarkMode ? 40 : 70,
                lightness: { light: 96, dark: 20 },
                opacity: 0.25,
              }),
              borderBottom: `2px solid ${headerColor}`,
            }}
          >
            <Badge
              variant="outline"
              className="mr-2 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
            >
              ENUM
            </Badge>
            {data.name}
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id={`enum-source-${data.name}`}
            className="!absolute transition-all duration-150"
            style={{
              background: isDarkMode ? "#a855f7" : "#9333ea",
              border: `2px solid ${isDarkMode ? "#374151" : "white"}`,
              width: "12px",
              height: "12px",
              right: -6,
            }}
          />
        </DatabaseSchemaNodeHeader>
        <DatabaseSchemaNodeBody className="p-3 space-y-1">
          {data.values && data.values.length > 0 ? (
            data.values.map((value, index) => (
              <div
                key={index}
                className="flex items-center py-1 px-2 text-xs rounded hover:bg-muted/60"
              >
                <span className="text-muted-foreground mr-2">→</span>
                <span className="font-mono">&apos;{value}&apos;</span>
              </div>
            ))
          ) : (
            <div className="text-xs italic text-muted-foreground p-2">
              No values defined
            </div>
          )}
          <div className="text-xs text-center pt-2 pb-1 mt-1 border-t text-muted-foreground">
            Click to edit
          </div>
        </DatabaseSchemaNodeBody>
      </DatabaseSchemaNode>
    );
  }
);

EnumNode.displayName = "EnumNode";

export default EnumNode;
