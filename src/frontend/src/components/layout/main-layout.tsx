import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Wizard', path: '/wizard' },
    { name: 'Results', path: '/results' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-12 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="font-semibold text-base">Simulation Engine</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "transition-colors hover:text-foreground/80 px-2 py-1 rounded-md",
                  location.pathname === item.path
                    ? "text-primary bg-primary/10"
                    : "text-foreground/60"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4 flex-grow">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t py-2">
        <div className="container flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Simulation Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
