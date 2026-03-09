import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';

interface MissionDateGroupProps {
  date: string; // ISO date string 'YYYY-MM-DD'
  count: number;
  children: React.ReactNode;
}

export function MissionDateGroup({ date, count, children }: MissionDateGroupProps) {
  const label = format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase());

  return (
    <section className="space-y-3">
      {/* Sticky group header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 py-2 px-4 bg-background/90 backdrop-blur-sm border-b border-border rounded-md shadow-sm">
        <CalendarDays className="h-4 w-4 text-primary shrink-0" />
        <span className="font-semibold text-sm text-foreground">{label}</span>
        <span className="ml-auto text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
          {count} mission{count > 1 ? 's' : ''}
        </span>
      </div>

      {/* Mission cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}
