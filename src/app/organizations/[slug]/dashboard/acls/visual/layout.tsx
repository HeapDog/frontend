"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ShieldCheck, Info, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VisualLayoutProps {
  children: React.ReactNode;
}

export default function VisualLayout({ children }: VisualLayoutProps) {
  const pathname = usePathname();
  const params = useParams();
  const slug = params?.slug as string;

  const tabs = [
    {
      name: "General Access Rules",
      href: `/organizations/${slug}/dashboard/acls/visual/general-access-rules`,
      icon: ShieldCheck,
    },
    {
      name: "Groups",
      href: `/organizations/${slug}/dashboard/acls/visual/groups`,
      icon: Users,
    },
  ];

  const isFormView = pathname.endsWith("/add") || pathname.includes("/general-access-rules/edit");

  if (isFormView) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header section: Simplified and professional */}
      <div className="flex flex-col gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground/90">Access Control</h1>
          <Badge variant="outline" className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground border-border/50">
            Visual Policy Editor
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs max-w-[620px] leading-relaxed">
          Manage access rules and user groups for your organization.
        </p>
      </div>

      {/* Tabs Layout: Minimalist, modern Capsule Tabs */}
      <div className="flex items-center justify-between border-b border-border/25 pb-4">
        <div className="bg-muted/40 p-0.5 rounded-lg border border-border/40 flex w-fit gap-0.5 select-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "inline-flex items-center justify-center h-7 px-3.5 gap-1.5 text-xs font-semibold rounded-md transition-all duration-200 ease-in-out select-none",
                  isActive
                    ? "bg-background text-foreground shadow-sm border border-border/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/15"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Workspace content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
