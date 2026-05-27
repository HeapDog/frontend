"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy, Code2, Swords, Sun, Moon, LogIn, LogOut, User as UserIcon, SettingsIcon, Building2, Plus, ChevronDown, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { User, UserOrganization, NotificationResponse, UnreadCountResponse } from "@/lib/types";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuArrow,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavbarProps {
  user: User | null;
  organizations: UserOrganization[];
  initialNotifications: NotificationResponse | null;
  unreadCount: UnreadCountResponse;
}

const getOrgGradient = (name: string) => {
  const colors = [
    "from-pink-500 to-rose-500",
    "from-purple-600 to-indigo-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-violet-600 to-fuchsia-600",
    "from-sky-400 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Helper to calculate target path in new organization
function getNewOrgPath(currentPath: string, newSlug: string): string {
  const parts = currentPath.split("/");
  if (parts[1] !== "organizations" || !parts[2]) {
    return "/organizations";
  }

  // If the path is a deep path under libraries (like a specific libraryId),
  // fall back to /organizations/[newSlug]/dashboard/problems
  if (parts.includes("libraries")) {
    return `/organizations/${newSlug}/dashboard/problems`;
  }

  // Otherwise, just replace the slug part
  parts[2] = newSlug;
  return parts.join("/");
}

const getOrgInitials = (name: string) => {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const useThemeTransition = () => {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    
    if (!(document as any).startViewTransition) {
      setTheme(newTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      setTheme(newTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return { resolvedTheme, toggleTheme };
};

const Navbar = ({ user, organizations, initialNotifications, unreadCount }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useThemeTransition();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const { mutate: switchOrg, isPending: isSwitchingOrg } = useMutation({
    mutationFn: async ({ organizationId, slug }: { organizationId: string; slug: string }) => {
      const response = await fetch("/api/organizations/switch", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to switch organization");
      }
      
      const res = await response.json();
      return { data: res, slug };
    },
    onSuccess: (result) => {
      // Refresh server components to update context (like cookie-dependent data)
      router.refresh(); 
      // Use Next.js client-side navigation to leverage TopLoader and avoid full page reload
      const targetPath = getNewOrgPath(pathname, result.slug);
      router.push(targetPath);
    },
    onError: (error) => {
      console.error("Switch organization failed:", error);
      toast.error("Failed to switch organization");
    },
  });

  const handleSignOut = () => {
    window.location.href = "/signout";
  };


  const navLinks = [
    { name: "Problems", href: "/problems", icon: Code2 },
    { name: "Contest", href: "/contest", icon: Swords },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  const isSigninPage = pathname === "/signin";

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSigninPage) {
      toast.info("You are already on the sign-in page.");
      return;
    }
    setIsSigningIn(true);
    window.location.href = "/signin";
  };
  
  const parts = pathname.split("/");
  const activeOrgSlug = parts[1] === "organizations" && parts[2] ? parts[2] : user?.currentOrganization?.slug;
  const currentOrg = organizations.find(o => o.slug === activeOrgSlug);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/40 dark:border-border/15 bg-background/55 backdrop-blur-xl saturate-150 supports-[backdrop-filter]:bg-background/40 transition-all duration-300 shadow-sm dark:shadow-none">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section - Strictly Left */}
          <div className="flex-shrink-0 flex items-center justify-start">
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
              <motion.div
                className="flex items-center gap-2"
                initial="initial"
                whileHover="hover"
              >
                <motion.div
                  className="relative w-8 h-8 md:w-10 md:h-10"
                  variants={{
                    initial: { y: 0, scale: 1 },
                    hover: { y: -2, scale: 1.04 },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                >
                  <Image
                    src="/logo.svg"
                    alt="HeapDog Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </motion.div>
                <motion.div
                  className="flex items-center text-xl font-bold tracking-tight"
                  variants={{
                    initial: { y: 0 },
                    hover: { y: -0.5 },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                >
                  <span className="text-foreground">Heap</span>
                  <span className="text-primary">Dog</span>
                </motion.div>
              </motion.div>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative flex items-center gap-0 lg:gap-2 px-3 lg:px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full select-none
                    ${pathname === link.href 
                      ? "text-primary font-semibold" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {pathname === link.href && (
                    <motion.span
                      layoutId="active-nav-bubble"
                      className="absolute inset-0 bg-primary/10 rounded-full z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <link.icon className={`w-4 h-4 z-10 transition-colors duration-200 ${pathname === link.href ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                  <span className="z-10 hidden lg:inline">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex flex-shrink-0 items-center justify-end gap-2">
            {organizations.length > 0 ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-9 lg:w-[200px] h-9 p-0 lg:px-2.5 has-[>svg]:p-0 lg:has-[>svg]:px-2.5 justify-center lg:justify-between font-normal border-border/40 hover:bg-accent/40 active:scale-[0.98] transition-all duration-200 rounded-xl" disabled={isSwitchingOrg}>
                    <div className="flex items-center gap-0 lg:gap-2.5 overflow-hidden">
                      {isSwitchingOrg ? (
                        <Spinner className="h-4 w-4 flex-shrink-0" />
                      ) : currentOrg?.logoUrl ? (
                        <img
                          src={currentOrg.logoUrl}
                          alt={currentOrg.orgName}
                          className="w-5 h-5 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br ${getOrgGradient(currentOrg?.orgName || "Select Organization")} shadow-xs flex-shrink-0`}>
                          {getOrgInitials(currentOrg?.orgName || "Select Organization")}
                        </div>
                      )}
                      <span className="truncate text-sm font-semibold tracking-tight text-foreground hidden lg:inline">
                         {currentOrg?.orgName || "Select Organization"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 transition-transform duration-200 data-[state=open]:rotate-180 hidden lg:inline" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="end">
                  {organizations.map((org) => (
                    <DropdownMenuItem 
                      key={org.id} 
                      onSelect={() => {
                         if (org.slug !== activeOrgSlug) {
                           switchOrg({ organizationId: org.id, slug: org.slug });
                         }
                      }}
                      className="flex items-center justify-between py-2 px-2.5 cursor-pointer rounded-md focus:bg-accent/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {org.logoUrl ? (
                          <img
                            src={org.logoUrl}
                            alt={org.orgName}
                            className="w-5 h-5 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br ${getOrgGradient(org.orgName)} shadow-xs flex-shrink-0`}>
                            {getOrgInitials(org.orgName)}
                          </div>
                        )}
                        <span className={`truncate text-sm ${org.slug === activeOrgSlug ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                          {org.orgName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {org.slug === activeOrgSlug ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold bg-muted px-1.5 py-0.5 rounded-sm">
                            {org.role}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              user && (
                <Button variant="outline" size="sm" asChild className="w-9 lg:w-auto h-9 p-0 lg:px-4 has-[>svg]:p-0 lg:has-[>svg]:px-4 border-border/40 rounded-xl hover:bg-accent/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center">
                  <Link href="/organizations/new" className="gap-0 lg:gap-2 flex items-center justify-center">
                    <Plus className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:inline text-sm font-semibold tracking-tight text-foreground">New Organization</span>
                  </Link>
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full cursor-pointer ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage
                        src={user.profile_picture || `https://avatar.vercel.sh/${user.username}`}
                        alt={user.username}
                      />
                      <AvatarFallback>
                        {user.first_name && user.last_name
                          ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                          : user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer group" asChild>
                     <Link href="/profile" className="flex items-center w-full">
                        <UserIcon className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                        Profile
                     </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer group" asChild>
                     <Link href="/settings" className="flex items-center w-full">
                        <SettingsIcon className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                        Settings
                     </Link>
                  </DropdownMenuItem>
                  {currentOrg && (
                    <DropdownMenuItem className="cursor-pointer group" asChild>
                      <Link href="/organizations" className="flex flex-col items-start w-full gap-0.5">
                          <div className="flex items-center">
                              <Building2 className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                              Manage Organization
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-6 font-normal">
                              {currentOrg.orgName}
                          </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer group" asChild>
                     <Link href="/organizations/new" className="flex items-center w-full">
                        <Plus className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                        Create Organization
                     </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer group"
                    disabled={false}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleSignOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4 group-hover:text-destructive transition-colors" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                disabled={isSigningIn}
                className={cn(
                  "cursor-pointer font-medium text-sm tracking-tight transition-all duration-200 ease-in-out active:scale-[0.98] gap-2 rounded-full px-4 h-8.5 shadow-xs border border-transparent",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  isSigningIn && "opacity-60 pointer-events-none"
                )}
                onClick={handleSignIn}
              >
                {isSigningIn ? (
                  <Spinner className="w-3.5 h-3.5 text-current animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5 text-current" />
                )}
                <span>Sign In</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden ml-auto items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full cursor-pointer"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-b border-border/40 dark:border-border/15 shadow-xl"
            id="mobile-menu"
          >
            <motion.div 
              className="px-4 pt-4 pb-6 space-y-3 sm:px-6"
              initial="closed"
              animate="open"
              variants={{
                open: {
                  transition: { staggerChildren: 0.05, delayChildren: 0.05 }
                },
                closed: {
                  transition: { staggerChildren: 0.05, staggerDirection: -1 }
                }
              }}
            >
              {navLinks.map((link) => (
                <motion.div
                  key={link.name}
                  variants={{
                    open: { y: 0, opacity: 1 },
                    closed: { y: 15, opacity: 0 }
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200
                      ${pathname === link.href 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                      }`}
                  >
                    <link.icon className={`w-5 h-5 ${pathname === link.href ? "text-primary" : "text-muted-foreground"}`} />
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div 
                className="mt-6 px-1 border-t border-border/40 pt-6"
                variants={{
                  open: { y: 0, opacity: 1 },
                  closed: { y: 15, opacity: 0 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                 {user ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-2">
                             <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage
                                  src={user.profile_picture || `https://avatar.vercel.sh/${user.username}`}
                                  alt={user.username}
                                />
                                <AvatarFallback>
                                  {user.first_name && user.last_name
                                    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                                    : user.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                             </Avatar>
                             <div className="flex flex-col">
                                 <span className="text-base font-semibold text-foreground">
                                    {user.first_name && user.last_name
                                      ? `${user.first_name} ${user.last_name}`
                                      : user.first_name || user.username}
                                 </span>
                                 <span className="text-sm text-muted-foreground">{user.email}</span>
                             </div>
                        </div>
                        
                        <div className="grid gap-2">
                          {/* Mobile Organization View */}
                          {organizations.length > 0 ? (
                            <div className="px-1 py-2 space-y-2.5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Current Organization
                              </p>
                              <div className="flex flex-col gap-2">
                                {organizations.map((org) => (
                                  <div 
                                    key={org.id} 
                                    onClick={() => {
                                      if (org.slug !== activeOrgSlug) {
                                        switchOrg({ organizationId: org.id, slug: org.slug });
                                        setIsOpen(false);
                                      }
                                    }}
                                    className={`flex items-center justify-between p-2.5 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
                                      activeOrgSlug === org.slug 
                                        ? "bg-primary/10 text-primary font-semibold" 
                                        : "hover:bg-muted/50 text-muted-foreground"
                                    } ${isSwitchingOrg ? "opacity-50 pointer-events-none" : ""}`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {org.logoUrl ? (
                                        <img
                                          src={org.logoUrl}
                                          alt={org.orgName}
                                          className="w-5 h-5 rounded object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br ${getOrgGradient(org.orgName)} shadow-xs flex-shrink-0`}>
                                          {getOrgInitials(org.orgName)}
                                        </div>
                                      )}
                                      <span>{org.orgName}</span>
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase border border-border/40 px-1.5 py-0.5 rounded">
                                      {org.role}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" className="w-full justify-start h-10 px-4 rounded-xl" asChild onClick={() => setIsOpen(false)}>
                              <Link href="/organizations/new" className="gap-3">
                                <Plus className="h-4 w-4" />
                                New Organization
                              </Link>
                            </Button>
                          )}
                          <Button variant="ghost" className="w-full justify-start h-10 px-4 rounded-xl" asChild onClick={() => setIsOpen(false)}>
                            <Link href="/profile" className="gap-3">
                              <UserIcon className="h-4 w-4" />
                              Profile
                            </Link>
                          </Button>
                          <Button variant="ghost" className="w-full justify-start h-10 px-4 rounded-xl" asChild onClick={() => setIsOpen(false)}>
                            <Link href="/settings" className="gap-3">
                              <SettingsIcon className="h-4 w-4" />
                              Settings
                            </Link>
                          </Button>
                          {currentOrg && (
                            <Button variant="ghost" className="w-full justify-start h-auto py-2.5 px-4 rounded-xl" asChild onClick={() => setIsOpen(false)}>
                              <Link href="/organizations" className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-3">
                                  <Building2 className="h-4 w-4" />
                                  <span>Manage Organization</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground ml-7 font-normal">
                                    {currentOrg.orgName}
                                </span>
                              </Link>
                            </Button>
                          )}
                          <Button 
                              variant="destructive" 
                              className="w-full justify-start h-10 px-4 rounded-xl" 
                              onClick={() => {
                                handleSignOut();
                              }}
                          >
                              <LogOut className="mr-2 h-4 w-4" />
                              Sign Out
                          </Button>
                        </div>
                    </div>
                 ) : (
                    <Button
                      disabled={isSigningIn}
                      className={cn(
                        "w-full h-10.5 cursor-pointer font-medium text-sm tracking-tight rounded-full gap-2 transition-all duration-200 ease-in-out active:scale-[0.98] shadow-xs border border-transparent",
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        isSigningIn && "opacity-60 pointer-events-none"
                      )}
                      onClick={(e) => {
                        setIsOpen(false);
                        handleSignIn(e);
                      }}
                    >
                      {isSigningIn ? (
                        <Spinner className="w-4 h-4 text-current animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4 text-current" />
                      )}
                      <span>Sign In</span>
                    </Button>
                 )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
