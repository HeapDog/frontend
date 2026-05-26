"use client";

import Link from "next/link";
import { Code2, Shield, Users, Settings, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const DIRECTORY_LINKS = [
  {
    name: "Problem Libraries",
    description: "Browse curated coding problems, test suites, and revisions.",
    href: "/organizations",
    icon: Code2,
    color: "text-emerald-500 bg-emerald-500/10"
  },
  {
    name: "Access Control Workspace",
    description: "Inspect active grant policies, custom groups, and rules.",
    href: "/organizations",
    icon: Shield,
    color: "text-violet-500 bg-violet-500/10"
  },
  {
    name: "Organization Members",
    description: "Manage membership rosters, roles, and open invitations.",
    href: "/organizations",
    icon: Users,
    color: "text-blue-500 bg-blue-500/10"
  },
  {
    name: "Account Settings",
    description: "Customize your developer profile, billing, and security.",
    href: "/settings",
    icon: Settings,
    color: "text-amber-500 bg-amber-500/10"
  }
];

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background text-foreground px-4 py-12 relative overflow-hidden select-none">
      
      {/* Exquisite, ultra-subtle ambient background glow */}
      <div 
        className="absolute inset-0 -z-10 h-full w-full opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 65%)',
        }}
      />

      <div className="relative flex flex-col items-center space-y-12 max-w-2xl mx-auto text-center z-10 w-full">
        
        {/* Core Heading Block */}
        <div className="space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground animate-in fade-in slide-in-from-top-4 duration-700"
          >
            The page you’re looking for can’t be found.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="text-muted-foreground text-sm max-w-md mx-auto"
          >
            It might have been relocated, or the URL vector is misaligned. Navigate directly via one of our core indexes below.
          </motion.p>
        </div>

        {/* Apple-style Interactive Search Input */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-md w-full flex items-center bg-zinc-500/5 dark:bg-zinc-800/10 border border-zinc-200 dark:border-zinc-800 rounded-full px-5 py-3 text-sm focus-within:ring-2 focus-within:ring-violet-500/40 focus-within:border-violet-500/60 transition-all duration-300 group"
        >
          <Search className="w-4 h-4 text-muted-foreground mr-3 group-focus-within:text-violet-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search resources, directories, policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-0 outline-0 p-0 w-full text-foreground placeholder:text-muted-foreground focus:ring-0 text-sm"
          />
        </motion.div>

        {/* Premium Directory Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left"
        >
          {DIRECTORY_LINKS.map((link, idx) => {
            const Icon = link.icon;
            return (
              <Link 
                key={idx} 
                href={link.href}
                className="group border border-zinc-250 dark:border-zinc-800/80 bg-zinc-500/5 dark:bg-zinc-900/45 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-305 p-6 rounded-2xl flex items-start gap-4 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
              >
                <div className={`p-3 rounded-xl flex items-center justify-center flex-shrink-0 ${link.color} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground text-sm tracking-tight">
                    <span>{link.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-violet-500" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </motion.div>

        {/* Global Action Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-4 border-t border-zinc-150 dark:border-zinc-800/40"
        >
          <Link 
            href="/" 
            className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80 px-8 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-md shadow-foreground/5 text-center"
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/contact" 
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground px-6 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors duration-300 text-center"
          >
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

