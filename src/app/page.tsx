"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Terminal as TerminalIcon, 
  Settings2, 
  CheckCircle2, 
  ChevronRight, 
  Send, 
  Activity, 
  Cpu, 
  Database, 
  Server, 
  ShieldCheck, 
  Bell, 
  Code2, 
  Swords, 
  Trophy, 
  Network,
  Sparkles,
  Command,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "redis" | "terminal">("terminal");
  
  // Terminal Emulator State
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: "input" | "output" | "error"; text: string }>>([
    { type: "output", text: "Welcome to HeapDog CLI v2.0.0-maintenance" },
    { type: "output", text: "Type 'help' to see available interactive diagnostic commands." },
    { type: "output", text: "" },
    { type: "input", text: "sys-init --verbose" },
    { type: "output", text: "[OK] heapdog-network initialized" },
    { type: "output", text: "[OK] Connected to redis://:heapdog@heapdog-redis:6379 (Redis 8.4.0-alpine)" },
    { type: "output", text: "[OK] Primary services listening on port 5050" },
    { type: "output", text: "System is in MAINTENANCE MODE. Database replication is 89% complete." }
  ]);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, activeTab]);

  // Live Telemetry Mock Values
  const [telemetry, setTelemetry] = useState({
    cpu: 24,
    ram: 42,
    redisMemory: "1.24MB",
    activeConnections: 0,
    progress: 89,
  });

  // Simulated server ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(10, Math.round(prev.cpu + (Math.random() * 8 - 4)))),
        ram: Math.min(100, Math.max(30, Math.round(prev.ram + (Math.random() * 2 - 1)))),
        activeConnections: Math.floor(Math.random() * 4) + 1
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCommandSubmit = (e?: React.FormEvent, customCmd?: string) => {
    if (e) e.preventDefault();
    const cmd = (customCmd || terminalInput).trim();
    if (!cmd) return;

    const newHistory = [...terminalHistory, { type: "input" as const, text: cmd }];
    const lowerCmd = cmd.toLowerCase();

    if (lowerCmd === "help") {
      newHistory.push({ type: "output", text: "Available Commands:" });
      newHistory.push({ type: "output", text: "  status   - Run structural health-checks on containers & networks" });
      newHistory.push({ type: "output", text: "  uptime   - Return current cluster session duration" });
      newHistory.push({ type: "output", text: "  redis    - Check local Redis cache node credentials and memory" });
      newHistory.push({ type: "output", text: "  ping     - Verify response delay from edge proxy" });
      newHistory.push({ type: "output", text: "  clear    - Flush diagnostic console buffer" });
    } else if (lowerCmd === "status") {
      newHistory.push({ type: "output", text: "🔍 Querying heapdog-network Docker bridge..." });
      setTimeout(() => {
        setTerminalHistory(prev => [
          ...prev,
          { type: "output", text: "🟢 [Container] heapdog-frontend:5050     - ONLINE" },
          { type: "output", text: "🟢 [Container] heapdog-redis:6379        - ONLINE (Redis 8.4.0-alpine)" },
          { type: "output", text: "🟢 [Network]   heapdog-network           - ISOLATED / INTERNAL" },
          { type: "output", text: "🟡 [Database]  postgres-replica-v16     - REPLICATING (89% complete)" }
        ]);
      }, 300);
    } else if (lowerCmd === "uptime") {
      newHistory.push({ type: "output", text: "Cluster Uptime: 4 days, 18 hours, 32 minutes, 11 seconds" });
    } else if (lowerCmd === "redis") {
      newHistory.push({ type: "output", text: "Connecting to redis://:heapdog@heapdog-redis:6379... authenticated." });
      newHistory.push({ type: "output", text: "  Version: 8.4.0-alpine" });
      newHistory.push({ type: "output", text: "  Mode: Standalone Cluster Node" });
      newHistory.push({ type: "output", text: `  Allocated RSS Memory: ${telemetry.redisMemory}` });
      newHistory.push({ type: "output", text: "  Maxclients Limit: 10000" });
      newHistory.push({ type: "output", text: "  Persistent Storage: AOF / RDB active" });
    } else if (lowerCmd === "ping") {
      newHistory.push({ type: "output", text: "64 bytes from local-edge-proxy: icmp_seq=1 ttl=64 time=0.084 ms" });
      newHistory.push({ type: "output", text: "64 bytes from local-edge-proxy: icmp_seq=2 ttl=64 time=0.076 ms" });
      newHistory.push({ type: "output", text: "--- edge-proxy ping statistics ---" });
      newHistory.push({ type: "output", text: "2 packets transmitted, 2 received, 0% packet loss, rtt min/avg/max = 0.076/0.080/0.084 ms" });
    } else if (lowerCmd === "clear") {
      setTerminalHistory([]);
      setTerminalInput("");
      return;
    } else {
      newHistory.push({ type: "error", text: `heapdog-cli: command not found: '${cmd}'. Type 'help' for options.` });
    }

    setTerminalHistory(newHistory);
    setTerminalInput("");
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    
    // Simulate API registration
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubscribed(true);
    toast.success("Notification request registered! We will let you know the second we go live.", {
      icon: <Sparkles className="text-primary size-5" />
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-start overflow-x-hidden bg-background py-12 px-4 select-none">
      
      {/* Decorative Blur Background Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      
      {/* Subtle Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Main Layout Container */}
      <div className="w-full max-w-6xl flex flex-col items-center relative z-10">
        
        {/* Status Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card/60 backdrop-blur-xs text-xs font-semibold text-primary shadow-xs border-primary/20 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          SYSTEM OPTIMIZATION IN PROGRESS (V2.0.0)
        </motion.div>

        {/* Hero Copy */}
        <div className="text-center max-w-3xl mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-primary to-violet-500 bg-clip-text text-transparent pb-3"
          >
            Crafting the Ultimate Coding Arena
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed font-medium px-4 mt-4"
          >
            HeapDog is currently undergoing scheduled maintenance. We are tuning our execution compiler, provisioning high-speed Redis cluster nodes, and preparing a brand new developer workflow.
          </motion.p>
        </div>

        {/* Interactive Dashboard Workspace Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card/45 border rounded-xl shadow-2xl p-2 sm:p-4 backdrop-blur-md border-border mb-12"
        >
          {/* Dashboard Left Sidebar Mockup */}
          <div className="lg:col-span-3 flex flex-col border-r border-border/60 pr-2 lg:pr-4 py-2 gap-4">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Command className="text-primary size-4" />
              </div>
              <span className="font-bold text-sm tracking-wide text-foreground">HeapDog Console</span>
            </div>
            
            <nav className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground/60 tracking-wider">
                MAIN MENU
              </div>
              <button disabled className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground/75 font-medium text-left cursor-not-allowed">
                <span className="flex items-center gap-2.5">
                  <Code2 className="size-4" /> Algorithms
                </span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md font-bold">Soon</span>
              </button>
              <button disabled className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground/75 font-medium text-left cursor-not-allowed">
                <span className="flex items-center gap-2.5">
                  <Swords className="size-4" /> Battle Arena
                </span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md font-bold">Soon</span>
              </button>
              <button disabled className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground/75 font-medium text-left cursor-not-allowed">
                <span className="flex items-center gap-2.5">
                  <Trophy className="size-4" /> Rankings
                </span>
              </button>

              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground/60 tracking-wider mt-4">
                ENVIRONMENT
              </div>
              <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-primary bg-primary/5 border border-primary/10 font-semibold text-left">
                <span className="flex items-center gap-2.5">
                  <Network className="size-4" /> Telemetry Node
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </nav>

            <div className="mt-auto border-t border-border/50 pt-4 px-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Cpu className="size-3" /> CPU Load</span>
                <span className="font-semibold text-foreground">{telemetry.cpu}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${telemetry.cpu}%` }} 
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Database className="size-3" /> RAM Pool</span>
                <span className="font-semibold text-foreground">{telemetry.ram}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-violet-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${telemetry.ram}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Central Workspace Terminal / Editor Tab Control */}
          <div className="lg:col-span-6 flex flex-col min-h-[380px] bg-muted/30 border rounded-lg border-border/80 overflow-hidden">
            {/* Window Tabs Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/80 bg-muted/60">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab("terminal")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeTab === "terminal" 
                      ? "bg-card text-foreground border shadow-xs" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TerminalIcon className="size-3.5 text-primary" /> diagnostic-cli
                </button>
                <button 
                  onClick={() => setActiveTab("code")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeTab === "code" 
                      ? "bg-card text-foreground border shadow-xs" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code2 className="size-3.5 text-violet-500" /> heap-check.ts
                </button>
                <button 
                  onClick={() => setActiveTab("redis")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeTab === "redis" 
                      ? "bg-card text-foreground border shadow-xs" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Database className="size-3.5 text-rose-500" /> redis-log
                </button>
              </div>
              
              {/* Window dots decoration */}
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto leading-relaxed select-text min-h-0 relative">
              <AnimatePresence mode="wait">
                {activeTab === "terminal" && (
                  <motion.div 
                    key="terminal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-full justify-between"
                  >
                    {/* Command History Scrollable Area */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pb-2">
                      {terminalHistory.map((item, idx) => (
                        <div key={idx} className="whitespace-pre-wrap">
                          {item.type === "input" ? (
                            <span className="text-primary font-bold font-mono">heapdog-cli ~ % <span className="text-foreground font-normal">{item.text}</span></span>
                          ) : item.type === "error" ? (
                            <span className="text-destructive font-semibold font-mono">{item.text}</span>
                          ) : (
                            <span className="text-muted-foreground/95 font-mono">{item.text}</span>
                          )}
                        </div>
                      ))}
                      <div ref={terminalBottomRef} />
                    </div>

                    {/* Interactive suggestions chips */}
                    <div className="border-t border-border/40 pt-3 mt-2 flex flex-wrap gap-1.5 items-center select-none">
                      <span className="text-[10px] text-muted-foreground/60 font-semibold mr-1 font-sans">Suggest:</span>
                      {["status", "redis", "ping", "uptime"].map((cmd) => (
                        <button
                          key={cmd}
                          onClick={() => handleCommandSubmit(undefined, cmd)}
                          className="px-2 py-0.5 rounded-md border text-[10px] font-semibold bg-card hover:bg-muted transition-all border-border text-foreground hover:border-primary/40 active:scale-95 font-mono"
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>

                    {/* Interactive Shell Input */}
                    <form onSubmit={handleCommandSubmit} className="flex items-center gap-1.5 border-t border-border/40 pt-2.5 mt-2">
                      <span className="text-primary font-bold shrink-0 font-mono">heapdog-cli ~ %</span>
                      <input 
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder="Type standard command (e.g. status, redis)..."
                        className="flex-1 bg-transparent text-foreground border-none outline-none focus:ring-0 p-0 text-xs font-mono placeholder:text-muted-foreground/30"
                      />
                    </form>
                  </motion.div>
                )}

                {activeTab === "code" && (
                  <motion.div 
                    key="code"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-muted-foreground/90 whitespace-pre-wrap font-mono"
                  >
                    <span className="text-violet-500">import</span> &#123; Heap &#125; <span className="text-violet-500 font-semibold">from</span> <span className="text-emerald-500">"@/lib/structures"</span>;<br />
                    <span className="text-violet-500">import</span> &#123; redis &#125; <span className="text-violet-500 font-semibold">from</span> <span className="text-emerald-500">"@/lib/redis"</span>;<br /><br />
                    
                    <span className="text-muted-foreground/45">// Verify memory efficiency & network state during cluster syncd</span><br />
                    <span className="text-violet-500">export async function</span> <span className="text-sky-500 font-semibold">verifyHeapIntegrity</span>(orgSlug: <span className="text-amber-500">string</span>) &#123;<br />
                    &nbsp;&nbsp;<span className="text-violet-500">const</span> stats = <span className="text-violet-500">await</span> redis.<span className="text-sky-500">hgetall</span>(<span className="text-emerald-500">`org:$&#123;orgSlug&#125;:metrics`</span>);<br />
                    &nbsp;&nbsp;<span className="text-violet-500">if</span> (!stats) &#123;<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-violet-500">throw new</span> <span className="text-amber-500">Error</span>(<span className="text-emerald-500">"Local Redis cluster state not synchronized"</span>);<br />
                    &nbsp;&nbsp;&#125;<br /><br />
                    
                    &nbsp;&nbsp;<span className="text-muted-foreground/45">// Rebuild min-heap elements dynamically</span><br />
                    &nbsp;&nbsp;<span className="text-violet-500">const</span> minHeap = <span className="text-violet-500">new</span> <span className="text-amber-500">Heap</span>&lt;<span className="text-amber-500">number</span>&gt;((a, b) =&gt; a - b);<br />
                    &nbsp;&nbsp;stats.nodes.<span className="text-sky-500">forEach</span>(val =&gt; minHeap.<span className="text-sky-500">insert</span>(val));<br /><br />
                    
                    &nbsp;&nbsp;<span className="text-violet-500">return</span> &#123;<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;healthy: <span className="text-emerald-500">true</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;rootNode: minHeap.<span className="text-sky-500">peek</span>(),<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;nodeSize: minHeap.<span className="text-sky-500">size</span>(),<br />
                    &nbsp;&nbsp;&#125;;<br />
                    &#125;
                  </motion.div>
                )}

                {activeTab === "redis" && (
                  <motion.div 
                    key="redis"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-muted-foreground/80 flex flex-col gap-1 font-mono"
                  >
                    <div><span className="text-muted-foreground/45">[2026-05-27T00:01:22.384Z]</span> <span className="text-emerald-500 font-bold">[INFO]</span> Initializing Redis instance...</div>
                    <div><span className="text-muted-foreground/45">[2026-05-27T00:01:22.410Z]</span> <span className="text-emerald-500 font-bold">[INFO]</span> Running alpine package setup: Redis Engine v8.4.0</div>
                    <div><span className="text-muted-foreground/45">[2026-05-27T00:01:22.450Z]</span> <span className="text-amber-500 font-bold">[WARN]</span> Overcommit_memory is set to 0! Background save may fail under high load.</div>
                    <div><span className="text-muted-foreground/45">[2026-05-27T00:01:22.465Z]</span> <span className="text-emerald-500 font-bold">[INFO]</span> Configured requirepass credentials... authenticated correctly.</div>
                    <div><span className="text-muted-foreground/45">[2026-05-27T00:01:22.480Z]</span> <span className="text-emerald-500 font-bold">[INFO]</span> TCP listening on port 6379, accepting external connections.</div>
                    <div><span className="text-muted-foreground/45">[2026-05-27T00:01:22.520Z]</span> <span className="text-emerald-500 font-bold">[INFO]</span> Network link established with service heapdog-frontend on bridge network heapdog-network.</div>
                    <div className="animate-pulse"><span className="text-muted-foreground/45">[2026-05-27T00:02:40.912Z]</span> <span className="text-sky-500 font-bold">[DEBUG]</span> Syncing keyspace: 4012 cached items synced...</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel Deployment Details */}
          <div className="lg:col-span-3 flex flex-col justify-between py-2 gap-4 lg:pl-2">
            
            {/* Status Checklist */}
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold text-muted-foreground/80 tracking-wider">UPGRADE LIST</div>
              
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-tight">Node 25 Upgrade</span>
                    <span className="text-[10px] text-muted-foreground/60">Alpine container stack updated</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-tight">Shared Network</span>
                    <span className="text-[10px] text-muted-foreground/60">Secured via heapdog-network</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-tight">Redis 8.4.0 Engine</span>
                    <span className="text-[10px] text-muted-foreground/60">Added cluster-caching with AUTH</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="relative flex h-4.5 w-4.5 shrink-0 mt-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">89%</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-tight">Database Migration</span>
                    <span className="text-[10px] text-muted-foreground/60">Restoring partition integrity</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Stats Telemetry Graph */}
            <div className="bg-muted/40 border border-border/80 rounded-lg p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/75 tracking-wider">LIVE REPLICATION DELAY</span>
                <Activity className="size-3.5 text-primary animate-pulse" />
              </div>
              
              {/* Dynamic SVG graphic representing replica lag */}
              <div className="h-16 w-full bg-card/65 rounded-md border border-border/50 overflow-hidden relative flex items-end">
                <svg className="w-full h-12 overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lagGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Fluctuating line based on cpu metrics */}
                  <path 
                    d={`M 0 40 Q 20 ${45 - (telemetry.cpu / 5)} 40 ${30 - (telemetry.cpu / 6)} T 80 ${42 - (telemetry.cpu / 4)} T 100 ${32 - (telemetry.cpu / 5)} L 100 50 L 0 50 Z`} 
                    fill="url(#lagGrad)"
                    className="transition-all duration-1000 ease-in-out"
                  />
                  <path 
                    d={`M 0 40 Q 20 ${45 - (telemetry.cpu / 5)} 40 ${30 - (telemetry.cpu / 6)} T 80 ${42 - (telemetry.cpu / 4)} T 100 ${32 - (telemetry.cpu / 5)}`} 
                    fill="none" 
                    stroke="var(--primary)" 
                    strokeWidth="1.5"
                    className="transition-all duration-1000 ease-in-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono text-foreground/80 font-bold">
                  Replica Lag: ~0.84ms
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subscribe Section / Coming Soon Notification signup */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl text-center bg-card/40 border border-border/80 backdrop-blur-md rounded-xl p-6 shadow-lg mb-8"
        >
          <h2 className="text-xl font-bold text-foreground mb-1.5 flex items-center justify-center gap-1.5">
            <Bell className="size-5 text-primary" /> Notify Me on Launch
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mb-5 leading-normal">
            Input your developer credentials to register for immediate push alerts as soon as database replication reaches 100% and nodes go live.
          </p>

          <AnimatePresence mode="wait">
            {!isSubscribed ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubscribe} 
                className="flex flex-col sm:flex-row gap-2"
              >
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="flex-1 px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-inner"
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg font-semibold bg-primary hover:bg-primary/95 text-primary-foreground transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 hover:shadow-primary/20 hover:shadow-lg disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? (
                    <>Registering Node...</>
                  ) : (
                    <>
                      Request Access <ArrowUpRight className="size-4" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="py-3 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck className="size-5 shrink-0" />
                Connection Established! Diagnostic system registered your webhook.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-xs text-muted-foreground/60 font-medium py-4 border-t border-border/40 w-full max-w-lg mt-8"
        >
          HeapDog Inc. &copy; 2026. All operations running securely via isolated virtual networks.
        </motion.div>
      </div>
    </div>
  );
}
