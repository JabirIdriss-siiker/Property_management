import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter } from
'../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { BagStatus } from '../components/bags/BagStatus';
import { Bag, BagItem } from '../types';
import {
  ShoppingBag,
  Building2,
  Edit,
  Package,
  Plus,
  Minus,
  Save,
  RotateCcw } from
'lucide-react';
export function Bags() {
  const { bags, apartments, stock, updateBagStatus, updateBagItems } =
  useAppState();
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [editingItems, setEditingItems] = useState<BagItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const getApartmentName = (aptId: string) => {
    return apartments.find((a) => a.id === aptId)?.name || 'Inconnu';
  };
  const getStockItemName = (stockId: string) => {
    return stock.find((s) => s.id === stockId)?.name || 'Inconnu';
  };
  const getStockItem = (stockId: string) => {
    return stock.find((s) => s.id === stockId);
  };
  const handleEditBag = (bag: Bag) => {
    setSelectedBag(bag);
    setEditingItems([...bag.items]);
    setIsEditing(true);
  };
  const handleViewBag = (bag: Bag) => {
    setSelectedBag(bag);
    setIsEditing(false);
  };
  const handleSaveItems = () => {
    if (selectedBag) {
      updateBagItems(selectedBag.id, editingItems);
      setSelectedBag({
        ...selectedBag,
        items: editingItems
      });
      setIsEditing(false);
    }
  };
  const handleStatusChange = (bagId: string, status: Bag['status']) => {
    updateBagStatus(bagId, status);
  };
  const toggleItem = (stockItemId: string) => {
    const existing = editingItems.find((i) => i.stockItemId === stockItemId);
    if (existing) {
      setEditingItems(editingItems.filter((i) => i.stockItemId !== stockItemId));
    } else {
      setEditingItems([
      ...editingItems,
      {
        stockItemId,
        quantity: 1
      }]
      );
    }
  };
  const updateItemQuantity = (stockItemId: string, delta: number) => {
    setEditingItems(
      editingItems.map((i) => {
        if (i.stockItemId === stockItemId) {
          const newQty = Math.max(1, i.quantity + delta);
          return {
            ...i,
            quantity: newQty
          };
        }
        return i;
      })
    );
  };
  const statusOptions: Bag['status'][] = [
  'à_préparer',
  'à_préparer_incomplet',
  'prêt',
  'sale',
  'en_lavage'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Sacs
          </h1>
          <p className="text-muted-foreground mt-1">
            Chaque appartement possède un sac dédié avec son contenu standard
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {statusOptions.map((status) => {
          const count = bags.filter((b) => b.status === status).length;
          return (
            <Card key={status} className="text-center">
              <CardContent className="pt-6">
                <BagStatus status={status} />
                <p className="text-2xl font-bold mt-2">{count}</p>
              </CardContent>
            </Card>);

        })}
      </div>

      {/* Bags Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bags.map((bag) => {
          const apartment = apartments.find((a) => a.id === bag.apartmentId);
          if (!apartment) return null;
          return (
            <Card key={bag.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{apartment.name}</CardTitle>
                  </div>
                  <BagStatus status={bag.status} />
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{apartment.address}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bag Contents Preview */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Contenu ({bag.items.length} articles)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {bag.items.slice(0, 4).map((item, idx) =>
                    <Badge key={idx} variant="secondary" className="text-xs">
                        {getStockItemName(item.stockItemId)} x{item.quantity}
                      </Badge>
                    )}
                    {bag.items.length > 4 &&
                    <Badge variant="outline" className="text-xs">
                        +{bag.items.length - 4} autres
                      </Badge>
                    }
                  </div>
                </div>

                {/* Quick Status Change */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Changer le statut
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant={bag.status === 'prêt' ? 'primary' : 'outline'}
                      className="text-xs h-7"
                      onClick={() => handleStatusChange(bag.id, 'prêt')}>

                      Prêt
                    </Button>
                    <Button
                      size="sm"
                      variant={bag.status === 'sale' ? 'primary' : 'outline'}
                      className="text-xs h-7"
                      onClick={() => handleStatusChange(bag.id, 'sale')}>

                      Sale
                    </Button>
                    <Button
                      size="sm"
                      variant={
                      bag.status === 'en_lavage' ? 'primary' : 'outline'
                      }
                      className="text-xs h-7"
                      onClick={() => handleStatusChange(bag.id, 'en_lavage')}>

                      Lavage
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleViewBag(bag)}>

                  Voir détails
                </Button>
                <Button variant="outline" onClick={() => handleEditBag(bag)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>);

        })}
      </div>

      {/* Bag Detail/Edit Modal */}
      <Modal
        isOpen={!!selectedBag}
        onClose={() => {
          setSelectedBag(null);
          setIsEditing(false);
        }}
        title={isEditing ? 'Modifier le contenu du sac' : 'Détails du sac'}
        className="max-w-2xl">

        {selectedBag &&
        <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-semibold text-lg">
                  {getApartmentName(selectedBag.apartmentId)}
                </p>
                <p className="text-sm text-muted-foreground">Sac dédié</p>
              </div>
              <BagStatus status={selectedBag.status} />
            </div>

            {isEditing /* Edit Mode */ ?
          <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sélectionnez les articles à inclure dans ce sac
                </p>

                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {stock.map((item) => {
                const bagItem = editingItems.find(
                  (i) => i.stockItemId === item.id
                );
                const isSelected = !!bagItem;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 ${isSelected ? 'bg-primary/5' : ''}`}>

                        <div className="flex items-center gap-3">
                          <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 rounded" />

                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.category} • Stock: {item.quantity}
                            </p>
                          </div>
                        </div>

                        {isSelected &&
                    <div className="flex items-center gap-2">
                            <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => updateItemQuantity(item.id, -1)}>

                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {bagItem?.quantity}
                            </span>
                            <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => updateItemQuantity(item.id, 1)}>

                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                    }
                      </div>);

              })}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveItems}>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </div> /* View Mode */ :

          <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Contenu du sac</h3>
                  <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}>

                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </div>

                <div className="border rounded-lg divide-y">
                  {selectedBag.items.length === 0 ?
              <div className="p-8 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun article dans ce sac</p>
                    </div> :

              selectedBag.items.map((item, idx) => {
                const stockItem = getStockItem(item.stockItemId);
                const isLowStock =
                stockItem && stockItem.quantity < item.quantity;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3">

                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {getStockItemName(item.stockItemId)}
                              </p>
                              {stockItem &&
                        <p className="text-xs text-muted-foreground">
                                  Stock disponible: {stockItem.quantity}
                                </p>
                        }
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                        variant={isLowStock ? 'destructive' : 'secondary'}>

                              x{item.quantity}
                            </Badge>
                            {isLowStock &&
                      <Badge variant="warning" className="text-xs">
                                Stock insuffisant
                              </Badge>
                      }
                          </div>
                        </div>);

              })
              }
                </div>

                {/* Status Management */}
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-medium">Gestion du statut</h3>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) =>
                <Button
                  key={status}
                  size="sm"
                  variant={
                  selectedBag.status === status ? 'primary' : 'outline'
                  }
                  onClick={() => {
                    handleStatusChange(selectedBag.id, status);
                    setSelectedBag({
                      ...selectedBag,
                      status
                    });
                  }}>

                        {status === 'à_préparer' && 'À préparer'}
                        {status === 'à_préparer_incomplet' && 'Incomplet'}
                        {status === 'prêt' && 'Prêt'}
                        {status === 'sale' && 'Sale'}
                        {status === 'en_lavage' && 'En lavage'}
                      </Button>
                )}
                  </div>
                </div>
              </div>
          }
          </div>
        }
      </Modal>
    </div>);

}