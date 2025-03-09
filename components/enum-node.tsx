"use client";

import { memo, useEffect, useState } from "react";
import { Position, Handle, NodeProps } from "@xyflow/react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { EnumNodeData } from "@/app/schemas/editor/[id]/types/types";

interface EnumNodeProps extends NodeProps {
  data: EnumNodeData;
  selected?: boolean;
}

const EnumNode = memo(({ data, selected }: EnumNodeProps) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-background p-0 shadow-md min-w-[180px] border rounded-md overflow-hidden">
        <div className="w-full rounded-t-md py-2 px-3 font-medium bg-muted/20">
          {data.name}
        </div>
        <div className="p-3">Loading...</div>
      </div>
    );
  }

  return (
    <div className="reletive">
      <div
        className={`
        bg-background
        p-0 
        transition-all 
        duration-200
        ${selected ? "ring-1 ring-purple-500 shadow-md" : "shadow-sm"} 
        min-w-[200px] 
        rounded-md 
        overflow-hidden
        relative
        border
      `}
        style={{
          zIndex: selected ? 30 : 20,
        }}
      >
        {/* Header */}
        <div className="relative overflow-visible">
          <div
            className={`
            w-full 
            font-medium 
            text-foreground 
            py-2.5 
            px-3 
            rounded-t-md
            border-b
            ${
              isDarkMode
                ? "bg-purple-950/30 border-purple-800/40"
                : "bg-purple-100/70 border-purple-200"
            }
          `}
          >
            <Badge
              variant="outline"
              className={`
              mr-2 
              py-0 
              px-1.5
              text-[0.65rem] 
              font-medium 
              ${
                isDarkMode
                  ? "bg-purple-950 border-purple-800 text-purple-300"
                  : "bg-purple-50 border-purple-200 text-purple-700"
              }
            `}
            >
              ENUM
            </Badge>
            <span className="ml-0.5">{data.name}</span>
          </div>
        </div>

        {/* Body */}
        <div>
          {data.values && data.values.length > 0 ? (
            <div className="w-full rounded overflow-hidden border border-muted/50">
              <table className="w-full text-xs">
                <thead className={isDarkMode ? "bg-muted/40" : "bg-muted/20"}>
                  <tr>
                    <th className="text-left py-1.5 px-3 font-medium border-b border-muted/30">
                      Value
                    </th>
                    <th className="text-right py-1.5 px-3 font-medium border-b border-muted/30">
                      Index
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.values.map((value, index) => (
                    <tr
                      key={index}
                      className={`
                      hover:bg-muted/60
                      transition-colors
                      ${
                        index % 2 === 0
                          ? isDarkMode
                            ? "bg-muted/20"
                            : "bg-muted/10"
                          : ""
                      }
                    `}
                    >
                      <td className="py-1.5 px-3 font-mono border-b border-muted/20">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isDarkMode ? "text-purple-400" : "text-purple-600"
                            }
                          >
                            •
                          </span>
                          {`'${value}'`}
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-right text-muted-foreground text-[10px] border-b border-muted/20">
                        {index}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs italic text-center text-muted-foreground p-3 border border-dashed border-muted/50 rounded-md w-full">
              No values defined
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id={`enum-source-${data.name}`}
        className="custom-handle !absolute transition-all duration-200 z-30"
      />
    </div>
  );
});

EnumNode.displayName = "EnumNode";

export default EnumNode;
