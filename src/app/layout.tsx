import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from 'nextjs-toploader';
import { SplashScreen } from "@/components/splash-screen";
import Providers from "./providers";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/organizations";
import { Toaster } from "@/components/ui/sonner";
import { getNotifications, getUnreadCount } from "@/lib/notifications";
import DevIndicator from "@/components/dev-indicator";

export const dynamic = "force-dynamic";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "HeapDog",
    description: "The futuristic coding platform",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    // Only fetch organizations if we have a user
    const organizations = user ? await getUserOrganizations() : [];
    
    // const initialNotifications = user ? await getNotifications() : null;
    // const unreadCountData = user ? await getUnreadCount() : { unread: 0, total: 0 };

    return (
        <html lang="en" suppressHydrationWarning>
            <Providers>
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground flex flex-col h-svh overflow-hidden`}
                >
                    <NextTopLoader
                        color="var(--primary)"
                        initialPosition={0.08}
                        crawlSpeed={200}
                        height={3}
                        crawl={true}
                        showSpinner={false}
                        easing="ease"
                        speed={200}
                        shadow="0 0 10px var(--primary),0 0 5px var(--primary)"
                        template='<div class="bar" role="bar"><div class="peg"></div></div>'
                        zIndex={1600}
                        showAtBottom={false}
                    />
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem
                    >
                        <SplashScreen />
                        <Navbar 
                            user={user} 
                            organizations={organizations}
                            initialNotifications={null} 
                            unreadCount={{ unread: 0, total: 0 }} 
                        />
                        <main className="pt-16 flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
                            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
                                {children}
                            </div>
                        </main>
                        <Toaster />
                        <DevIndicator />
                    </ThemeProvider>
                </body>
            </Providers>
        </html>
    );
}
