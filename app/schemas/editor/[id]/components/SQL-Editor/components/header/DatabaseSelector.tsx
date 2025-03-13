import React from "react";
import { Database, Info, CheckCircle2, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface DatabaseSelectorProps {
  dbType: string;
  setDbType: (type: string) => void;
  databaseOptions: Array<{
    value: string;
    label: string;
    recommended: boolean;
  }>;
}

export function DatabaseSelector({ dbType, setDbType, databaseOptions }: DatabaseSelectorProps) {
  const isPostgres = dbType === "postgresql";
  
  return (
    <div className="space-y-1.5">
 
      
      <div className="flex items-center gap-2.5">
        <Select value={dbType} onValueChange={setDbType}>
          <SelectTrigger className="min-w-[180px] h-9 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {databaseOptions.map(db => (
              <SelectItem key={db.value} value={db.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{db.label}</span>
                  {db.recommended && (
                    <Star size={13} className="text-amber-400 fill-amber-400 ml-1.5" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {isPostgres ? <RecommendedBadge /> : <InfoTooltip />}
      </div>
    </div>
  );
}

function RecommendedBadge() {
  return (
    <span className="flex h-6 items-center rounded-full border px-2.5 bg-green-50 text-green-700 border-green-200 text-xs dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30">
      <CheckCircle2 size={12} className="mr-1.5" /> Recommended
    </span>
  );
}

function InfoTooltip() {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <div className="rounded-full p-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 cursor-help">
          <Info size={13} className="text-amber-600 dark:text-amber-400" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">PostgreSQL Recommended</h4>
          <p className="text-xs">Offers advanced features like:</p>
          <ul className="text-xs list-disc pl-4 space-y-1">
            <li>ENUM types for strict data validation</li>
            <li>Better JSON support with JSONB</li>
            <li>More powerful constraints and indexing</li>
            <li>Full text search capabilities</li>
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
