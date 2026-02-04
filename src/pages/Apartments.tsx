import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { ApartmentCard } from '../components/apartments/ApartmentCard';
import { Modal } from '../components/ui/Modal';
import { ApartmentForm } from '../components/apartments/ApartmentForm';
import { Apartment } from '../types';
export function Apartments() {
  const { apartments, bags } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<
    Apartment | undefined>(
    undefined);
  const handleEdit = (apt: Apartment) => {
    setEditingApartment(apt);
    setIsModalOpen(true);
  };
  const handleClose = () => {
    setIsModalOpen(false);
    setEditingApartment(undefined);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Appartements</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apartments.map((apt) => {
          const bag = bags.find((b) => b.id === apt.bagId)!;
          return (
            <ApartmentCard
              key={apt.id}
              apartment={apt}
              bag={bag}
              onEdit={handleEdit} />);


        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={
        editingApartment ? "Modifier l'appartement" : 'Nouvel appartement'
        }>

        <ApartmentForm apartment={editingApartment} onClose={handleClose} />
      </Modal>
    </div>);

}