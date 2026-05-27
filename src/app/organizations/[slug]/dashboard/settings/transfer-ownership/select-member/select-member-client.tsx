"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, 
  Search, 
  Check, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

interface MemberItem {
  id: string; // userId
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface SelectMemberClientProps {
  slug: string;
  currentUserId: string;
}

export function SelectMemberClient({ slug, currentUserId }: SelectMemberClientProps) {
  const router = useRouter();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);

  // Fetch organization memberships on mount
  useEffect(() => {
    async function loadMembers() {
      setMembersLoading(true);
      try {
        const response = await fetch(`/api/organizations/${slug}/memberships?size=100`);
        const data = await response.json();
        if (response.ok && data.contents) {
          // Filter out the current owner so they cannot transfer to themselves
          const list = (data.contents as MemberItem[]).filter(
            (m) => m.id !== currentUserId
          );
          setMembers(list);
        } else {
          toast.error("Failed to load organization members");
        }
      } catch (e) {
        console.error("Error loading members:", e);
        toast.error("An error occurred while fetching members.");
      } finally {
        setMembersLoading(false);
      }
    }
    loadMembers();
  }, [slug, currentUserId]);

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    const username = m.username.toLowerCase();
    const email = m.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || username.includes(query) || email.includes(query);
  });

  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const getInitials = (m: MemberItem) => {
    if (m.firstName && m.lastName) {
      return (m.firstName[0] + m.lastName[0]).toUpperCase();
    }
    return m.username.substring(0, 2).toUpperCase();
  };

  const handleContinue = () => {
    if (!selectedMember) {
      toast.error("Please select a target member.");
      return;
    }
    setIsNavigating(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("heapdog-transfer-set-step", { detail: 2 }));
      window.dispatchEvent(new CustomEvent("heapdog-transfer-loading-step", { detail: 2 }));
    }
    startTransition(() => {
      router.push(`/organizations/${slug}/dashboard/settings/transfer-ownership/verify-identity?selectedMemberId=${selectedMember.id}`);
    });
  };

  if (isNavigating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col items-center justify-center p-12 bg-neutral-50/50 dark:bg-neutral-900/10 border border-border/40 rounded-3xl space-y-4.5 text-center min-h-[320px]"
      >
        <Spinner className="w-7 h-7 text-primary animate-spin" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground tracking-tight">Securing Transfer Session...</p>
          <p className="text-[10px] text-muted-foreground leading-normal max-w-[300px]">Preparing authentication configurations and loading security credentials.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Premium Apple Style Search */}
      <div className="space-y-2 select-none">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 pl-1">
          Select New Organization Owner
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-full border bg-neutral-50/50 dark:bg-neutral-950/20 border-border/70 pl-11 pr-5 py-3 text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/8 font-medium shadow-2xs"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>

      {/* Member List Selector */}
      <div className="border border-border/50 bg-background max-h-[300px] overflow-y-auto rounded-3xl scrollbar-thin shadow-2xs select-none">
        <div className="p-2 space-y-1">
          {membersLoading ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-3">
              <Spinner className="w-6 h-6 animate-spin text-primary" />
              <span className="text-[10.5px] font-medium text-muted-foreground">Retrieving organization roster...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-14 text-xs text-muted-foreground/75 leading-relaxed font-medium">
              {searchQuery ? "No members match your search phrase." : "No other verified members found in this organization."}
            </div>
          ) : (
            filteredMembers.map((m) => {
              const isSelected = selectedMember?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMember(m)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 ease-out text-left cursor-pointer border",
                    isSelected
                      ? "bg-primary/10 border-primary/20 text-foreground shadow-xs shadow-primary/5"
                      : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Visual Squircle Avatar */}
                    <Avatar className="size-9 rounded-xl border border-border/40 shrink-0 shadow-3xs">
                      <AvatarFallback className="bg-neutral-100 dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        {getInitials(m)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">
                        {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate mt-0.5">{m.email}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center size-5.5 rounded-full bg-primary text-primary-foreground shrink-0 shadow-xs shadow-primary/10"
                    >
                      <Check className="size-3.5 stroke-[2.5]" />
                    </motion.div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end pt-3">
        <Button
          type="button"
          disabled={!selectedMember || isPending}
          onClick={handleContinue}
          className="cursor-pointer font-semibold text-xs rounded-full px-5.5 h-9.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/10 active:scale-[0.98] transition-all duration-200 gap-1.5 flex items-center justify-center"
        >
          {isPending ? (
            <>
              <Spinner className="w-3.5 h-3.5 text-current animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
