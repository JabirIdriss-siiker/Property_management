import React, { useState, useMemo } from 'react';
import {
  startOfDay,
  addDays,
  isWithinInterval,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
} from 'date-fns';
import { useAppState } from '../hooks/useAppState';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { MissionCard } from '../components/missions/MissionCard';
import { MissionDateGroup } from '../components/missions/MissionDateGroup';
import { Modal } from '../components/ui/Modal';
import { MissionDetail } from '../components/missions/MissionDetail';
import { Mission } from '../types';
import { Select } from '../components/ui/Select';

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'range';

function matchesDateFilter(mission: Mission, filter: DateFilter, range: { from: string; to: string }): boolean {
  const date = parseISO(mission.date);
  const today = startOfDay(new Date());
  switch (filter) {
    case 'today':
      return isToday(date);
    case 'tomorrow':
      return isTomorrow(date);
    case 'week':
      return isThisWeek(date, { weekStartsOn: 1 });
    case 'range': {
      if (!range.from && !range.to) return true;
      const from = range.from ? parseISO(range.from) : today;
      const to = range.to ? startOfDay(addDays(parseISO(range.to), 1)) : addDays(from, 1);
      return isWithinInterval(date, { start: from, end: to });
    }
    default:
      return true;
  }
}

function groupByDate(missions: Mission[]): { date: string; missions: Mission[] }[] {
  const map = new Map<string, Mission[]>();
  for (const m of missions) {
    const key = m.date.slice(0, 10); // 'YYYY-MM-DD'
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  // Sort groups ascending (closest date first)
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, missions]) => ({ date, missions }));
}

export function Missions() {
  const { missions, apartments, bags, users, addMission } = useAppState();

  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<DateFilter>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredMissions = useMemo(() => {
    return missions
      .filter((m) => filterStatus === 'all' || m.status === filterStatus)
      .filter((m) => matchesDateFilter(m, filterDate, dateRange))
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }, [missions, filterStatus, filterDate, dateRange]);

  const grouped = useMemo(() => groupByDate(filteredMissions), [filteredMissions]);

  // --- Create mission form ---
  const CreateMissionForm = () => {
    const [aptId, setAptId] = useState(apartments[0]?.id || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('11:00');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const apt = apartments.find((a) => a.id === aptId);
      if (!apt) return;
      const bagId = apt.bagId || bags.find((b) => b.apartmentId === apt.id)?.id;
      if (!bagId) {
        alert("Erreur : Aucun sac associé à cet appartement. Veuillez vérifier la configuration de l'appartement.");
        return;
      }
      const newMission: Mission = {
        id: crypto.randomUUID(),
        apartmentId: aptId,
        date,
        time,
        status: 'à_faire',
        bagId,
        createdAt: new Date().toISOString(),
        isManual: true,
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
          options={apartments.map((a) => ({ value: a.id, label: a.name }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Heure</label>
            <input
              type="time"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">Créer</Button>
        </div>
      </form>
    );
  };

  const DATE_PILLS: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'today', label: "Aujourd'hui" },
    { key: 'tomorrow', label: 'Demain' },
    { key: 'week', label: 'Cette semaine' },
    { key: 'range', label: 'Plage…' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Missions</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 p-4 bg-muted/40 rounded-xl border border-border">
        {/* Date pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">Date</span>
          {DATE_PILLS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterDate(key)}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-all duration-150
                ${filterDate === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background text-muted-foreground border border-border hover:border-primary hover:text-primary'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date range inputs (visible only when 'range' is selected) */}
        {filterDate === 'range' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Du</label>
              <input
                type="date"
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={dateRange.from}
                onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Au</label>
              <input
                type="date"
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={dateRange.to}
                min={dateRange.from}
                onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
              />
            </div>
            {(dateRange.from || dateRange.to) && (
              <button
                onClick={() => setDateRange({ from: '', to: '' })}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Effacer
              </button>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">Statut</span>
          <Select
            className="w-[180px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'à_faire', label: 'À faire' },
              { value: 'en_cours', label: 'En cours' },
              { value: 'terminée', label: 'Terminée' },
              { value: 'annulée', label: 'Annulée' },
            ]}
          />
        </div>
      </div>

      {/* Results summary */}
      <p className="text-sm text-muted-foreground">
        {filteredMissions.length === 0
          ? 'Aucune mission trouvée.'
          : `${filteredMissions.length} mission${filteredMissions.length > 1 ? 's' : ''} trouvée${filteredMissions.length > 1 ? 's' : ''}`}
      </p>

      {/* Grouped missions */}
      <div className="space-y-8">
        {grouped.map(({ date, missions: groupMissions }) => {
          return (
            <MissionDateGroup key={date} date={date} count={groupMissions.length}>
              {groupMissions.map((mission) => {
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
                    onClick={() => setSelectedMission(mission)}
                  />
                );
              })}
            </MissionDateGroup>
          );
        })}
      </div>

      {/* Mission detail modal */}
      <Modal isOpen={!!selectedMission} onClose={() => setSelectedMission(null)} title="Détails de la mission">
        {selectedMission && (() => {
          const liveMission = missions.find(m => m.id === selectedMission.id) ?? selectedMission;
          return (
            <MissionDetail
              mission={liveMission}
              apartment={apartments.find((a) => a.id === liveMission.apartmentId)!}
              bag={bags.find((b) => b.id === liveMission.bagId)!}
              agent={users.find((u) => u.id === liveMission.agentId)}
              onClose={() => setSelectedMission(null)}
            />
          );
        })()}
      </Modal>

      {/* Create mission modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer une mission manuelle"
      >
        <CreateMissionForm />
      </Modal>
    </div>
  );
}