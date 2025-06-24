import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-gradient-watchtower flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64">
        <Header />
        <main className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}; 