import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/app/organizations/[slug]/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { NavBreadcrumbs } from "@/components/nav-breadcrumbs";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

interface SidebarProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OrganizationsLayout({ children, params }: SidebarProps) {
  const user = await requireUser();
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  if (!user.organizations || user.organizations.length === 0) {
      redirect("/organizations");
  }

  const currentOrg = user.organizations.find(org => org.slug === slug);
  
  // If the slug in URL doesn't match any of user's organizations, redirect to main organizations page
  // or potentially to the first organization they have access to
  if (!currentOrg) {
      redirect("/organizations");
  }

  const sidebarItems = [
    {
      title: "Basic Info",
      href: `/organizations/${slug}/basic-info`,
      icon: "basic-info" as const,
    },
    {
      title: "Members",
      icon: "members" as const,
      items: [
        {
          title: "All Members",
          href: `/organizations/${slug}/members`,
        },
        {
          title: "Invitations",
          href: `/organizations/${slug}/members/invitations`,
        },
      ],
    },
    {
      title: "Problem Archive",
      href: `/organizations/${slug}/problem-archive`,
      icon: "problem-archive" as const,
    },
    {
      title: "Online Assessment",
      href: `/organizations/${slug}/online-assessment`,
      icon: "online-assessment" as const,
    },
    {
      title: "Contest",
      href: `/organizations/${slug}/contest`,
      icon: "contest" as const,
    },
    {
      title: "Settings",
      href: `/organizations/${slug}/settings`,
      icon: "settings" as const,
    },
  ];

  const baseBreadcrumbs = (
    <Fragment>
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink href="/organizations">
          Organizations
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbPage>{currentOrg.orgName}</BreadcrumbPage>
      </BreadcrumbItem>
    </Fragment>
  );

  return (
    <SidebarProvider className="min-h-[calc(100vh-4rem)]">
      <AppSidebar items={sidebarItems} />
      <SidebarInset className="bg-transparent">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <NavBreadcrumbs items={sidebarItems} baseBreadcrumbs={baseBreadcrumbs} />
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/organizations/new" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Organization</span>
                </Link>
            </Button>
        </header>
         <div className="flex-1 w-full px-4 md:px-6 lg:px-8 pb-10">
            <div className="space-y-1 mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{currentOrg.orgName}</h1>
                <p className="text-muted-foreground text-lg">
                  Manage your organization settings and team members.
                </p>
            </div>

            <Separator className="my-6 opacity-50" />

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
               {children}
            </div>
         </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
