import React, { useEffect, useState } from "react";
import { Database, Code, CloudCog } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  title?: string;
}

export function LoadingSpinner({ title = "Loading Schema" }: LoadingSpinnerProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("Initializing...");
  
  // Simulate loading steps with more reliable progress updates
  useEffect(() => {
    // Define loading steps with their durations and target progress percentages
    const steps = [
      { message: "Initializing...", duration: 400, progress: 20 },
      { message: "Loading schema data...", duration: 700, progress: 40 },
      { message: "Preparing visual editor...", duration: 600, progress: 60 },
      { message: "Loading components...", duration: 500, progress: 80 },
      { message: "Almost ready...", duration: 300, progress: 100 }
    ];
    
    let currentTimeout: NodeJS.Timeout;
    let elapsedTime = 0;
    
    // Set initial progress
    setProgress(0);
    
    // Function to handle each step
    const runStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) return;
      
      const step = steps[stepIndex];
      setCurrentStep(step.message);
      
      // For smoother progress animation, update in smaller increments
      const startProgress = stepIndex === 0 ? 0 : steps[stepIndex - 1].progress;
      const endProgress = step.progress;
      const increment = (endProgress - startProgress) / 10;
      const incrementTime = step.duration / 10;
      
      // Update progress in smaller increments
      let currentProgress = startProgress;
      const updateProgress = () => {
        currentProgress += increment;
        if (currentProgress <= endProgress) {
          setProgress(Math.min(currentProgress, 100));
          currentTimeout = setTimeout(updateProgress, incrementTime);
        } else {
          // Move to next step
          currentTimeout = setTimeout(() => runStep(stepIndex + 1), 100);
        }
      };
      
      // Start progress updates
      updateProgress();
    };
    
    // Start with the first step
    runStep(0);
    
    // Clean up timeouts
    return () => {
      if (currentTimeout) clearTimeout(currentTimeout);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md px-8 py-12">
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            <Database className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>
        <p className="text-center text-muted-foreground mb-4">{currentStep}</p>
        
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }} // This will animate the width of the progress bar
          ></div>
        </div>
        
        <div className="mt-8 flex justify-center space-x-6">
          <div className={cn(
            "flex flex-col items-center transition-opacity",
            progress < 30 ? "opacity-30" : "opacity-100"
          )}>
            <Database className="h-6 w-6 mb-2" />
            <span className="text-xs">Schema</span>
          </div>
          <div className={cn(
            "flex flex-col items-center transition-opacity",
            progress < 60 ? "opacity-30" : "opacity-100"
          )}>
            <Code className="h-6 w-6 mb-2" />
            <span className="text-xs">SQL</span>
          </div>
          <div className={cn(
            "flex flex-col items-center transition-opacity",
            progress < 90 ? "opacity-30" : "opacity-100"
          )}>
            <CloudCog className="h-6 w-6 mb-2" />
            <span className="text-xs">Editor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
