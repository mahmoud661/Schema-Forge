"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

export function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkScreenSize();
    
    // Add listener for window resize
    window.addEventListener("resize", checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Small Screen Detected</h2>
        <p className="text-muted-foreground mb-4">
          For the best experience with  schema Forge, please use a larger screen device.
          The interactive elements work best with more screen space.
        </p>
        {/* <p className="text-sm text-muted-foreground">
          You can continue, but some features may be difficult to use.
        </p> */}
      </div>
    </div>
  );
}
