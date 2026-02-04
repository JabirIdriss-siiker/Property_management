import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { StockTable } from '../components/stock/StockTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Package } from 'lucide-react';
export function Stock() {
  const { stock, updateStockQuantity } = useAppState();
  const lingeItems = stock.filter((s) => s.category === 'linge');
  const consommableItems = stock.filter((s) => s.category === 'consommable');
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Gestion du Stock</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Linge & Textiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StockTable
              items={lingeItems}
              onUpdateQuantity={updateStockQuantity} />

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Consommables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StockTable
              items={consommableItems}
              onUpdateQuantity={updateStockQuantity} />

          </CardContent>
        </Card>
      </div>
    </div>);

}