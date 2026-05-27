"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Elegant timing matching the slow cinematic transition
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            filter: "blur(8px)",
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090b] text-slate-100 overflow-hidden select-none"
        >
          <div className="relative flex flex-col items-center gap-12">
            
            {/* Elegant Glass Logo Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -3, 0]
              }}
              transition={{
                opacity: { duration: 1.2, ease: "easeOut" },
                scale: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2
                }
              }}
              className="relative w-36 h-36 flex items-center justify-center"
            >
              {/* Layer 1: Pristine White Base Silhouette */}
              <Image
                src="/logo.svg"
                alt="HeapDog Logo Base"
                fill
                className="object-contain opacity-[0.22] invert brightness-200"
                priority
              />

              {/* Layer 2: Shifting Aurora Brand Color Mask (Fades in over the white silhouette) */}
              <motion.div 
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.92 }}
                transition={{
                  delay: 0.5,
                  duration: 1.5,
                  ease: "easeInOut"
                }}
                style={{
                  maskImage: 'url(/logo.svg)',
                  WebkitMaskImage: 'url(/logo.svg)',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              >
                {/* Flowing brand colors gradient (violet, fuchsia, cyan) */}
                <motion.div
                  className="w-full h-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    backgroundSize: "200% 200%",
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                  }}
                />
              </motion.div>

              {/* Layer 3: Subtle Holographic Gloss Sweep (Specularity) */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  maskImage: 'url(/logo.svg)',
                  WebkitMaskImage: 'url(/logo.svg)',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              >
                <motion.div
                  className="w-full h-full bg-gradient-to-r from-transparent via-white/20 via-transparent to-transparent"
                  initial={{ x: "-150%" }}
                  animate={{ x: "150%" }}
                  transition={{
                    duration: 2.6,
                    ease: [0.25, 1, 0.5, 1],
                    repeat: Infinity,
                    repeatDelay: 0.6
                  }}
                  style={{
                    width: '250%',
                    height: '100%',
                    position: 'absolute',
                  }}
                />
              </div>
            </motion.div>

            {/* Ultra-minimalist Hairline Progress Bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-28 h-[1px] bg-white/10 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-white/50"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 2.1,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                />
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
