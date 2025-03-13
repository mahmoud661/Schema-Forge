"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface BackgroundParticlesProps {
  className?: string;
  particleCount?: number;
  particleColor?: string;
}

export function BackgroundParticles({
  className,
  particleCount = 30,
  particleColor = "currentColor"
}: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const frameIdRef = useRef<number>(0);
  
  // Initialize particles with improved visibility
  const initParticles = () => {
    if (!canvasRef.current) return;
    
    const { width, height } = canvasRef.current;
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1.5, // Larger size for better visibility
        speedX: Math.random() * 0.3 - 0.15, // Slower movement looks more elegant
        speedY: Math.random() * 0.3 - 0.15,
        opacity: Math.random() * 0.7 + 0.3, // Higher base opacity
        color: particleColor
      });
    }
    
    particlesRef.current = particles;
  };
  
  // Draw function with better connections
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Update and draw particles
    particlesRef.current.forEach(particle => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Wrap around edges
      if (particle.x > width) particle.x = 0;
      if (particle.x < 0) particle.x = width;
      if (particle.y > height) particle.y = 0;
      if (particle.y < 0) particle.y = height;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `${particle.color}`;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();
      ctx.closePath();
    });
    
    // Connect nearby particles with lines - increased connection distance
    ctx.globalAlpha = 0.25; // More visible connections
    ctx.strokeStyle = particleColor;
    ctx.lineWidth = 0.7; // Thicker lines
    
    for (let i = 0; i < particlesRef.current.length; i++) {
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const p1 = particlesRef.current[i];
        const p2 = particlesRef.current[j];
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Increased connection distance for more lines
        if (distance < 150) {
          // Make lines fade with distance
          const opacity = 1 - distance / 150;
          ctx.globalAlpha = opacity * 0.25;
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.closePath();
        }
      }
    }
    
    // Continue animation with throttling for better performance
    frameIdRef.current = requestAnimationFrame(draw);
  };
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      setDimensions({
        width: canvas.width,
        height: canvas.height
      });
      
      initParticles();
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Start animation when canvas is ready
  useEffect(() => {
    if (canvasRef.current && dimensions.width > 0 && dimensions.height > 0) {
      initParticles();
      frameIdRef.current = requestAnimationFrame(draw);
    }
    
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [dimensions]);
  
  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 z-[-1] pointer-events-none",
        className
      )}
      width={dimensions.width}
      height={dimensions.height}
    />
  );
}
