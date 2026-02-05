import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import SidebarWrapper from './SidebarWrapper';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribeStart = Inertia.on('start', () => setLoading(true));
    const unsubscribeFinish = Inertia.on('finish', () => setLoading(false));

    return () => {
      unsubscribeStart();
      unsubscribeFinish();
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-accent via-white to-primary/10 dark:from-dark-bg dark:via-dark-surface dark:to-dark-card transition-colors duration-300">
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-primary z-[9999] animate-pulse" />
      )}

      <div className="flex min-h-screen w-full">
        <SidebarWrapper />
        <main className="flex-1 ml-64 p-8 min-h-screen w-full overflow-x-hidden">
          <div className="animate-fade-in w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
