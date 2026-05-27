"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { useTopLoader } from "nextjs-toploader";
import { useMyPermissions } from "@/hooks/use-my-permissions";
import {
  Archive,
  Bell,
  ClipboardList,
  CreditCard,
  Globe,
  LayoutDashboard,
  Mail,
  PlusCircle,
  Search,
  TriangleAlert,
  Trophy,
  User,
  Users,
  PlugZap,
  ShieldCheck,
  FolderKanban,
  FileJson,
} from "lucide-react";

interface QuickActionSearchProps {
  slug: string;
}

interface QuickActionItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  hotkey?: string[];
}

export function QuickActionSearch({ slug }: QuickActionSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const topLoader = useTopLoader();
  const { check } = useMyPermissions(slug);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        const active = document.activeElement as HTMLElement | null;
        const inStatementEditor = active?.closest?.("[data-statement-editor]");
        if (inStatementEditor) return;
        event.preventDefault();
        setOpen((prev) => !prev);
        setShowHotkeys(false);
        return;
      }

      if (!isTyping && event.key === "?") {
        event.preventDefault();
        setOpen(true);
        setShowHotkeys(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const actions = useMemo(
    () => {
      const baseActions = [
        {
          group: "Overview",
          items: [
            {
              label: "Basic info",
              icon: LayoutDashboard,
              href: `/organizations/${slug}/dashboard/basic-info`,
              hotkey: ["g", "h"],
            },
            {
              label: "Members",
              icon: Users,
              href: `/organizations/${slug}/dashboard/members`,
              hotkey: ["g", "m"],
            },
            {
              label: "Invitations",
              icon: Mail,
              href: `/organizations/${slug}/dashboard/members/invitations`,
              hotkey: ["g", "i"],
            },
          ],
        },
        ...(check("acl:read") ? [
          {
            group: "Access Control",
            items: [
              {
                label: "Access rules (visual)",
                icon: ShieldCheck,
                href: `/organizations/${slug}/dashboard/acls/visual/general-access-rules`,
                hotkey: ["a", "r"],
              },
              {
                label: "Access groups",
                icon: FolderKanban,
                href: `/organizations/${slug}/dashboard/acls/visual/groups`,
                hotkey: ["a", "g"],
              },
              {
                label: "Policy file editor (raw JSON)",
                icon: FileJson,
                href: `/organizations/${slug}/dashboard/acls/file`,
                hotkey: ["a", "f"],
              },
            ],
          }
        ] : []),
        {
          group: "Problems",
          items: [
            {
              label: "New problem",
              icon: PlusCircle,
              href: `/organizations/${slug}/dashboard/problems/new`,
              hotkey: ["c", "p"],
            },
            {
              label: "Problem library",
              icon: Archive,
              href: `/organizations/${slug}/dashboard/problems`,
              hotkey: ["g", "p"],
            },
          ],
        },
        {
          group: "Settings",
          items: [
            ...(check("domain:read") ? [{
              label: "Website verification",
              icon: Globe,
              href: `/organizations/${slug}/dashboard/settings/website-verification`,
              hotkey: ["g", "v"],
            }] : []),
            {
              label: "Integrations",
              icon: PlugZap,
              href: `/organizations/${slug}/dashboard/settings/integrations`,
              hotkey: ["g", "x"],
            },
            {
              label: "Billing",
              icon: CreditCard,
              href: `/organizations/${slug}/dashboard/settings/billing`,
              hotkey: ["g", "b"],
            },
            ...(check("lifecycle:manage") ? [{
              label: "Danger zone",
              icon: TriangleAlert,
              href: `/organizations/${slug}/dashboard/settings/danger-zone`,
              hotkey: ["g", "z"],
            }] : []),
          ],
        },
        {
          group: "Other",
          items: [
            {
              label: "Online assessment",
              icon: ClipboardList,
              href: `/organizations/${slug}/dashboard/online-assessment`,
              hotkey: ["g", "o"],
            },
            {
              label: "Contest",
              icon: Trophy,
              href: `/organizations/${slug}/dashboard/contest`,
              hotkey: ["g", "c"],
            },
          ],
        },
      ];
      return baseActions;
    },
    [slug, check]
  );

  const getShortcutLabel = (hotkey?: string[]) => {
    if (!hotkey) return "";
    return hotkey.join(" ").toUpperCase();
  };

  const handleSelect = (href: string) => {
    setOpen(false);
    topLoader.start();
    router.push(href);
  };

  useEffect(() => {
    let lastKeyTime = 0;
    let lastKey: string | null = null;

    const handleHotkeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTyping) return;
      if (event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      const now = Date.now();

      if (now - lastKeyTime > 1000) {
        lastKey = null;
      }

      if (!lastKey) {
        const startsChord = actions.some((section) =>
          section.items.some((item) => item.hotkey && item.hotkey[0] === key)
        );
        if (startsChord) {
          lastKey = key;
          lastKeyTime = now;
        }
        return;
      }

      const flatItems = actions.flatMap(
        (section) => section.items as QuickActionItem[]
      );
      const match = flatItems.find(
        (item) =>
          item.hotkey && item.hotkey[0] === lastKey && item.hotkey[1] === key
      );

      if (match) {
        event.preventDefault();
        handleSelect(match.href);
        lastKey = null;
      } else {
        // If the second key doesn't match, check if it starts a new chord
        const startsChord = actions.some((section) =>
            section.items.some((item) => item.hotkey && item.hotkey[0] === key)
        );
        if (startsChord) {
            lastKey = key;
            lastKeyTime = now;
        } else {
            lastKey = null;
        }
      }
    };
    window.addEventListener("keydown", handleHotkeys);
    return () => window.removeEventListener("keydown", handleHotkeys);
  }, [actions]);

  useEffect(() => {
    if (!open) return;
    const handleHotkeyHelp = (event: KeyboardEvent) => {
      if (event.key === "?") {
        event.preventDefault();
        setShowHotkeys((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleHotkeyHelp);
    return () => window.removeEventListener("keydown", handleHotkeyHelp);
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-2 rounded-full px-3 text-xs text-muted-foreground"
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        Quick actions
        <span className="ml-2 rounded-md border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </span>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setShowHotkeys(false);
        }}
        className="sm:max-w-[640px]"
      >
        <CommandInput
          placeholder={
            showHotkeys
              ? "Search actions, pages, or settings…"
              : "Search actions, pages, or settings… (press ? for hotkeys)"
          }
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {actions.map((section, index) => (
            <div key={section.group}>
              <CommandGroup heading={section.group}>
                {section.items.map((item) => (
                  <CommandItem
                    key={item.label}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.hotkey && (
                      <CommandShortcut>
                        {getShortcutLabel(item.hotkey)}
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {index < actions.length - 1 && <CommandSeparator />}
            </div>
          ))}
        </CommandList>
        {showHotkeys && (
          <div className="border-t px-3 py-3 text-xs">
            <div className="mb-2 flex items-center justify-between text-muted-foreground">
              <span className="font-medium text-foreground">Hotkeys</span>
              <Kbd>?</Kbd>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {actions.flatMap((section) =>
                section.items
                  .filter((item) => item.hotkey)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <div className="flex gap-1">
                        {item.hotkey?.map((key) => (
                          <Kbd key={key}>{key.toUpperCase()}</Kbd>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </CommandDialog>
    </>
  );
}
