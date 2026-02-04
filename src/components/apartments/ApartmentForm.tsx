import React, { useState } from 'react';
import { Apartment, StockItem } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAppState } from '../../hooks/useAppState';
interface ApartmentFormProps {
  apartment?: Apartment;
  onClose: () => void;
}
export function ApartmentForm({ apartment, onClose }: ApartmentFormProps) {
  const { addApartment, updateApartment, stock } = useAppState();
  // Form state
  const [name, setName] = useState(apartment?.name || '');
  const [address, setAddress] = useState(apartment?.address || '');
  const [description, setDescription] = useState(apartment?.description || '');
  const [hasCodeBox, setHasCodeBox] = useState(apartment?.hasCodeBox || false);
  const [codeBox, setCodeBox] = useState(apartment?.codeBox || '');
  const [iCalLink, setICalLink] = useState(apartment?.iCalLink || '');
  const [cleaningPrice, setCleaningPrice] = useState(
    apartment?.cleaningPrice?.toString() || '0'
  );
  const [bedCount, setBedCount] = useState(
    apartment?.bedCount?.toString() || '1'
  );
  const [coffeeType, setCoffeeType] = useState<Apartment['coffeeType']>(
    apartment?.coffeeType || 'none'
  );
  // Bag configuration state (only for new apartments)
  const [bagItems, setBagItems] = useState<
    {
      stockItemId: string;
      quantity: number;
    }[]>(
    []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const aptData: Apartment = {
      id: apartment?.id || Math.random().toString(36).substr(2, 9),
      name,
      address,
      description: description || undefined,
      hasCodeBox,
      codeBox: hasCodeBox ? codeBox : undefined,
      iCalLink: iCalLink || undefined,
      cleaningPrice: Number(cleaningPrice),
      bedCount: Number(bedCount),
      coffeeType,
      bagId: apartment?.bagId || Math.random().toString(36).substr(2, 9),
      createdAt: apartment?.createdAt || new Date().toISOString()
    };
    if (apartment) {
      updateApartment(aptData);
    } else {
      addApartment(aptData, bagItems);
    }
    onClose();
  };
  const toggleBagItem = (stockItemId: string) => {
    const existing = bagItems.find((i) => i.stockItemId === stockItemId);
    if (existing) {
      setBagItems(bagItems.filter((i) => i.stockItemId !== stockItemId));
    } else {
      setBagItems([
      ...bagItems,
      {
        stockItemId,
        quantity: 1
      }]
      );
    }
  };
  const updateBagItemQuantity = (stockItemId: string, qty: number) => {
    setBagItems(
      bagItems.map((i) =>
      i.stockItemId === stockItemId ?
      {
        ...i,
        quantity: qty
      } :
      i
      )
    );
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Informations Générales
        </h3>
        <Input
          label="Nom de l'appartement"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required />

        <Input
          label="Adresse complète"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required />

        <Input
          label="Notes internes"
          value={description}
          onChange={(e) => setDescription(e.target.value)} />


        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prix ménage (€)"
            type="number"
            value={cleaningPrice}
            onChange={(e) => setCleaningPrice(e.target.value)}
            required />

          <Input
            label="Nombre de lits"
            type="number"
            value={bedCount}
            onChange={(e) => setBedCount(e.target.value)}
            required />

        </div>

        <Select
          label="Type de machine à café"
          value={coffeeType}
          onChange={(e) => setCoffeeType(e.target.value as any)}
          options={[
          {
            value: 'none',
            label: 'Aucune'
          },
          {
            value: 'nespresso',
            label: 'Nespresso'
          },
          {
            value: 'senseo',
            label: 'Senseo'
          },
          {
            value: 'filter',
            label: 'Filtre'
          },
          {
            value: 'other',
            label: 'Autre'
          }]
          } />


        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasCodeBox"
            checked={hasCodeBox}
            onChange={(e) => setHasCodeBox(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300" />

          <label htmlFor="hasCodeBox" className="text-sm font-medium">
            Boîtier à clés / Serrure connectée
          </label>
        </div>

        {hasCodeBox &&
        <Input
          label="Code d'accès"
          value={codeBox}
          onChange={(e) => setCodeBox(e.target.value)} />

        }
      </div>

      {/* iCal Section */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Synchronisation Calendrier
        </h3>
        <Input
          label="Lien iCal (Airbnb, Booking, etc.)"
          placeholder="https://www.airbnb.com/calendar/ical/..."
          value={iCalLink}
          onChange={(e) => setICalLink(e.target.value)} />

        <p className="text-xs text-muted-foreground">
          Collez le lien iCal de votre plateforme de réservation pour
          synchroniser automatiquement les check-outs et créer les missions de
          ménage.
        </p>
      </div>

      {!apartment &&
      <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Configuration du Sac Dédié
          </h3>
          <p className="text-xs text-muted-foreground">
            Sélectionnez les éléments standards à inclure dans le sac de cet
            appartement.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
            {stock.map((item) => {
            const bagItem = bagItems.find((i) => i.stockItemId === item.id);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-accent rounded-sm">

                  <div className="flex items-center gap-2">
                    <input
                    type="checkbox"
                    checked={!!bagItem}
                    onChange={() => toggleBagItem(item.id)}
                    className="h-4 w-4" />

                    <span className="text-sm">{item.name}</span>
                  </div>
                  {bagItem &&
                <input
                  type="number"
                  min="1"
                  value={bagItem.quantity}
                  onChange={(e) =>
                  updateBagItemQuantity(item.id, parseInt(e.target.value))
                  }
                  className="w-16 h-8 text-sm border rounded px-1" />

                }
                </div>);

          })}
          </div>
        </div>
      }

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>);

}