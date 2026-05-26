"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { User, Shield, Settings2 } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  profile: User,
  security: Shield,
  account: Settings2,
};

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: keyof typeof iconMap;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
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
                ? "text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              "h-10 px-3"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-sidebar-accent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ borderRadius: "calc(var(--radius) - 2px)" }}
              />
            )}

            <Icon className={cn("mr-3 h-4 w-4 z-10 transition-colors", isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="z-10 relative">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
