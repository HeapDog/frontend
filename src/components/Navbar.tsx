"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy, Code2, Swords, Sun, Moon, LogIn, LogOut, User as UserIcon, SettingsIcon, Building2, Plus, Bell, Info, Mail, AlertTriangle, AlertCircle, Send, UserCheck, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { User, Notification, NotificationResponse, UnreadCountResponse } from "@/lib/types";
import { toast } from "sonner";
import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuArrow,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  user: User | null;
  initialNotifications: NotificationResponse | null;
  unreadCount: UnreadCountResponse;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "INVITATION":
      return <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />;
    case "INVITATION_SENT":
      return <Send className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />;
    case "INVITATION_ACCEPTED":
      return <UserCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />;
    case "ORGANIZATION_MEMBER_ROLE_UPDATED":
      return <Shield className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />;
    case "WARNING":
      return <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />;
    case "ERROR":
      return <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />;
    case "INFO":
    default:
      return <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />;
  }
};

const formatNotificationDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than a minute
  if (diff < 60 * 1000) {
      return "Just now";
  }
  
  // Less than an hour
  if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
  }
  
  // Less than a week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
  }
  
  return date.toLocaleDateString();
};

const Navbar = ({ user, initialNotifications, unreadCount }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [sseToken, setSseToken] = useState<string | null>(null);

  useEffect(() => {
    if (user && !sseToken) {
        fetch('/api/sse-token')
            .then(res => {
                if(res.ok) return res.json();
                throw new Error('Failed to fetch SSE token');
            })
            .then(data => {
                setSseToken(data.token);
            })
            .catch(err => console.error("Failed to fetch SSE token", err));
    }
  }, [user, sseToken]);

  useEffect(() => {
    if (!sseToken || !process.env.NEXT_PUBLIC_SSE_SERVER) return;
    console.log("SSE token:", sseToken);

    const url = `${process.env.NEXT_PUBLIC_SSE_SERVER}/notifications/subscribe?token=${sseToken}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
        console.log("SSE connection opened");
    };

    const handleMessage = (event: MessageEvent) => {
        try {
            console.log("SSE event received:", event.data);
            const parsedData = JSON.parse(event.data);
            const notification: Notification = parsedData.data || parsedData;
            
            toast(notification.message, {
                icon: getNotificationIcon(notification.type),
                description: formatNotificationDate(notification.createdAt),
                action: {
                    label: "View",
                    onClick: () => router.push(notification.link)
                }
            });

            setCurrentUnreadCount(prev => ({
                unread: prev.unread + 1,
                total: prev.total + 1
            }));
            
            queryClient.invalidateQueries({ queryKey: ["notifications"] });

        } catch (e) {
            console.error("Error parsing SSE event", e);
        }
    };

    // Listen for default messages
    eventSource.onmessage = handleMessage;
    // Listen for named 'notification' events which is common in Spring Boot
    eventSource.addEventListener("notification", handleMessage);

    eventSource.onerror = (err) => {
        console.error("SSE connection error", err);
    };

    return () => {
        eventSource.removeEventListener("notification", handleMessage);
        eventSource.close();
    };
  }, [sseToken, queryClient, router]);

  const fetchNotifications = async ({ pageParam = 1 }) => {
    const res = await fetch(`/api/notifications?page=${pageParam}&size=10`);
    if (!res.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return res.json() as Promise<NotificationResponse>;
  };

  const {
    data: notificationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
        if (lastPage.meta.last) return undefined;
        return lastPage.meta.page + 1;
    },
    initialData: initialNotifications ? {
        pages: [initialNotifications],
        pageParams: [1],
    } : undefined,
  });

  const notifications = notificationsData?.pages.flatMap(page => page.contents) || [];
  
  const [currentUnreadCount, setCurrentUnreadCount] = useState<UnreadCountResponse>(unreadCount);
  const [markedReadIds, setMarkedReadIds] = useState<Set<number>>(new Set());

  const { mutate: markAsRead } = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds: ids }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      return response.json();
    },
    onSuccess: (data: UnreadCountResponse, variables) => {
      setCurrentUnreadCount(data);
      setMarkedReadIds(prev => {
        const next = new Set(prev);
        variables.forEach(id => next.add(id));
        return next;
      });
    },
    onError: (error) => {
      console.error("Failed to mark notifications as read:", error);
    }
  });

  const handleDropdownOpenChange = (open: boolean) => {
    if (open) {
      const unreadIds = notifications
        .filter(n => !n.read && !markedReadIds.has(n.id))
        .map(n => n.id);
      
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  };

  const loadMoreNotifications = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const { mutate: switchOrg, isPending: isSwitchingOrg } = useMutation({
    mutationFn: async (membershipId: number) => {
      const response = await fetch("/api/organizations/switch", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ membershipId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to switch organization");
      }
      
      return response.json();
    },
    onSuccess: () => {
      router.push("/organizations");
      router.refresh();
    },
    onError: (error) => {
      console.error("Switch organization failed:", error);
      toast.error("Failed to switch organization");
    },
  });

  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to sign out");
      }
    },
    onSuccess: () => {
      router.refresh();
      setIsOpen(false);
    },
    onError: (error) => {
      console.error("Sign out failed:", error);
      toast.error("Failed to sign out");
    },
  });

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


  const navLinks = [
    { name: "Problems", href: "/problems", icon: Code2 },
    { name: "Contest", href: "/contest", icon: Swords },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  const isSigninPage = pathname === "/signin";
  
  const currentOrg = user?.organizations?.find(o => o.id === user.currentOrganizationId);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/80 bg-background/75 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 transition-all duration-300 shadow-sm dark:shadow-none">
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
                    initial: { rotate: 0, scale: 1 },
                    hover: { rotate: -10, scale: 1.05 },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  }}
                >
                  <Image
                    src="/heapdog.png"
                    alt="HeapDog Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </motion.div>
                <div className="flex items-center text-xl font-bold tracking-tight">
                  <motion.span
                    className="text-foreground"
                    variants={{
                      initial: { x: 0 },
                      hover: { x: -2 },
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    Heap
                  </motion.span>
                  <motion.span
                    className="text-primary"
                    variants={{
                      initial: { x: 0 },
                      hover: { x: 2 },
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    Dog
                  </motion.span>
                </div>
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
                  className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full 
                    ${pathname === link.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                >
                  <link.icon className={`w-4 h-4 transition-colors duration-300 ${pathname === link.href ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex flex-shrink-0 items-center justify-end gap-2">
            {user?.organizations && user.organizations.length > 0 ? (
              <Select 
                defaultValue={user.currentOrganizationId?.toString()}
                disabled={isSwitchingOrg}
                onValueChange={(value) => {
                  const orgId = parseInt(value);
                  const org = user.organizations.find(o => o.id === orgId);
                  if (org && org.id !== user.currentOrganizationId) {
                    switchOrg(org.membershipId);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-8 px-2">
                  <div className="flex items-center gap-2 w-full overflow-hidden">
                    {isSwitchingOrg ? (
                       <Spinner className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                       <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate text-sm font-medium">
                       {user.organizations.find(o => o.id === user.currentOrganizationId)?.orgName || "Select Organization"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {user.organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      <div className="flex items-center justify-between w-full gap-2 min-w-0">
                        <span className="font-medium truncate">{org.orgName}</span>
                        <span className="text-xs text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded-sm flex-shrink-0">
                          {org.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              user && (
                <Button variant="outline" size="sm" asChild className="gap-2 h-8">
                  <Link href="/organizations/new">
                    <Plus className="w-4 h-4" />
                    New Organization
                  </Link>
                </Button>
              )
            )}
            {user && (
              <DropdownMenu modal={true} onOpenChange={handleDropdownOpenChange}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    {currentUnreadCount.unread > 0 && (
                      <Badge variant="destructive" className="absolute -top-0.5 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[8px]">
                        {currentUnreadCount.unread > 9 ? "9+" : currentUnreadCount.unread}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 sm:w-[380px]" align="end" forceMount>
                  <DropdownMenuArrow />
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                    <span className="text-sm font-semibold">Notifications</span>
                    {currentUnreadCount.total > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                        {currentUnreadCount.total} Total
                      </Badge>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">No notifications</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">We'll let you know when something arrives.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map((notification) => (
                          <DropdownMenuItem key={notification.id} asChild className="p-0 focus:bg-transparent cursor-pointer">
                            <Link 
                              href={notification.link} 
                              className={`
                                group relative flex items-start gap-3 px-4 py-3.5 w-full outline-none transition-colors 
                                border-b border-border/40 last:border-0 cursor-pointer
                                ${!notification.clicked 
                                  ? 'bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-100/80 dark:hover:bg-blue-900/40' 
                                  : 'bg-background hover:bg-accent dark:hover:bg-muted/50'
                                }
                              `}
                            >
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0 space-y-1 pr-2">
                                  <p className={`text-sm leading-snug break-words ${!notification.clicked ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.message}
                                  </p>
                                  {notification.createdAt && (
                                      <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                                          {formatNotificationDate(notification.createdAt)}
                                      </p>
                                  )}
                              </div>
                              {!notification.clicked && (
                                <div className="flex h-full items-center justify-center pt-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full shadow-sm ring-2 ring-background flex-shrink-0" />
                                </div>
                              )}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                    {hasNextPage && (
                      <div className="p-3 flex justify-center border-t border-border/40 bg-background/50">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={loadMoreNotifications}
                          disabled={isFetchingNextPage}
                          className="w-full text-xs h-8 font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                          {isFetchingNextPage ? (
                            <>
                              <Spinner className="h-3 w-3 mr-2"/>
                              Loading...
                            </>
                          ) : (
                            "Load older notifications"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full cursor-pointer ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={`https://avatar.vercel.sh/${user.username}`} alt={user.username} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
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
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer group"
                    disabled={isSigningOut}
                    onSelect={(e) => {
                      e.preventDefault();
                      signOut();
                    }}
                  >
                    {isSigningOut ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4 group-hover:text-destructive transition-colors" />
                    )}
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild={!isSigninPage}
                variant="default"
                className="hover:brightness-110 active:scale-[0.98] transition-all duration-200 ease-in-out font-semibold tracking-tight shadow-sm gap-2 cursor-pointer"
                onClick={isSigninPage ? () => toast.info("You are already on the sign-in page.") : undefined}
              >
                {isSigninPage ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                ) : (
                  <Link href="/signin">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                )}
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
      <div
        className={`md:hidden transition-all duration-300 ease-in-out origin-top ${
          isOpen ? "max-h-[500px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
        } overflow-hidden bg-background/95 backdrop-blur-xl border-b border-border/80 shadow-lg`}
        id="mobile-menu"
      >
        <div className="px-4 pt-4 pb-6 space-y-2 sm:px-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
                ${pathname === link.href 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
            >
              <link.icon className={`w-5 h-5 ${pathname === link.href ? "text-primary" : "text-muted-foreground"}`} />
              {link.name}
            </Link>
          ))}
          
          <div className="mt-6 px-1 border-t border-border/40 pt-6">
             {user ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                         <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={`https://avatar.vercel.sh/${user.username}`} alt={user.username} />
                            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                         </Avatar>
                         <div className="flex flex-col">
                             <span className="text-base font-semibold">{user.username}</span>
                             <span className="text-sm text-muted-foreground">{user.email}</span>
                         </div>
                    </div>
                    
                    <div className="grid gap-2">
                      {/* Mobile Organization View */}
                      {user.organizations && user.organizations.length > 0 ? (
                        <div className="px-4 py-2 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Current Organization
                          </p>
                          <div className="flex flex-col gap-2">
                            {user.organizations.map((org) => (
                              <div 
                                key={org.id} 
                                onClick={() => {
                                  if (org.id !== user.currentOrganizationId) {
                                    switchOrg(org.membershipId);
                                    setIsOpen(false);
                                  }
                                }}
                                className={`flex items-center justify-between p-2 rounded-md text-sm cursor-pointer transition-colors ${
                                  user.currentOrganizationId === org.id 
                                    ? "bg-primary/10 text-primary" 
                                    : "hover:bg-muted text-muted-foreground"
                                } ${isSwitchingOrg ? "opacity-50 pointer-events-none" : ""}`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSwitchingOrg && user.currentOrganizationId !== org.id && org.membershipId === org.membershipId /* This check is redundant but effectively checks if this is the one being clicked if we tracked it, but here we just disable all */ }
                                  <Building2 className="h-4 w-4" />
                                  <span>{org.orgName}</span>
                                </div>
                                <span className="text-[10px] font-medium uppercase border border-border px-1.5 py-0.5 rounded">
                                  {org.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full justify-start h-10 px-4" asChild onClick={() => setIsOpen(false)}>
                          <Link href="/organizations/new" className="gap-3">
                            <Plus className="h-4 w-4" />
                            New Organization
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" className="w-full justify-start h-10 px-4" asChild onClick={() => setIsOpen(false)}>
                        <Link href="/profile" className="gap-3">
                          <UserIcon className="h-4 w-4" />
                          Profile
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start h-10 px-4" asChild onClick={() => setIsOpen(false)}>
                        <Link href="/settings" className="gap-3">
                          <SettingsIcon className="h-4 w-4" />
                          Settings
                        </Link>
                      </Button>
                      {currentOrg && (
                        <Button variant="ghost" className="w-full justify-start h-auto py-2 px-4" asChild onClick={() => setIsOpen(false)}>
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
                          className="w-full justify-start h-10 px-4" 
                          disabled={isSigningOut}
                          onClick={() => {
                            signOut();
                          }}
                      >
                          {isSigningOut ? (
                            <Spinner className="mr-2 h-4 w-4" />
                          ) : (
                            <LogOut className="mr-2 h-4 w-4" />
                          )}
                          Sign Out
                      </Button>
                    </div>
                </div>
             ) : (
                <Button
                  asChild={!isSigninPage}
                  className="w-full h-11 bg-primary hover:brightness-110 active:scale-[0.98] transition-all duration-200 ease-in-out text-primary-foreground border-0 shadow-sm gap-2 font-semibold text-base"
                  onClick={() => {
                    if (isSigninPage) toast.info("You are already on the sign-in page.");
                    setIsOpen(false);
                  }}
                >
                  {isSigninPage ? (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  ) : (
                    <Link href="/signin">
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </Link>
                  )}
                </Button>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
