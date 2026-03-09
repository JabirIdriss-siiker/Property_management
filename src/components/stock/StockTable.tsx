
import React from 'react';
import { StockItem } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AlertTriangle, CheckCircle, AlertOctagon, Pencil, Trash2 } from 'lucide-react';

interface StockTableProps {
  items: StockItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
}

export function StockTable({ items, onUpdateQuantity, onEdit, onDelete }: StockTableProps) {
  const getStatus = (item: StockItem) => {
    if (item.quantity === 0)
      return {
        label: 'Rupture',
        variant: 'destructive' as const,
        icon: AlertOctagon
      };
    if (item.quantity <= item.alertThreshold)
      return {
        label: 'Alerte',
        variant: 'warning' as const,
        icon: AlertTriangle
      };
    return {
      label: 'OK',
      variant: 'success' as const,
      icon: CheckCircle
    };
  };

  return (
    <div className="w-full overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Article
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Catégorie
            </th>
            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
              Quantité
            </th>
            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
              Seuil Alerte
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Statut
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const status = getStatus(item);
            const StatusIcon = status.icon;
            return (
              <tr
                key={item.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4 capitalize text-muted-foreground">
                  {item.category}
                </td>
                <td className="p-4 text-center font-bold text-lg">
                  {item.quantity}
                </td>
                <td className="p-4 text-center text-muted-foreground">
                  {item.alertThreshold}
                </td>
                <td className="p-4">
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 text-primary-foreground">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-8 bg-border mx-2" />

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 text-foreground"
                      onClick={() =>
                        onUpdateQuantity(
                          item.id,
                          Math.max(0, item.quantity - 1)
                        )
                      }
                    >
                      -
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 text-foreground"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}