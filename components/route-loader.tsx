"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RouteLoader() {
  const router = useRouter();
  
  useEffect(() => {
    // Prefetch main routes as soon as possible
    const mainRoutes = ['/', '/browse', '/schemas', '/about'];
    
    // Template routes that are commonly accessed
    const templateRoutes = ['/schemas/editor/new', '/schemas/editor/ecommerce', '/schemas/editor/blog', '/schemas/editor/inventory'];
    
    // Prefetch main routes immediately
    mainRoutes.forEach(route => {
      router.prefetch(route);
    });
    
    // Prefetch template routes after a slight delay 
    // to prioritize main navigation
    const timer = setTimeout(() => {
      templateRoutes.forEach(route => {
        router.prefetch(route);
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return null; // This component doesn't render anything
}
