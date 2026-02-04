import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { MissionCard } from '../components/missions/MissionCard';
import { Modal } from '../components/ui/Modal';
import { MissionDetail } from '../components/missions/MissionDetail';
import { Mission } from '../types';
import { Select } from '../components/ui/Select';

export function Missions() {
  const { missions, apartments, bags, users, addMission } = useAppState();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Sort missions by date (newest first)
  const sortedMissions = [...missions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const filteredMissions =
    filterStatus === 'all' ?
      sortedMissions :
      sortedMissions.filter((m) => m.status === filterStatus);
  // Simple manual mission creation form
  const CreateMissionForm = () => {
    const [aptId, setAptId] = useState(apartments[0]?.id || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('11:00');
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const apt = apartments.find((a) => a.id === aptId);
      if (!apt) return;

      // Try to get bagId from apartment or find it in bags state
      const bagId = apt.bagId || bags.find(b => b.apartmentId === apt.id)?.id;

      if (!bagId) {
        console.error('No bag found for apartment:', apt.name);
        alert('Erreur: Aucun sac associé à cet appartement. Veuillez vérifier la configuration de l\'appartement.');
        return;
      }

      const newMission: Mission = {
        id: crypto.randomUUID(),
        apartmentId: aptId,
        date,
        time,
        status: 'à_faire',
        bagId: bagId,
        createdAt: new Date().toISOString(),
        isManual: true
      };
      addMission(newMission);
      setIsCreateModalOpen(false);
    };
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Appartement"
          value={aptId}
          onChange={(e) => setAptId(e.target.value)}
          options={apartments.map((a) => ({
            value: a.id,
            label: a.name
          }))} />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required />

          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Heure</label>
            <input
              type="time"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required />

          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsCreateModalOpen(false)}>

            Annuler
          </Button>
          <Button type="submit">Créer</Button>
        </div>
      </form>);

  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Missions</h1>
        <div className="flex gap-2">
          <Select
            className="w-[180px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              {
                value: 'all',
                label: 'Toutes les missions'
              },
              {
                value: 'à_faire',
                label: 'À faire'
              },
              {
                value: 'en_cours',
                label: 'En cours'
              },
              {
                value: 'terminée',
                label: 'Terminée'
              },
              {
                value: 'annulée',
                label: 'Annulée'
              }]
            } />

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMissions.map((mission) => {
          const apt = apartments.find((a) => a.id === mission.apartmentId);
          const bag = bags.find((b) => b.id === mission.bagId);
          const agent = users.find((u) => u.id === mission.agentId);

          if (!apt || !bag) return null;

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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer une mission manuelle">

        <CreateMissionForm />
      </Modal>
    </div>);

}