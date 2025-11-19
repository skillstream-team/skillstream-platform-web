import React from 'react';
import { Header, MobileHeader } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F7FA' }}>
      <Header />
      <MobileHeader />
      <main className={cn("flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full pb-20 lg:pb-8", className)}>
        {children}
      </main>
      <Footer className="hidden lg:block" />
      <MobileNav />
    </div>
  );
}; 