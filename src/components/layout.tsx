import React, { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useRole } from '@/hooks/use-role';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';

import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Users,
  Languages,
  Bell,
  LogOut,
  Telescope,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
};

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const { isAdmin } = useRole();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navigation = useMemo<NavigationItem[]>(
    () => [
      {
        name: t.nav.dashboard,
        href: '/',
        icon: LayoutDashboard,
        exact: true,
      },
      {
        name: t.nav.abandonCarts,
        href: '/abandon-carts',
        icon: ShoppingCart,
      },
      {
        name: t.nav.orders,
        href: '/orders',
        icon: ShoppingCart,
      },
      {
        name: t.nav.templates,
        href: '/templates',
        icon: Telescope,
      },
      {
        name: t.nav.reminderRules,
        href: '/reminder-rules',
        icon: Bell,
      },
      ...(isAdmin
        ? [
            {
              name: t.nav.reports,
              href: '/reports',
              icon: BarChart3,
            },
            {
              name: t.nav.team,
              href: '/team',
              icon: Users,
            },
          ]
        : []),
    ],
    [isAdmin, t],
  );

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .map((x) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        {/* Top */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">ChatGate</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs hover:bg-muted"
                >
                  <Languages className="h-3.5 w-3.5" />
                  {language === 'ar'
                    ? t.common.arabic
                    : t.common.english}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  {t.common.english}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('ar')}>
                  {t.common.arabic}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            const active = item.exact
              ? location === item.href
              : location === item.href ||
                location.startsWith(`${item.href}/`);

            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}</span>

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User */}
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-muted text-left rtl:text-right"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role?.replace(/_/g, ' ')}
                  </p>
                </div>

                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t.common.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto bg-background p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}