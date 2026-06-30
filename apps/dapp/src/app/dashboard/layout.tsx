'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/shared/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { clearJwt } from '@/lib/auth/sep10';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useCurrentUser();

  const handleSignOut = () => {
    clearJwt();
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-screen bg-background text-foreground transition-colors duration-200 relative">
        <AppSidebar
          userName={user?.name}
          userEmail={user?.walletAddress ?? user?.email ?? undefined}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 flex-col relative bg-background">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
