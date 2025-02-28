import React from "react";

interface SqlErrorNoticeProps {
  error: string;
}

export function SqlErrorNotice({ error }: SqlErrorNoticeProps) {
  return (
    <div className="bg-destructive/10 text-destructive p-3 m-4 rounded-md border border-destructive">
      {error}
    </div>
  );
}
