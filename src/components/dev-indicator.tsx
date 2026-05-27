"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Terminal, Copy, Check, Cpu, HardDrive } from "lucide-react";
import { motion } from "framer-motion";

export default function DevIndicator() {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Read the env variables
    const appEnv = process.env.NEXT_PUBLIC_APP_ENV || "development";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "Not configured";
    const sseServer = process.env.NEXT_PUBLIC_SSE_SERVER || "Not configured";

    // If environment is explicitly set to production, do not show the indicator
    if (appEnv === "production") {
        return null;
    }

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05, translateY: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold backdrop-blur-md shadow-lg shadow-amber-500/5 cursor-pointer select-none transition-colors group focus:outline-hidden"
                    title="Developer Diagnostics"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <Terminal className="size-3.5 group-hover:rotate-6 transition-transform" />
                    <span>Dev Build</span>
                </motion.button>
            </PopoverTrigger>

            <PopoverContent 
                align="end" 
                side="top" 
                sideOffset={10} 
                className="w-80 p-4 bg-background/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl z-[9999] overflow-hidden"
            >
                {/* Visual glow background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative space-y-3">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                        <Cpu className="size-4 text-amber-500" />
                        <div>
                            <h4 className="font-semibold text-sm tracking-wide text-foreground">Heapdog Diagnostics</h4>
                            <p className="text-[10px] text-muted-foreground font-medium">Developer Mode Active</p>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {/* Environment Item */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Environment</span>
                            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-muted/65 border border-border/50">
                                <span className="font-mono text-xs text-foreground font-semibold">{appEnv}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Base URL Item */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Base API URL</span>
                            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-muted/65 border border-border/50">
                                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]" title={baseUrl}>
                                    {baseUrl}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(baseUrl, "baseUrl")}
                                    className="p-1 rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    title="Copy Base API URL"
                                >
                                    {copiedKey === "baseUrl" ? (
                                        <Check className="size-3.5 text-success" />
                                    ) : (
                                        <Copy className="size-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* SSE Server Item */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">SSE Server</span>
                            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-muted/65 border border-border/50">
                                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]" title={sseServer}>
                                    {sseServer}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(sseServer, "sseServer")}
                                    className="p-1 rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    title="Copy SSE Server URL"
                                >
                                    {copiedKey === "sseServer" ? (
                                        <Check className="size-3.5 text-success" />
                                    ) : (
                                        <Copy className="size-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-1.5 flex items-center justify-between text-[9px] text-muted-foreground border-t border-border/60">
                        <span className="flex items-center gap-1">
                            <HardDrive className="size-3" />
                            Client Mode
                        </span>
                        <span>v0.1.0</span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
