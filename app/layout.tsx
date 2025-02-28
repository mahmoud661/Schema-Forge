import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SchemaForge - Database Schema Visualization',
  description: 'Interactive database schema visualization and design tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
         
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}