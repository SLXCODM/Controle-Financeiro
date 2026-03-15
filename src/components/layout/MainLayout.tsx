import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, LayoutDashboard, Receipt, FolderOpen, Target, PiggyBank, TrendingUp, Settings, Calendar, Percent, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PrivacyToggle } from './PrivacyToggle';
import { showInterstitialOnNavigation } from '@/lib/admob';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transações', icon: Receipt },
  { path: '/categories', label: 'Categorias', icon: FolderOpen },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/savings', label: 'Poupança', icon: PiggyBank },
  { path: '/investments', label: 'Investimentos', icon: TrendingUp },
  { path: '/annual', label: 'Resumo Anual', icon: Calendar },
  { path: '/distribution', label: 'Divisão de Renda', icon: Percent },
  { path: '/recurring', label: 'Recorrentes', icon: Repeat },
  { path: '/settings', label: 'Configurações', icon: Settings },
];

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      showInterstitialOnNavigation();
    }
  }, [location.pathname]);

  // Swipe right from left edge (bottom half of screen) to open sidebar
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const screenHeight = window.innerHeight;
    // Only activate from left edge AND bottom half of screen to avoid Android back gesture conflict
    if (touch.clientX < 40 && touch.clientY > screenHeight * 0.5) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    } else {
      touchStartRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    if (deltaX > 60 && deltaX > deltaY) {
      setSidebarOpen(true);
    }
    touchStartRef.current = null;
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-6 px-3">
        <h1 className="gradient-text text-2xl font-bold">SLX Finance</h1>
        <p className="text-sm text-muted-foreground">Controle Financeiro</p>
      </div>
      
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-sidebar lg:block">
        <NavContent />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-lg lg:hidden">
          <div className="flex items-center gap-2">
            <PrivacyToggle />
            <h1 className="gradient-text text-xl font-bold">SLX Finance</h1>
          </div>
          
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Desktop Header with Privacy Toggle */}
        <header className="sticky top-0 z-40 hidden h-16 items-center border-b border-border bg-background/80 px-6 backdrop-blur-lg lg:flex">
          <PrivacyToggle />
          <span className="ml-2 text-sm text-muted-foreground">Clique para esconder/mostrar valores</span>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
