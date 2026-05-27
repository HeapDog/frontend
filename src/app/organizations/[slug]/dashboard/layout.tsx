import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { AppSidebar } from "./components/app-sidebar";
import { QuickActionSearch } from "./components/quick-action-search";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavBreadcrumbs } from "@/components/nav-breadcrumbs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { ScrollReset } from "@/components/scroll-reset";
import { ShiftWheelScroll } from "@/components/shift-wheel-scroll";
import { ArchivedBanner } from "./components/archived-banner";

interface SidebarProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OrganizationsLayout({ children, params }: SidebarProps) {
  const user = await requireAuth();
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const headerList = await headers();
  const pathname = headerList.get("x-url") || "";

  // Bypass organization check for invitation acceptance page
  if (pathname.includes(`/invitations/accept`)) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  const organizations = await getUserOrganizations();

  if (!organizations || organizations.length === 0) {
    redirect("/organizations");
  }

  const currentOrg = organizations.find(org => org.slug === slug);

  // If the slug in URL doesn't match any of user's organizations, redirect to main organizations page
  if (!currentOrg) {
    redirect("/organizations");
  }

  const sidebarItems = [
    {
      title: "Basic Info",
      href: `/organizations/${slug}/dashboard/basic-info`,
      icon: "basic-info" as const,
      section: "Workspace" as const,
    },
    {
      title: "Members",
      icon: "members" as const,
      section: "Workspace" as const,
      items: [
        {
          title: "All Members",
          href: `/organizations/${slug}/dashboard/members`,
          icon: "members-all" as const,
        },
        {
          title: "Invitations",
          href: `/organizations/${slug}/dashboard/members/invitations`,
          icon: "members-invitations" as const,
        },
      ],
    },
    {
      title: "Problems",
      href: `/organizations/${slug}/dashboard/problems`,
      icon: "libraries" as const,
      pathPrefix: `/organizations/${slug}/dashboard/libraries`,
      section: "Workspace" as const,
    },
    {
      title: "Online Assessment",
      href: `/organizations/${slug}/dashboard/online-assessment`,
      icon: "online-assessment" as const,
      section: "Workspace" as const,
    },
    {
      title: "Contest",
      href: `/organizations/${slug}/dashboard/contest`,
      icon: "contest" as const,
      section: "Workspace" as const,
    },
    {
      title: "Access Control",
      icon: "access-control" as const,
      section: "Administration" as const,
      items: [
        {
          title: "Visual Editor",
          href: `/organizations/${slug}/dashboard/acls/visual/general-access-rules`,
          icon: "access-rules" as const,
          pathPrefix: `/organizations/${slug}/dashboard/acls/visual`,
        },
        {
          title: "JSON Policy File",
          href: `/organizations/${slug}/dashboard/acls/file`,
          icon: "access-json" as const,
        },
      ],
    },
    {
      title: "Settings",
      icon: "settings" as const,
      section: "Administration" as const,
      items: [
        {
          title: "Website Verification",
          href: `/organizations/${slug}/dashboard/settings/website-verification`,
          icon: "settings-website" as const,
        },
        {
          title: "Integrations",
          href: `/organizations/${slug}/dashboard/settings/integrations`,
          icon: "settings-integrations" as const,
        },
        {
          title: "Billing",
          href: `/organizations/${slug}/dashboard/settings/billing`,
          icon: "settings-billing" as const,
        },
        {
          title: "Transfer Ownership",
          href: `/organizations/${slug}/dashboard/settings/transfer-ownership`,
          icon: "settings-transfer" as const,
        },
        {
          title: "Danger Zone",
          href: `/organizations/${slug}/dashboard/settings/danger-zone`,
          icon: "settings-danger" as const,
        },
      ],
    },
  ];

  return (
    <SidebarProvider className="flex-1 min-h-0 flex">
      <AppSidebar
        items={sidebarItems}
        user={user}
        organizationName={currentOrg.orgName}
        organizations={organizations}
        currentOrgId={currentOrg.id}
        userRole={currentOrg.role}
        slug={slug}
      />
      <SidebarInset className="min-w-0 flex-1 min-h-0 flex flex-col">
        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
          <ScrollReset scrollAreaId="dashboard-scroll-area" />
          <ShiftWheelScroll scrollAreaId="dashboard-scroll-area" />
          <header className="flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex w-full items-center gap-2 px-4 sm:gap-4 sm:px-6">
              {/* Sidebar trigger */}
              <SidebarTrigger className="h-8 w-8 shrink-0" />

              {/* Divider */}
              <div className="h-4 w-px bg-border" />

              {/* Breadcrumbs */}
              <div className="min-w-0 flex-1">
                <NavBreadcrumbs
                  items={sidebarItems}
                  organizationName={currentOrg.orgName}
                  organizationSlug={slug}
                  organizations={organizations}
                  currentOrgId={currentOrg.id}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <QuickActionSearch slug={slug} />
              </div>
            </div>
          </header>
          <div id="dashboard-scroll-area" className="min-h-0 flex-1 overflow-y-auto min-w-0 p-4 pt-4 pb-6 sm:p-6 sm:pt-6 sm:pb-6">
            <ArchivedBanner slug={slug} />
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
