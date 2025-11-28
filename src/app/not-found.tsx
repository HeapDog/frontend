"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { motion } from "framer-motion";

const DizzyStar = ({ delay = 0, cx, cy, r }: { delay?: number, cx: number, cy: number, r: number }) => (
  <motion.g
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.5, 1, 0.5], 
      scale: [0.8, 1.2, 0.8],
      rotate: 360 
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "linear",
      delay: delay
    }}
    style={{ originX: "50%", originY: "50%" }}
  >
    <path
      d="M100 20 L105 35 L120 35 L108 45 L112 60 L100 50 L88 60 L92 45 L80 35 L95 35 Z"
      transform={`translate(${cx - 100} ${cy - 40}) scale(${r})`}
      fill="#FFD700"
      stroke="#E6C200"
      strokeWidth="1"
    />
  </motion.g>
);

const SpiralEye = ({ cx, cy }: { cx: number; cy: number }) => (
  <motion.g
    animate={{ rotate: 360 }}
    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    style={{ originX: "50%", originY: "50%" }}
  >
    <path
      d={`M ${cx} ${cy} m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0 m 3,0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </motion.g>
);

const LinePuppy = () => {
  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-4 select-none text-primary/80">
      <motion.svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-lg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
         {/* Orbiting Stars Group */}
         <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ originX: "100px", originY: "100px" }} 
        >
          <DizzyStar cx={100} cy={30} r={0.5} delay={0} />
          <DizzyStar cx={160} cy={80} r={0.4} delay={1} />
          <DizzyStar cx={40} cy={80} r={0.6} delay={2} />
        </motion.g>

        <motion.g
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Head shape - floppy ears */}
          <path d="M 60 80 C 50 60, 30 80, 30 110 C 30 130, 50 120, 60 110" /> {/* Left Ear */}
          <path d="M 140 80 C 150 60, 170 80, 170 110 C 170 130, 150 120, 140 110" /> {/* Right Ear */}
          
          {/* Top of head */}
          <path d="M 60 80 Q 100 60, 140 80" />
          
          {/* Cheeks/Face bottom */}
          <path d="M 60 110 Q 60 130, 80 140 Q 100 145, 120 140 Q 140 130, 140 110" />

          {/* Body - sitting pose */}
          <path d="M 70 135 C 60 150, 50 180, 60 180 L 140 180 C 150 180, 140 150, 130 135" />
          
          {/* Front Paws */}
          <path d="M 85 180 Q 85 165, 95 165 Q 105 165, 105 180" />
          <path d="M 115 180 Q 115 165, 125 165 Q 135 165, 135 180" />
          
          {/* Tail - wagging */}
          <motion.path 
            d="M 140 170 Q 160 160, 165 140"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 10, 0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "140px", originY: "170px" }}
          />

          {/* Eyes - Dizzy Spirals */}
          <SpiralEye cx={85} cy={105} />
          <SpiralEye cx={115} cy={105} />

          {/* Nose - Cute button nose */}
          <path d="M 95 120 Q 100 125, 105 120 Q 100 115, 95 120 Z" fill="currentColor" stroke="none" />

          {/* Mouth - Small w shape */}
          <path d="M 95 128 Q 100 132, 105 128" />

          {/* Tongue - hanging out slightly */}
          <motion.path
            d="M 98 130 Q 100 138, 102 130" 
            fill="#FF8A80"
            stroke="#FF8A80"
            strokeWidth="1"
            animate={{ d: ["M 98 130 Q 100 138, 102 130", "M 98 130 Q 100 142, 102 130", "M 98 130 Q 100 138, 102 130"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Confused question marks */}
           <motion.g
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ opacity: [0, 1, 0], y: -20, x: [0, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
           >
             <text x="150" y="70" fontSize="24" fill="currentColor" stroke="none" style={{ fontFamily: "monospace" }}>?</text>
           </motion.g>
           <motion.g
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ opacity: [0, 1, 0], y: -20, x: [0, -5, 5] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
           >
             <text x="40" y="70" fontSize="20" fill="currentColor" stroke="none" style={{ fontFamily: "monospace" }}>?</text>
           </motion.g>

        </motion.g>
      </motion.svg>
    </div>
  );
};

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center bg-background p-4 text-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#5E17EB_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.03] dark:opacity-[0.05]" />
      
      <div className="relative flex flex-col items-center space-y-6 max-w-lg mx-auto text-center z-10">
        
        <LinePuppy />
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-mono font-medium border border-destructive/20">
            <span>ERROR 404</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Whoops!
          </h1>
          
          <p className="text-muted-foreground text-base leading-relaxed max-w-[400px] mx-auto">
            We can't seem to find that page. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-2">
          <Button asChild variant="default" size="lg" className="min-w-[160px] shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
            <Link href="/">
              <Home className="mr-2 size-4" />
              Back Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">
               Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
