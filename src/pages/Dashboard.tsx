import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CalendarCheck, Package, AlertTriangle, Building2 } from 'lucide-react';
import { MissionCard } from '../components/missions/MissionCard';
import { Modal } from '../components/ui/Modal';
import { MissionDetail } from '../components/missions/MissionDetail';
import { Mission } from '../types';
export function Dashboard() {
  const { missions, apartments, bags, stock, users } = useAppState();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  // Metrics
  const today = new Date().toISOString().split('T')[0];
  const todaysMissions = missions.filter((m) => m.date === today);
  const bagsToPrep = bags.filter(
    (b) => b.status === 'à_préparer' || b.status === 'à_préparer_incomplet'
  );
  const stockAlerts = stock.filter((s) => s.quantity <= s.alertThreshold);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Missions Aujourd'hui
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysMissions.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaysMissions.filter((m) => m.status === 'terminée').length}{' '}
              terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sacs à préparer
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bagsToPrep.length}</div>
            <p className="text-xs text-muted-foreground">
              Dont{' '}
              {
              bagsToPrep.filter((b) => b.status === 'à_préparer_incomplet').
              length
              }{' '}
              incomplets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stockAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Articles sous le seuil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appartements</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apartments.length}</div>
            <p className="text-xs text-muted-foreground">
              Actifs sur la plateforme
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Missions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Missions du jour</h2>
        {todaysMissions.length === 0 ?
        <div className="text-center py-10 bg-muted/20 rounded-lg text-muted-foreground">
            Aucune mission prévue aujourd'hui
          </div> :

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todaysMissions.map((mission) => {
            const apt = apartments.find((a) => a.id === mission.apartmentId)!;
            const bag = bags.find((b) => b.id === mission.bagId)!;
            const agent = users.find((u) => u.id === mission.agentId);
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                apartment={apt}
                bag={bag}
                agent={agent}
                onClick={() => setSelectedMission(mission)} />);


          })}
          </div>
        }
      </div>

      {/* Stock Alerts Preview */}
      {stockAlerts.length > 0 &&
      <div className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes Stock Critiques
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stockAlerts.slice(0, 4).map((item) =>
          <Card key={item.id} className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="font-medium">{item.name}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">
                      Reste:
                    </span>
                    <span className="font-bold text-orange-700">
                      {item.quantity}
                    </span>
                  </div>
                </CardContent>
              </Card>
          )}
          </div>
        </div>
      }

      {/* Mission Detail Modal */}
      <Modal
        isOpen={!!selectedMission}
        onClose={() => setSelectedMission(null)}
        title="Détails de la mission">

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