import { useState, useEffect } from 'react';
import { Bag } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { Button } from '../ui/Button';

interface BagChecklistFormProps {
  bag: Bag;
  onSuccess?: () => void;
}

export function BagChecklistForm({ bag, onSuccess }: BagChecklistFormProps) {
  const { stock, prepareBag } = useAppState();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStockItemName = (id: string) => stock.find((s) => s.id === id)?.name || 'Inconnu';

  // Initialize checks if bag is already prêt
  useEffect(() => {
    if (bag.status === 'prêt') {
      setCheckedItems(new Set(bag.items.map(i => i.id as string).filter(Boolean)));
    }
  }, [bag.status, bag.items]);

  const toggleCheck = (id: string) => {
    if (bag.status === 'prêt' || bag.status === 'sale' || bag.status === 'en_lavage') return;
    
    const next = new Set(checkedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedItems(next);
  };

  const allChecked = bag.items.length > 0 && checkedItems.size === bag.items.length;
  const isReadOnly = bag.status === 'prêt' || bag.status === 'sale' || bag.status === 'en_lavage';

  const handleValidate = async () => {
    if (!allChecked || isReadOnly) return;
    try {
      setIsSubmitting(true);
      await prepareBag(bag.id, bag.items);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la préparation du sac");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-md p-4 space-y-3">
        {bag.items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Ce sac est vide.</p>
        ) : (
          bag.items.map((item) => {
            const isChecked = checkedItems.has(item.id as string);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-md border transition-colors ${
                  isChecked ? 'bg-primary/5 border-primary/20' : 'bg-background border-border hover:border-primary/30'
                } ${isReadOnly ? 'opacity-80' : 'cursor-pointer'}`}
                onClick={() => { if (item.id) toggleCheck(item.id) }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'
                  }`}>
                    {isChecked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${isChecked && !isReadOnly ? 'font-medium' : ''}`}>
                    {getStockItemName(item.stockItemId)}
                  </span>
                </div>
                <span className="font-semibold text-sm mr-2 text-muted-foreground">x{item.quantity}</span>
              </div>
            );
          })
        )}
      </div>

      {!isReadOnly && bag.items.length > 0 && (
        <Button 
          className="w-full" 
          disabled={!allChecked || isSubmitting} 
          onClick={handleValidate}
        >
          {isSubmitting ? 'Validation...' : 'Valider la préparation'}
        </Button>
      )}
      
      {bag.status === 'prêt' && (
        <p className="text-sm text-center text-green-600 font-medium bg-green-50 p-2 rounded-md">
          ✓ Sac préparé et stock déduit
        </p>
      )}
    </div>
  );
}
