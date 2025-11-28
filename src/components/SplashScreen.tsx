"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Terminal, Code2, Cpu } from "lucide-react";

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [loadingText, setLoadingText] = useState("Initializing");

  useEffect(() => {
    // Text animation cycle
    const textInterval = setInterval(() => {
      setLoadingText((prev) => {
        if (prev === "Initializing...") return "Initializing";
        return prev + ".";
      });
    }, 500);

    // Start fading out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 2000);

    // Remove from DOM after fade completes (e.g., 700ms fade matching transition duration)
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      clearInterval(textInterval);
    }, 2700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      clearInterval(textInterval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ease-in-out",
        opacity === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="relative flex flex-col items-center gap-6">
        {/* Dog Image with subtle floating animation */}
        <div className="animate-[bounce_3s_infinite] relative">
             <Image
              src="/heapdog.png"
              alt="HeapDog Loading"
              width={120}
              height={120}
              className="object-contain drop-shadow-[0_0_15px_rgba(94,23,235,0.5)]"
              priority
            />
        </div>
        
        {/* Tech-themed Animated Loader */}
        <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center">
                {/* Pulsing Circle Background */}
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                {/* Icon */}
                <div className="relative bg-background p-3 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(94,23,235,0.2)]">
                    <Terminal className="w-6 h-6 text-primary animate-pulse" />
                </div>
            </div>

            <div className="font-mono text-sm text-muted-foreground tracking-widest min-w-[140px] text-center">
                <span className="text-primary mr-2">{">"}</span>
                {loadingText}
            </div>
        </div>
      </div>
    </div>
  );
};
