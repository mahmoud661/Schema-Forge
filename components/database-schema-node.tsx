import React, { ReactNode } from "react";
import { BaseNode } from "@/components/base-node";
import { TableBody, TableRow, TableCell } from "@/components/ui/table";

/* DATABASE SCHEMA NODE HEADER ------------------------------------------------ */
/**
 * A container for the database schema node header.
 */
export type DatabaseSchemaNodeHeaderProps = {
  children?: ReactNode;
};

export const DatabaseSchemaNodeHeader = ({
  children,
}: DatabaseSchemaNodeHeaderProps) => {
  return (
    <h2 className="rounded-tl-md rounded-tr-md bg-secondary p-2 text-center text-sm text-muted-foreground">
      {children}
    </h2>
  );
};

/* DATABASE SCHEMA NODE BODY -------------------------------------------------- */
/**
 * A container for the database schema node body that wraps the table.
 */
export type DatabaseSchemaNodeBodyProps = {
  children?: ReactNode;
};

export const DatabaseSchemaNodeBody = ({
  children,
}: DatabaseSchemaNodeBodyProps) => {
  return (
    <table className="border-spacing-10 overflow-visible">
      <TableBody>{children}</TableBody>
    </table>
  );
};

/* DATABASE SCHEMA TABLE ROW -------------------------------------------------- */
/**
 * A wrapper for individual table columns in the database schema node.
 */

export type DatabaseSchemaTableRowProps = {
  children: ReactNode;
  className?: string;
};

export const DatabaseSchemaTableRow = ({
  children,
  className,
}: DatabaseSchemaTableRowProps) => {
  return (
    <TableRow className={`relative text-xs ${className || ""}`}>
      {children}
    </TableRow>
  );
};

/* DATABASE SCHEMA TABLE CELL ------------------------------------------------- */
/**
 * A simplified table cell for the database schema node.
 * Renders static content without additional dynamic props.
 */
export type DatabaseSchemaTableCellProps = {
  className?: string;
  children?: ReactNode;
  leftHandle?: ReactNode;  // Add support for left handle
  rightHandle?: ReactNode; // Add support for right handle
};

export const DatabaseSchemaTableCell = ({
  className,
  children,
  leftHandle,
  rightHandle,
}: DatabaseSchemaTableCellProps) => {
  return (
    <TableCell className={`relative ${className || ""}`}>
      {leftHandle}
      {children}
      {rightHandle}
    </TableCell>
  );
};

/* DATABASE SCHEMA NODE ------------------------------------------------------- */
/**
 * The main DatabaseSchemaNode component that wraps the header and body.
 * It maps over the provided schema data to render columns and cells.
 */
export type DatabaseSchemaNodeProps = {
  className?: string;
  selected?: boolean;
  children?: ReactNode;
};

export const DatabaseSchemaNode = ({
  className,
  selected,
  children,
}: DatabaseSchemaNodeProps) => {
  return (
    <BaseNode className={className} selected={selected}>
      {children}
    </BaseNode>
  );
};
