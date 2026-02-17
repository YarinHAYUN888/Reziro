import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Home, Building2, DollarSign, TrendingUp, Settings, Package, Users, LogOut } from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { signOut } from '../../../lib/auth';
import { useAppStore } from '../../../store/useAppStore';

const navItems = [
  {
    icon: Home,
    labelKey: 'sidebar.home',
    path: '/dashboard',
  },
  {
    icon: Building2,
    labelKey: 'sidebar.rooms',
    path: '/rooms',
  },
  {
    icon: Package,
    labelKey: 'sidebar.costs',
    path: '/costs',
  },
  {
    icon: DollarSign,
    labelKey: 'sidebar.financial',
    path: '/financial',
  },
  {
    icon: Users,
    labelKey: 'sidebar.partners',
    path: '/partners',
  },
  {
    icon: TrendingUp,
    labelKey: 'sidebar.forecast',
    path: '/forecasts',
  },
  {
    icon: Settings,
    labelKey: 'sidebar.settings',
    path: '/admin',
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const setUser = useAppStore((state) => state.setUser);
  const setProfile = useAppStore((state) => state.setProfile);
  const profile = useAppStore((state) => state.profile);

  async function handleLogout() {
    await signOut();
    setUser(null);
    setProfile(null);
  }

  const greeting = profile?.first_name ? `שלום, ${profile.first_name}` : 'שלום';

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-6 flex flex-col">
      <div className="mb-1 flex flex-col items-center">
      <img
        src="https://i.postimg.cc/W18Mh7B5/2.png"
        alt="Reziro"
        className="h-25 object-contain"
      />
        <p className="text-sm text-muted-foreground mt-2 font-semibold" dir="rtl">{greeting}</p>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-semibold">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5" />
        <span className="font-semibold">{t('sidebar.logout') ?? 'Log out'}</span>
      </Button>
    </aside>
  );
}