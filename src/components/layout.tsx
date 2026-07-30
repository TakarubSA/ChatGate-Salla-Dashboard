import React from 'react';
import { Link, useLocation } from 'wouter';
import { useRole } from '@/hooks/use-role';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { LayoutDashboard, ShoppingCart, BarChart3, Users, Settings2, Languages, Bell, LogOut ,Telescope} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import chatgateLogo from '@assets/chatgate-logo_1783594251269.png';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const {  isAdmin } = useRole();
const { user, logout } = useAuth();
const { language, setLanguage, t } = useLanguage();

const navigation = [
  { name: t.nav.dashboard, href: '/', icon: LayoutDashboard, exact: true },
  {
    name: t.nav.abandonCarts,
    href: '/abandon-carts',
    icon: ShoppingCart,
    exact: false,
  },
  {
    name: t.nav.orders,
    href: '/orders',
    icon: ShoppingCart,
    exact: false,
    
  },
    {
    name: t.nav.templates,
    href: '/templates',
    icon: Telescope,
    exact: false,
    
  },
      {
    name: t.nav.campaigns,
    href: '/campaigns',
    icon: Telescope,
    exact: false,
    
  },
          {
          name: t.nav.reminderRules,
          href: '/reminder-rules',
          icon: Bell,
          exact: false,
        },
  ...(isAdmin
    ? [
        {
          name: t.nav.reports,
          href: '/reports',
          icon: BarChart3,
          exact: false,
        },

        {
          name: t.nav.team,
          href: '/team',
          icon: Users,
          exact: false,
        },
      ]
    : []),
];

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          {/* <Link href="/" className="flex items-center gap-2 outline-none">
            <img src={chatgateLogo} alt="ChatGate" className="h-8 w-auto object-contain" />
          </Link> */}
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = item.exact ? location === item.href : location.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className="block outline-none">
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
     <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left outline-none">
      <Avatar className="h-9 w-9 border border-border">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {user?.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {user?.name}
        </p>

        <p className="text-xs text-muted-foreground truncate">
          {user?.email}
        </p>
      </div>

      <Settings2 className="h-4 w-4 text-muted-foreground" />
    </button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>
      {user?.role?.replace('_', ' ').toUpperCase()}
    </DropdownMenuLabel>

    <DropdownMenuSeparator />

    <DropdownMenuLabel>
      {t.common.language}
    </DropdownMenuLabel>

    <DropdownMenuItem
      onClick={() => setLanguage('en')}
      className={language === 'en' ? 'bg-primary/5' : ''}
    >
      <Languages className="h-4 w-4 mr-2" />
      {t.common.english}
    </DropdownMenuItem>

    <DropdownMenuItem
      onClick={() => setLanguage('ar')}
      className={language === 'ar' ? 'bg-primary/5' : ''}
    >
      <Languages className="h-4 w-4 mr-2" />
      {t.common.arabic}
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuItem
      onClick={logout}
      className="text-destructive focus:text-destructive"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {t.common.logout}
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
