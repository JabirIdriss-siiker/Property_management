import { Mission, Apartment, User, Bag } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BagStatus } from '../bags/BagStatus';
import { Calendar, Clock, User as UserIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
interface MissionCardProps {
  mission: Mission;
  apartment: Apartment;
  agent?: User;
  bag: Bag;
  onClick: () => void;
}
export function MissionCard({
  mission,
  apartment,
  agent,
  bag,
  onClick
}: MissionCardProps) {
  const statusConfig = {
    à_faire: {
      label: 'À faire',
      variant: 'secondary' as const
    },
    en_cours: {
      label: 'En cours',
      variant: 'info' as const
    },
    terminée: {
      label: 'Terminée',
      variant: 'success' as const
    },
    annulée: {
      label: 'Annulée',
      variant: 'destructive' as const
    }
  };
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
      onClick={onClick}>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="font-semibold text-lg">{apartment.name}</div>
          <Badge variant={statusConfig[mission.status]?.variant || 'secondary'}>
            {statusConfig[mission.status]?.label || mission.status}
          </Badge>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">
              {format(new Date(mission.date), 'EEEE d MMMM', {
                locale: fr
              })}
            </span>
            <Clock className="h-4 w-4 ml-2" />
            <span>{mission.time}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{apartment.address}</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>{agent ? agent.name : 'Non assigné'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Sac:</span>
              <BagStatus status={bag.status} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);

}