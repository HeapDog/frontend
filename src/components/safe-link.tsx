"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink as ExternalLinkIcon, ShieldAlert, Ban, SquareArrowOutUpRight } from "lucide-react";

interface SafeLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  children: React.ReactNode;
  showExternalIcon?: boolean;
}

export function SafeLink({
  children,
  href,
  onClick,
  showExternalIcon = false,
  target,
  ...props
}: SafeLinkProps) {
  const [showWarning, setShowWarning] = React.useState(false);
  const [targetHref, setTargetHref] = React.useState<string>("");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isExternal = (url: string) => {
    if (typeof url !== "string") return false;
    if (url.startsWith("/")) return false;
    if (url.startsWith("#")) return false;
    if (url.startsWith("mailto:")) return false;
    if (url.startsWith("tel:")) return false;

    try {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const targetUrl = new URL(url, currentOrigin);
      return targetUrl.origin !== currentOrigin;
    } catch (e) {
      return false;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const urlString = typeof href === "object" ? href.href : href;
    
    if (!urlString) {
      if (onClick) onClick(e);
      return;
    }

    if (isExternal(urlString)) {
      e.preventDefault();
      setTargetHref(urlString);
      setShowWarning(true);
    }

    if (onClick) {
      onClick(e);
    }
  };

  const handleConfirm = () => {
    if (targetHref) {
      window.open(targetHref, target || "_blank", target === "_blank" ? "noopener,noreferrer" : undefined);
    }
    setShowWarning(false);
  };

  return (
    <>
      <Link href={href} onClick={handleClick} target={target} {...props}>
        {children}
        {isMounted &&
          showExternalIcon &&
          isExternal(typeof href === "object" ? href.href || "" : href) && (
          <ExternalLinkIcon className="ml-1 inline-block h-3 w-3" />
        )}
      </Link>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <DialogTitle className="text-center">You are leaving HeapDog</DialogTitle>
            <DialogDescription className="text-center">
              This link will take you to an external website.
            </DialogDescription>
            <div className="mt-3 rounded-md bg-muted p-2 text-xs font-mono text-foreground break-all">
              {targetHref}
            </div>
            <div className="mt-3 text-sm text-muted-foreground text-center">
              We are not responsible for the content or security of external sites.
            </div>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => setShowWarning(false)}>
              <Ban className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="w-full sm:w-auto gap-2">
              Continue to site
              <SquareArrowOutUpRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
