"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Database, FileText, Home, Info } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);

  // Optimize by using passive listener and throttling scroll event
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Add the event listener with passive option for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const routes = [
    {
      path: "/",
      label: "Home",
      icon: Home,
    },
    {
      path: "/browse",
      label: "Browse Schemas",
      icon: Database,
    },
    {
      path: "/schemas",
      label: "Editor",
      icon: FileText,
    },
    {
      path: "/about",
      label: "About",
      icon: Info,
    },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-sm transition-all duration-200",
        isScrolled ? "border-border bg-background/90" : "border-transparent bg-background/50"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden md:inline-flex">SchemaForge</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {routes.map((route) => {
              const isActive = pathname === route.path;
              
              return (
                <Link href={route.path} key={route.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="flex items-center gap-1 h-9"
                  >
                    <route.icon className="h-4 w-4" />
                    <span className="hidden sm:inline-flex">{route.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}