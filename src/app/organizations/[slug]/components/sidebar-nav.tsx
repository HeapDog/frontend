"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Info, Users, Settings, Archive, ClipboardList, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  "basic-info": Info,
  members: Users,
  settings: Settings,
  "problem-archive": Archive,
  "online-assessment": ClipboardList,
  contest: Trophy,
};

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: keyof typeof iconMap;
  }[];
}

export function OrganizationSidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = iconMap[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "relative justify-start overflow-hidden transition-all duration-200 group",
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              "h-10 px-3"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-org-pill"
                className="absolute inset-0 bg-primary/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ borderRadius: "calc(var(--radius) - 2px)" }}
              />
            )}

            <Icon className={cn("mr-3 h-4 w-4 z-10 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="z-10 relative">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

