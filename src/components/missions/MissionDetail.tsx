import React from 'react';
import { Mission, Apartment, User, Bag, StockItem } from '../../types';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { BagStatus } from '../bags/BagStatus';
import { Badge } from '../ui/Badge';
import { useAppState } from '../../hooks/useAppState';
import { useAuth } from '../../contexts/AuthContext';
interface MissionDetailProps {
  mission: Mission;
  apartment: Apartment;
  agent?: User;
  bag: Bag;
  onClose: () => void;
}
export function MissionDetail({
  mission,
  apartment,
  agent,
  bag,
  onClose
}: MissionDetailProps) {
  const { updateMissionStatus, assignAgent, users, stock } = useAppState();
  const { isAdmin } = useAuth();
  const agents = users.filter((u) => u.role === 'agent');
  const getStockItemName = (id: string) =>
    stock.find((s) => s.id === id)?.name || 'Inconnu';
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Date</p>
          <p className="font-medium">
            {mission.date} à {mission.time}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Appartement</p>
          <p className="font-medium">{apartment.name}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Adresse</p>
          <p className="font-medium">{apartment.address}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium">Gestion</h3>

        {isAdmin && (
          <Select
            label="Agent assigné"
            value={mission.agentId || ''}
            onChange={(e) => assignAgent(mission.id, e.target.value)}
            options={[
              {
                value: '',
                label: 'Choisir un agent...'
              },
              ...agents.map((a) => ({
                value: a.id,
                label: a.name
              }))
            ]}
          />
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Statut de la mission</label>
          <div className="flex flex-wrap gap-2">
            {!isAdmin && mission.status === 'terminée' ? (
              <Badge variant="success">Terminée</Badge>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={mission.status === 'à_faire' ? 'primary' : 'outline'}
                  onClick={() => updateMissionStatus(mission.id, 'à_faire')}
                  disabled={!isAdmin && mission.status !== 'à_faire'}
                >
                  À faire
                </Button>
                <Button
                  size="sm"
                  variant={mission.status === 'en_cours' ? 'primary' : 'outline'}
                  onClick={() => updateMissionStatus(mission.id, 'en_cours')}
                >
                  En cours
                </Button>
                <Button
                  size="sm"
                  variant={mission.status === 'terminée' ? 'primary' : 'outline'}
                  onClick={() => updateMissionStatus(mission.id, 'terminée')}
                >
                  Terminée
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant={mission.status === 'annulée' ? 'destructive' : 'outline'}
                    onClick={() => updateMissionStatus(mission.id, 'annulée')}
                  >
                    Annulée
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bag Details */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Contenu du sac</h3>
          <BagStatus status={bag.status} />
        </div>

        <div className="bg-muted/30 rounded-md p-4 space-y-2">
          {bag.items.map((item, idx) =>
            <div key={idx} className="flex justify-between text-sm">
              <span>{getStockItemName(item.stockItemId)}</span>
              <span className="font-medium">x{item.quantity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Codes */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <h4 className="text-blue-900 font-medium mb-2">Accès</h4>
        {apartment.hasCodeBox ?
          <p className="text-2xl font-mono text-blue-700">
            {apartment.codeBox}
          </p> :

          <p className="text-blue-700">Pas de code (Clés)</p>
        }
        {apartment.description &&
          <p className="text-sm text-blue-600 mt-2 border-t border-blue-200 pt-2">
            {apartment.description}
          </p>
        }
      </div>
    </div>);

}