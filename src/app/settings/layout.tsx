import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { SettingsSidebar } from "./components/settings-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NavBreadcrumbs } from "@/components/nav-breadcrumbs";
import {
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: "profile" as const,
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: "security" as const,
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: "account" as const,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const baseBreadcrumbs = (
    <Fragment>
      <BreadcrumbItem>
        <BreadcrumbPage>Settings</BreadcrumbPage>
      </BreadcrumbItem>
    </Fragment>
  );

  return (
    <SidebarProvider className="min-h-[calc(100vh-4rem)]">
       <SettingsSidebar items={sidebarNavItems} />
       <SidebarInset className="bg-transparent">
        <header className="flex h-12 shrink-0 items-center gap-2 px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-2">
               <SidebarTrigger className="-ml-1" />
               <Separator orientation="vertical" className="mr-2 h-4" />
               <NavBreadcrumbs items={sidebarNavItems} baseBreadcrumbs={baseBreadcrumbs} />
            </div>
        </header>
         <div className="flex-1 w-full px-4 md:px-6 lg:px-8 pb-10">
            <div className="space-y-1 mb-4">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                  <p className="text-muted-foreground text-lg">
                    Manage your account preferences and workspace configuration.
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
