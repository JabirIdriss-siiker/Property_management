import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Package,
  Smartphone,
  LogOut,
  ShoppingBag
} from
  'lucide-react';
import { cn } from '../../lib/utils';
import { useAppState } from '../../hooks/useAppState';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
  const { currentUser } = useAppState();
  const { signOut } = useAuth();
  const links = [
    {
      to: '/',
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      roles: ['admin']
    },
    {
      to: '/apartments',
      icon: Building2,
      label: 'Appartements',
      roles: ['admin']
    },
    {
      to: '/bags',
      icon: ShoppingBag,
      label: 'Sacs',
      roles: ['admin']
    },
    {
      to: '/missions',
      icon: CalendarCheck,
      label: 'Missions',
      roles: ['admin']
    },
    {
      to: '/stock',
      icon: Package,
      label: 'Stock',
      roles: ['admin']
    },
    {
      to: '/agent',
      icon: Smartphone,
      label: 'Vue Agent',
      roles: ['admin', 'agent']
    }];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          ConciergeApp
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.
          filter((link) => link.roles.includes(currentUser?.role || '')).
          map((link) =>
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ?
                    'bg-primary text-primary-foreground' :
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }>

              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          )}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{currentUser?.name}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">
              {currentUser?.role}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await signOut();
          }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>);
}