"use client";

import { AlertCircle, Ban, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiErrorResponse } from "@/lib/types/api";

interface ErrorViewProps {
  error?: ApiErrorResponse | Error | string;
  title?: string;
  message?: string;
  retryLink?: string; // If provided, shows a link to reload
  onRetry?: () => void; // If provided, shows a button with onClick
}

export function ErrorView({ error, title, message, retryLink, onRetry }: ErrorViewProps) {
  let displayTitle = title || "Something went wrong";
  let displayMessage = message || "An unexpected error occurred.";
  let Icon = WifiOff;
  let iconColor = "text-red-500";
  let bgClass = "bg-red-100 dark:bg-red-900/20";

  // Parse error if provided
  if (error) {
    if (typeof error === 'string') {
        displayMessage = error;
    } else if ('status' in error && error.status === 403) {
        displayTitle = "Access Denied";
        displayMessage = error.message || "You do not have permission to access this resource.";
        Icon = Ban;
        iconColor = "text-orange-500";
        bgClass = "bg-orange-100 dark:bg-orange-900/20";
    } else if ('message' in error) {
        displayMessage = error.message;
    }
  }

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative">
        <div className={`absolute -inset-1 rounded-full blur-sm ${bgClass}`}></div>
        <div className="relative rounded-full bg-background p-4 shadow-sm border">
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </div>
      <div className="max-w-md space-y-2">
        <h3 className="text-xl font-semibold tracking-tight">{displayTitle}</h3>
        <p className="text-muted-foreground whitespace-pre-wrap">
          {displayMessage}
        </p>
      </div>
      
      {(retryLink || onRetry) && (
        <div className="flex gap-2">
            {retryLink && (
                 <Button variant="outline" className="gap-2" asChild>
                    <a href={retryLink}>
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </a>
                 </Button>
            )}
            
            {onRetry && (
                <Button variant="outline" className="gap-2" onClick={onRetry}>
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
            )}
        </div>
      )}
    </div>
  );
}

