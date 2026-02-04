import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MapPin, Clock, CheckCircle, Play, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { MissionDetail } from '../components/missions/MissionDetail';
import { Mission } from '../types';
export function AgentView() {
  const {
    missions,
    apartments,
    bags,
    users,
    currentUser,
    updateMissionStatus
  } = useAppState();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  // Filter missions for current agent (or all if admin viewing)
  const myMissions = missions.
  filter(
    (m) =>
    (currentUser?.role === 'admin' || m.agentId === currentUser?.id) &&
    m.status !== 'annulée'
  ).
  sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const today = new Date().toISOString().split('T')[0];
  const todaysMissions = myMissions.filter((m) => m.date === today);
  const upcomingMissions = myMissions.filter((m) => m.date > today);
  const MissionItem = ({ mission }: {mission: Mission;}) => {
    const apt = apartments.find((a) => a.id === mission.apartmentId)!;
    const bag = bags.find((b) => b.id === mission.bagId)!;
    return (
      <Card
        className="mb-4 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => setSelectedMission(mission)}>

        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">{apt.name}</h3>
            <Badge
              variant={
              mission.status === 'terminée' ?
              'success' :
              mission.status === 'en_cours' ?
              'info' :
              'secondary'
              }>

              {mission.status === 'à_faire' ?
              'À faire' :
              mission.status === 'en_cours' ?
              'En cours' :
              'Terminée'}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{mission.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{apt.address}</span>
            </div>
          </div>

          {mission.status !== 'terminée' &&
          <div className="mt-4 flex gap-2">
              {mission.status === 'à_faire' &&
            <Button
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                updateMissionStatus(mission.id, 'en_cours');
              }}>

                  <Play className="h-4 w-4 mr-2" />
                  Commencer
                </Button>
            }
              {mission.status === 'en_cours' &&
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                updateMissionStatus(mission.id, 'terminée');
              }}>

                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terminer
                </Button>
            }
            </div>
          }

          {bag.status === 'à_préparer_incomplet' &&
          mission.status !== 'terminée' &&
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3" />
                Attention: Sac incomplet
              </div>
          }
        </CardContent>
      </Card>);

  };
  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Bonjour {currentUser?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground">Voici votre planning</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">
              Aujourd'hui
            </span>
          </h2>
          {todaysMissions.length === 0 ?
          <div className="text-center py-8 bg-muted/20 rounded-lg text-muted-foreground">
              Aucune mission aujourd'hui
            </div> :

          todaysMissions.map((m) => <MissionItem key={m.id} mission={m} />)
          }
        </div>

        {upcomingMissions.length > 0 &&
        <div>
            <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
              À venir
            </h2>
            {upcomingMissions.map((m) =>
          <MissionItem key={m.id} mission={m} />
          )}
          </div>
        }
      </div>

      <Modal
        isOpen={!!selectedMission}
        onClose={() => setSelectedMission(null)}
        title="Détails Mission">

        {selectedMission &&
        <MissionDetail
          mission={selectedMission}
          apartment={
          apartments.find((a) => a.id === selectedMission.apartmentId)!
          }
          bag={bags.find((b) => b.id === selectedMission.bagId)!}
          agent={users.find((u) => u.id === selectedMission.agentId)}
          onClose={() => setSelectedMission(null)} />

        }
      </Modal>
    </div>);

}