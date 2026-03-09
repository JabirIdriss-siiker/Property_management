import React, { useState, useMemo } from 'react';
import {
  isToday,
  isTomorrow,
  isThisWeek,
  isWithinInterval,
  parseISO,
  startOfDay,
  addDays,
  format,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppState } from '../hooks/useAppState';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MapPin, Clock, CheckCircle, Play, AlertTriangle, CalendarDays } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { MissionDetail } from '../components/missions/MissionDetail';
import { Mission } from '../types';

type Tab = 'today' | 'tomorrow' | 'week' | 'range';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'today', label: "Aujourd'hui", emoji: '☀️' },
  { key: 'tomorrow', label: 'Demain', emoji: '🌅' },
  { key: 'week', label: 'Semaine', emoji: '📅' },
  { key: 'range', label: 'Plage', emoji: '🔍' },
];

const statusConfig = {
  à_faire:  { label: 'À faire',  variant: 'secondary' as const },
  en_cours: { label: 'En cours', variant: 'info'      as const },
  terminée: { label: 'Terminée', variant: 'success'   as const },
  annulée:  { label: 'Annulée',  variant: 'destructive' as const },
};

export function AgentView() {
  const { missions, apartments, bags, users, currentUser, updateMissionStatus } = useAppState();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');

  // Base list: agent's missions (non-cancelled), sorted by date then time
  const myMissions = useMemo(
    () =>
      missions
        .filter(
          (m) =>
            (currentUser?.role === 'admin' || m.agentId === currentUser?.id) &&
            m.status !== 'annulée'
        )
        .sort((a, b) => {
          const d = a.date.localeCompare(b.date);
          return d !== 0 ? d : a.time.localeCompare(b.time);
        }),
    [missions, currentUser]
  );

  // Counts per tab (for badge display)
  const counts = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      today:    myMissions.filter((m) => isToday(parseISO(m.date))).length,
      tomorrow: myMissions.filter((m) => isTomorrow(parseISO(m.date))).length,
      week:     myMissions.filter((m) => isThisWeek(parseISO(m.date), { weekStartsOn: 1 })).length,
      range:    (() => {
        if (!rangeFrom && !rangeTo) return myMissions.length;
        const from = rangeFrom ? parseISO(rangeFrom) : today;
        const to   = rangeTo   ? startOfDay(addDays(parseISO(rangeTo), 1)) : addDays(from, 1);
        return myMissions.filter((m) =>
          isWithinInterval(parseISO(m.date), { start: from, end: to })
        ).length;
      })(),
    };
  }, [myMissions, rangeFrom, rangeTo]);

  // Filtered list for current tab
  const filtered = useMemo(() => {
    const today = startOfDay(new Date());
    switch (activeTab) {
      case 'today':    return myMissions.filter((m) => isToday(parseISO(m.date)));
      case 'tomorrow': return myMissions.filter((m) => isTomorrow(parseISO(m.date)));
      case 'week':     return myMissions.filter((m) => isThisWeek(parseISO(m.date), { weekStartsOn: 1 }));
      case 'range': {
        if (!rangeFrom && !rangeTo) return myMissions;
        const from = rangeFrom ? parseISO(rangeFrom) : today;
        const to   = rangeTo   ? startOfDay(addDays(parseISO(rangeTo), 1)) : addDays(from, 1);
        return myMissions.filter((m) =>
          isWithinInterval(parseISO(m.date), { start: from, end: to })
        );
      }
    }
  }, [myMissions, activeTab, rangeFrom, rangeTo]);

  // For 'week' tab: group by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Mission[]>();
    for (const m of filtered) {
      const key = m.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // --- Mission card ---
  const MissionItem = ({ mission }: { mission: Mission }) => {
    const apt = apartments.find((a) => a.id === mission.apartmentId)!;
    const bag = bags.find((b) => b.id === mission.bagId)!;
    if (!apt || !bag) return null;
    const status = statusConfig[mission.status] ?? statusConfig['à_faire'];

    return (
      <Card
        className="cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
        onClick={() => setSelectedMission(mission)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Appartement</p>
              <h3 className="font-bold text-base leading-tight">{apt.name}</h3>
            </div>
            <Badge variant={status.variant} className="shrink-0 mt-0.5">
              {status.label}
            </Badge>
          </div>

          {/* Time + address */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">{mission.time}</span>
              {(activeTab === 'week' || activeTab === 'range') && (
                <span className="text-xs text-muted-foreground capitalize ml-1">
                  — {format(parseISO(mission.date), 'EEEE d MMM', { locale: fr })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{apt.address}</span>
            </div>
          </div>

          {/* Bag alert */}
          {bag.status === 'à_préparer_incomplet' && mission.status !== 'terminée' && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Sac incomplet — vérifiez avant la mission
            </div>
          )}

          {/* Actions */}
          {mission.status !== 'terminée' && (
            <div className="flex gap-2 pt-1">
              {mission.status === 'à_faire' && (
                <Button
                  className="w-full"
                  onClick={(e) => { e.stopPropagation(); updateMissionStatus(mission.id, 'en_cours'); }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Commencer
                </Button>
              )}
              {mission.status === 'en_cours' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={(e) => { e.stopPropagation(); updateMissionStatus(mission.id, 'terminée'); }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terminer
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const firstName = currentUser?.name.split(' ')[0] ?? '';

  return (
    <div className="max-w-md mx-auto pb-24 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Bonjour {firstName} 👋</h1>
        <p className="text-muted-foreground text-sm">Votre planning de missions</p>
      </div>

      {/* Tab bar */}
      <nav className="flex gap-1 p-1 bg-muted rounded-xl">
        {TABS.map(({ key, label, emoji }) => {
          const count = counts[key];
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                flex-1 flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all duration-150
                ${active
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              <span className="text-base leading-none mb-0.5">{emoji}</span>
              <span className="leading-tight">{label}</span>
              {count > 0 && (
                <span className={`mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Range date pickers */}
      {activeTab === 'range' && (
        <div className="flex flex-col gap-2 p-4 bg-muted/40 border border-border rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Choisissez une plage
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Du</label>
              <input
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Au</label>
              <input
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={rangeTo}
                min={rangeFrom}
                onChange={(e) => setRangeTo(e.target.value)}
              />
            </div>
          </div>
          {(rangeFrom || rangeTo) && (
            <button
              onClick={() => { setRangeFrom(''); setRangeTo(''); }}
              className="self-start text-xs text-muted-foreground hover:text-foreground underline"
            >
              Effacer la plage
            </button>
          )}
        </div>
      )}

      {/* Mission list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm bg-muted/20 rounded-xl">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Aucune mission sur cette période
          </div>
        ) : activeTab === 'week' || activeTab === 'range' ? (
          // Grouped by date for multi-day views
          groupedByDate.map(([date, group]) => (
            <section key={date} className="space-y-2">
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide capitalize">
                  {format(parseISO(date), 'EEEE d MMMM', { locale: fr })}
                </span>
                <span className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground">{group.length}</span>
              </div>
              {group.map((m) => <MissionItem key={m.id} mission={m} />)}
            </section>
          ))
        ) : (
          // Flat list for today / tomorrow
          filtered.map((m) => <MissionItem key={m.id} mission={m} />)
        )}
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!selectedMission} onClose={() => setSelectedMission(null)} title="Détails Mission">
        {selectedMission && (
          <MissionDetail
            mission={selectedMission}
            apartment={apartments.find((a) => a.id === selectedMission.apartmentId)!}
            bag={bags.find((b) => b.id === selectedMission.bagId)!}
            agent={users.find((u) => u.id === selectedMission.agentId)}
            onClose={() => setSelectedMission(null)}
          />
        )}
      </Modal>
    </div>
  );
}