import { Mission, Apartment, User, Bag } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BagStatus } from '../bags/BagStatus';
import { Clock, User as UserIcon, MapPin } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MissionCardProps {
  mission: Mission;
  apartment: Apartment;
  agent?: User;
  bag: Bag;
  onClick: () => void;
}

function getDateProximityStyle(dateStr: string): {
  border: string;
  badge: string;
  label: string;
} {
  const date = new Date(dateStr);
  if (isToday(date))
    return { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700', label: "Aujourd'hui" };
  if (isTomorrow(date))
    return { border: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-700', label: 'Demain' };
  if (isThisWeek(date, { weekStartsOn: 1 }))
    return { border: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-700', label: 'Cette semaine' };
  if (isPast(date))
    return { border: 'border-l-gray-300', badge: 'bg-gray-100 text-gray-500', label: 'Passée' };
  return { border: 'border-l-indigo-400', badge: 'bg-indigo-100 text-indigo-700', label: 'À venir' };
}

const statusConfig: Record<Mission['status'], { label: string; variant: 'secondary' | 'info' | 'success' | 'destructive' }> = {
  à_faire: { label: 'À faire', variant: 'secondary' },
  en_cours: { label: 'En cours', variant: 'info' },
  terminée: { label: 'Terminée', variant: 'success' },
  annulée: { label: 'Annulée', variant: 'destructive' },
};

export function MissionCard({ mission, apartment, agent, bag, onClick }: MissionCardProps) {
  const { border, badge, label } = getDateProximityStyle(mission.date);
  const status = statusConfig[mission.status] ?? { label: mission.status, variant: 'secondary' as const };

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${border} group`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Date proximity banner */}
        <div className={`flex items-center justify-between px-4 py-2 rounded-t-md ${badge} text-xs font-semibold`}>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(mission.date), 'EEEE d MMMM', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
            {' · '}
            {mission.time}
          </span>
          <span>{label}</span>
        </div>

        {/* Card body */}
        <div className="px-4 py-3 space-y-3">
          {/* Apartment name + status badge */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Appartement</p>
              <p className="text-lg font-bold leading-tight">{apartment.name}</p>
            </div>
            <Badge variant={status.variant} className="mt-1 shrink-0">
              {status.label}
            </Badge>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Address */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{apartment.address}</span>
          </div>

          {/* Agent & Bag */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 shrink-0" />
              <span>{agent ? agent.name : <em className="text-muted-foreground/60">Non assigné</em>}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Sac :</span>
              <BagStatus status={bag.status} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}