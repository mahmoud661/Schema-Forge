"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export const ThemeProvider = React.forwardRef<
  HTMLDivElement,
  ThemeProviderProps
>(({ children, ...props }, ref) => {
  return (
    <NextThemesProvider {...props}>
      <div ref={ref}>
        {children}
      </div>
    </NextThemesProvider>
  );
});

ThemeProvider.displayName = "ThemeProvider";
