'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuthStore } from '../../store/authStore';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { initialize } = useAuthStore();
  const pathname = usePathname();
  const hideFooter = pathname?.startsWith('/chat') ?? false;

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="app-background min-h-screen flex flex-col antialiased">
      <Header />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};
