import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { StockTable } from '../components/stock/StockTable';
import { StockFormModal } from '../components/stock/StockFormModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Package, Plus } from 'lucide-react';
import { StockItem } from '../types';

export function Stock() {
  const { stock, updateStockQuantity, addStockItem, updateStockItem, deleteStockItem } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const lingeItems = stock.filter((s) => s.category === 'linge');
  const consommableItems = stock.filter((s) => s.category === 'consommable');

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      await deleteStockItem(id);
    }
  };

  const handleSubmit = async (data: Partial<StockItem>) => {
    if (editingItem) {
      await updateStockItem(data);
    } else {
      await addStockItem(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Gestion du Stock</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Article
        </Button>
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
              onUpdateQuantity={updateStockQuantity}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
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
              onUpdateQuantity={updateStockQuantity}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>

      <StockFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingItem}
      />
    </div>
  );
}