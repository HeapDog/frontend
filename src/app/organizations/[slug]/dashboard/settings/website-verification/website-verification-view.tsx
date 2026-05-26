"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SafeLink } from "@/components/safe-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { OrganizationWebsiteVerification } from "@/lib/types/organization";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Globe,
  RefreshCw,
  ShieldCheck,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useMyPermissions } from "@/hooks/use-my-permissions";
import { ErrorView } from "@/components/error-view";

interface WebsiteVerificationViewProps {
  slug: string;
  website: OrganizationWebsiteVerification | null;
  showMissingWebsite: boolean;
}

type VerificationStatus = "not_started" | "pending" | "verified" | "failed";

const getStatus = (verification: OrganizationWebsiteVerification | null): VerificationStatus => {
  if (!verification?.verificationCode) return "not_started";
  if (verification.status === "VERIFIED") return "verified";
  if (verification.status === "FAILED" || verification.status === "EXPIRED") return "failed";
  return "pending";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const getHostname = (address?: string | null) => {
  if (!address) return "";
  try {
    return new URL(address).hostname || address;
  } catch {
    return address;
  }
};

export function WebsiteVerificationView({
  slug,
  website,
  showMissingWebsite,
}: WebsiteVerificationViewProps) {
  const { check, isLoading } = useMyPermissions(slug);
  const canRead = check("domain:read");
  const canWrite = check("domain:write");

  const [isStarting, setIsStarting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVerifyingNow, setIsVerifyingNow] = useState(false);
  const [verification, setVerification] = useState<OrganizationWebsiteVerification | null>(website);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true); // Default open for premium visual timeline feedback

  const hostname = useMemo(() => getHostname(verification?.address), [verification?.address]);
  const status = getStatus(verification);
  const verificationCode = verification?.verificationCode;
  const dnsHost = "_heapdog";
  const dnsValue = verificationCode ? `heapdog-verification=${verificationCode}` : "";
  const fullDnsHostname = hostname ? `_heapdog.${hostname}` : "_heapdog.example.com";

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canRead) {
    return (
      <ErrorView
        error={{
          status: 403,
          message: "You do not have permission to access domain verification settings.",
          timestamp: new Date().toISOString(),
          error: "Forbidden",
          code: "ACCESS_DENIED",
          details: null,
          path: `/organizations/${slug}/dashboard/settings/website-verification`
        }}
      />
    );
  }

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleStartVerification = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const response = await fetch(
        `/api/organizations/${slug}/website/verification/generate-dns-record`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to start verification.");
      setVerification(data?.data ?? data);
      toast.success("DNS record generated. Add it to your DNS provider.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start verification.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/organizations/${slug}/website`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to refresh status.");
      setVerification(data?.data ?? data);
      toast.success("Status refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh status.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVerifyNow = async () => {
    if (isVerifyingNow) return;
    setIsVerifyingNow(true);
    try {
      const response = await fetch(`/api/organizations/${slug}/website/verification/start`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Verification check failed.");
      toast.success(data?.data?.message || "Verification check triggered.");
      
      // Refresh to get updated status
      const refreshRes = await fetch(`/api/organizations/${slug}/website`);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) setVerification(refreshData?.data ?? refreshData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification check failed.");
    } finally {
      setIsVerifyingNow(false);
    }
  };

  // Empty state: No website configured
  if (showMissingWebsite) {
    return (
      <Card className="max-w-2xl mx-auto border-border/40 bg-card/60 backdrop-blur-md shadow-md dark:shadow-none transition-all duration-300">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            <Globe className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="mt-6 text-lg font-bold tracking-tight">Activate Domain Verification</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Verify domain ownership to display a verified badge on your organization profile.
          </p>
          {canWrite ? (
            <Button 
              className="mt-6 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-tight rounded-full px-5 h-9.5 active:scale-[0.98] transition-all duration-200" 
              asChild
            >
              <Link href={`/organizations/${slug}/dashboard/basic-info?mode=update&highlight=website`}>
                Add your website
                <ArrowRight className="ml-1.5 h-4 w-4 text-current" />
              </Link>
            </Button>
          ) : (
            <p className="mt-6 text-xs font-semibold text-destructive dark:text-red-400 bg-destructive/5 dark:bg-red-500/5 px-3.5 py-2.5 rounded-lg border border-destructive/10 dark:border-red-500/10 inline-flex items-center gap-1.5 shadow-sm max-w-sm select-none">
              <AlertTriangle className="h-4 w-4 text-destructive dark:text-red-400 shrink-0" />
              You lack sufficient permissions to initiate domain verification.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Error state: Failed to load
  if (!verification) {
    return (
      <Card className="max-w-2xl mx-auto border-border/40 bg-card/60 backdrop-blur-md shadow-md dark:shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/15">
            <XCircle className="h-7 w-7 stroke-[1.5]" />
          </div>
          <h3 className="mt-6 text-lg font-bold tracking-tight">Failed to load details</h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
            We couldn't retrieve the website verification data. Please try again.
          </p>
          <Button 
            variant="outline" 
            className="mt-6 cursor-pointer font-medium text-sm tracking-tight rounded-full px-5 h-9.5 active:scale-[0.98] transition-all duration-200" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto border-border/40 bg-card/60 backdrop-blur-md shadow-md dark:shadow-none p-2 sm:p-4 rounded-xl transition-all duration-300">
      {/* Header */}
      <CardHeader className="pb-6 pt-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 select-none">
              Domain
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <SafeLink
                href={verification.address || "#"}
                target="_blank"
                className="text-xl font-bold tracking-tight text-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                {hostname || verification.address}
                <ExternalLink className="h-4 w-4 text-muted-foreground/40 shrink-0 stroke-[1.5]" />
              </SafeLink>
            </div>
          </div>
          
          {/* Status indicator with glowing animation */}
          <div className="flex shrink-0">
            {status === "verified" && (
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Verified Domain
              </div>
            )}
            {status === "pending" && (
              <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 shadow-sm select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Pending Verification
              </div>
            )}
            {status === "failed" && (
              <div className="flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 shadow-sm select-none">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                Verification Failed
              </div>
            )}
            {status === "not_started" && (
              <div className="flex items-center gap-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-400"></span>
                Not Started
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
        {/* Verified Banner */}
        {status === "verified" && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4.5 transition-all duration-200">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5.5 w-5.5 stroke-[1.5]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                  Domain verification complete
                </h4>
                <p className="mt-1 text-xs text-emerald-700/95 dark:text-emerald-400/80 leading-relaxed">
                  Your website domain has been verified successfully. Your organization now displays a verified badge on your profile.
                </p>
                {verification.verifiedAt && (
                  <div className="mt-3 text-[10px] font-semibold tracking-wide uppercase text-emerald-600 dark:text-emerald-400/60 bg-emerald-500/10 inline-block px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Active since {formatDateTime(verification.verifiedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Not Started State */}
        {status === "not_started" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-900/35 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 shrink-0">
                  <ShieldCheck className="h-5.5 w-5.5 stroke-[1.5]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-foreground">Prove domain ownership</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Verify authority over your website by adding a TXT DNS record inside your domain settings.
                  </p>
                </div>
              </div>
            </div>
            {canWrite ? (
              <Button 
                onClick={handleStartVerification} 
                disabled={isStarting} 
                className="w-full sm:w-auto cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full px-5 h-9.5 active:scale-[0.98] transition-all duration-200"
              >
                {isStarting ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4.5 w-4.5 stroke-[2]" />
                )}
                Generate Verification Record
              </Button>
            ) : (
              <p className="text-xs font-semibold text-destructive dark:text-red-400 bg-destructive/5 dark:bg-red-500/5 px-3.5 py-2.5 rounded-lg border border-destructive/10 dark:border-red-500/10 inline-flex items-center gap-1.5 shadow-sm select-none">
                <AlertTriangle className="h-4 w-4 text-destructive dark:text-red-400 shrink-0" />
                You lack sufficient permissions to initiate domain verification.
              </p>
            )}
          </div>
        )}

        {/* Pending or Failed State - Show DNS record */}
        {(status === "pending" || status === "failed") && verificationCode && (
          <div className="space-y-5">
            {/* Failed Alert Banner */}
            {status === "failed" && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 shrink-0">
                    <AlertTriangle className="h-5 w-5 stroke-[1.5]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-900 dark:text-rose-400 text-sm">DNS Discovery Failed</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Our automated crawler could not locate the TXT DNS token at <span className="font-mono bg-rose-500/5 px-1 rounded text-rose-700 dark:text-rose-300">{dnsHost}</span>. Ensure the record is properly deployed in your registrar panel and TTL has propagated.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DNS Board Table */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Required DNS Records
                </h4>
                <span className="text-[10px] text-muted-foreground font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-border/30">
                  TXT Type Only
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/50 bg-neutral-50/40 dark:bg-neutral-900/40 backdrop-blur-sm shadow-inner">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-border/50 bg-neutral-100/50 dark:bg-neutral-800/30 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">Host / Name</div>
                  <div className="col-span-5">Value / Token</div>
                  <div className="col-span-2 text-right">TTL</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border/40">
                  {/* TXT Record Row */}
                  <div className="grid grid-cols-12 gap-3 sm:gap-4 px-5 py-4.5 items-center hover:bg-neutral-100/30 dark:hover:bg-neutral-800/10 transition-colors">
                    {/* Record Type */}
                    <div className="col-span-12 sm:col-span-2 flex sm:block justify-between items-center">
                      <span className="sm:hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</span>
                      <span className="font-mono text-[10px] font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-750 select-none">
                        TXT
                      </span>
                    </div>

                    {/* Record Host */}
                    <div className="col-span-12 sm:col-span-3 flex sm:block justify-between items-center min-w-0">
                      <span className="sm:hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground">Host</span>
                      <div className="flex items-center gap-1.5 min-w-0 select-all">
                        <span className="font-mono text-sm font-semibold text-foreground truncate">{dnsHost}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(dnsHost, "host")}
                          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                        >
                          {copiedField === "host" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Record Value */}
                    <div className="col-span-12 sm:col-span-5 flex sm:block justify-between items-center min-w-0">
                      <span className="sm:hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value</span>
                      <div className="flex items-center gap-1.5 min-w-0 select-all justify-end sm:justify-start w-full sm:w-auto">
                        <span className="font-mono text-xs truncate max-w-[200px] sm:max-w-none text-foreground bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded border border-border/30">
                          {dnsValue}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(dnsValue, "value")}
                          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                        >
                          {copiedField === "value" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* TTL */}
                    <div className="col-span-12 sm:col-span-2 flex sm:block justify-between items-center text-right">
                      <span className="sm:hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground">TTL</span>
                      <span className="font-mono text-sm font-medium text-foreground">
                        300 <span className="text-[10px] text-muted-foreground">(5m)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground leading-relaxed flex items-center gap-1.5 px-1 select-none">
                <Globe className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                Your provider might automatically append your domain name. Full record host will resolve to: <span className="font-mono font-semibold text-foreground">{fullDnsHostname}</span>
              </div>
            </div>

            {/* Actions & Help Details */}
            {canWrite ? (
              <div className="rounded-xl border border-border/40 bg-neutral-50/20 p-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                    {status === "pending"
                      ? "DNS token records can take up to 48 hours to globally propagate across root servers."
                      : "Review DNS values in your domain registrar, then trigger an immediate manual check."}
                  </div>
                  
                  <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                    <Button
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="cursor-pointer text-xs font-medium rounded-full px-4 h-8.5 transition-all duration-200 ease-in-out active:scale-[0.98] border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    >
                      {isRefreshing ? (
                        <Spinner className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Sync State
                    </Button>
                    <Button 
                      onClick={handleVerifyNow} 
                      disabled={isVerifyingNow}
                      className="cursor-pointer text-xs font-medium rounded-full px-4 h-8.5 transition-all duration-200 ease-in-out active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isVerifyingNow ? (
                        <Spinner className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                      )}
                      Verify Now
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 bg-neutral-50/20 p-5">
                <p className="text-xs font-semibold text-destructive dark:text-red-400 bg-destructive/5 dark:bg-red-500/5 px-3.5 py-2.5 rounded-lg border border-destructive/10 dark:border-red-500/10 inline-flex items-center gap-1.5 shadow-sm select-none">
                  <AlertTriangle className="h-4 w-4 text-destructive dark:text-red-400 shrink-0" />
                  You lack sufficient permissions to initiate domain verification checks.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Verification Timeline - Collapsible */}
        {verification && (status === "pending" || status === "failed" || status === "verified") && (
          <Collapsible open={showTimeline} onOpenChange={setShowTimeline} className="border border-border/50 rounded-xl overflow-hidden bg-neutral-50/20 dark:bg-neutral-900/10">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-100/30 dark:hover:bg-neutral-800/10"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-neutral-500 dark:text-neutral-400" />
                  <span className="text-sm font-bold tracking-tight">Active Crawler Progress</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground/60 transition-transform duration-200",
                    showTimeline && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-border/40 px-5 py-5.5">
              {/* Vertical Graphical Stepper */}
              <div className="pl-2 space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-border/60">
                
                {/* Step 1: Record Generated */}
                <div className="relative pl-8 flex items-start gap-4">
                  <div className="absolute left-0 top-0.5 size-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 z-10 shrink-0">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-foreground">TXT Record Generated</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      DNS verification token has been successfully generated for your domain.
                    </p>
                    <span className="inline-block mt-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 select-none">
                      Token Ready
                    </span>
                  </div>
                </div>

                {/* Step 2: DNS Propagation Crawler */}
                <div className="relative pl-8 flex items-start gap-4">
                  <div className={cn(
                    "absolute left-0 top-0.5 size-6 rounded-full border flex items-center justify-center z-10 shrink-0",
                    status === "verified" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
                    status === "pending" && "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse",
                    status === "failed" && "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                  )}>
                    {status === "verified" ? (
                      <Check className="size-3.5 stroke-[3]" />
                    ) : status === "failed" ? (
                      <AlertTriangle className="size-3.5" />
                    ) : (
                      <RefreshCw className="size-3 animate-spin text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-foreground">DNS Propagation check</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Heapdog's automated crawler regularly scans the root name servers to detect your TXT record.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 select-none">
                      {verification.lastCheckedAt && (
                        <span className="text-[9px] text-muted-foreground font-semibold bg-muted/80 px-1.5 py-0.5 rounded border border-border/30">
                          Last scanned: {formatDateTime(verification.lastCheckedAt)}
                        </span>
                      )}
                      {verification.nextCheckAt && status === "pending" && (
                        <span className="text-[9px] text-neutral-600 dark:text-neutral-400 font-medium bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                          Next scan: {formatDateTime(verification.nextCheckAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3: Verified Badge Active */}
                <div className="relative pl-8 flex items-start gap-4">
                  <div className={cn(
                    "absolute left-0 top-0.5 size-6 rounded-full border flex items-center justify-center z-10 shrink-0",
                    status === "verified" 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "bg-neutral-100 dark:bg-neutral-800 border-border/50 text-muted-foreground/60"
                  )}>
                    <ShieldCheck className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-foreground">Verification complete</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Domain verified and badge activated.
                    </p>
                    {verification.verifiedAt && status === "verified" && (
                      <span className="inline-block mt-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 select-none">
                        Activated: {formatDateTime(verification.verifiedAt)}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
