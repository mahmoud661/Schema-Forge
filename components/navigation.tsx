"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Database, FileText, Home, Info } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Prefetch all main routes on component mount
  React.useEffect(() => {
    // Prefetch main routes for instant navigation
    const routesToPrefetch = ['/', '/browse', '/schemas', '/about'];
    
    routesToPrefetch.forEach(route => {
      router.prefetch(route);
    });
  }, [router]);

  // Optimize scroll handling with RAF for smoother performance
  React.useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
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
      path: "/about",
      label: "About",
      icon: Info,
    },
  ];

  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    if (pathname === path) return;
    setIsNavigating(true);
    router.push(path);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-sm transition-all duration-200 px-5",
        isScrolled ? "border-border bg-background/90 shadow-md" : "border-transparent bg-background/50"
      )}
    >
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => handleNavigation("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Database className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden md:inline-flex">SchemaForge</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {routes.map((route) => {
              const isActive = pathname === route.path;
              
              return (
                <Button
                  key={route.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="flex items-center gap-1 h-9 transition-colors duration-200 hover:bg-accent/10"
                  onClick={() => handleNavigation(route.path)}
                  disabled={isNavigating}
                >
                  <route.icon className="h-4 w-4" />
                  <span className="hidden sm:inline-flex">{route.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      
      {isNavigating && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/30">
          <div className="h-full bg-primary w-1/3 animate-progress"></div>
        </div>
      )}
    </header>
  );
}