
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { StockItem } from '../../types';

interface StockFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<StockItem>) => Promise<void>;
    initialData?: StockItem | null;
}

export function StockFormModal({ isOpen, onClose, onSubmit, initialData }: StockFormModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'linge' | 'consommable'>('consommable');
    const [quantity, setQuantity] = useState(0);
    const [alertThreshold, setAlertThreshold] = useState(5);
    const [unit, setUnit] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setCategory(initialData.category);
            setQuantity(initialData.quantity);
            setAlertThreshold(initialData.alertThreshold);
            setUnit(initialData.unit || '');
        } else {
            // Reset defaults for new item
            setName('');
            setCategory('consommable');
            setQuantity(0);
            setAlertThreshold(5);
            setUnit('');
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({
                id: initialData?.id, // undefined if new
                name,
                category,
                quantity: Number(quantity),
                alertThreshold: Number(alertThreshold),
                unit: unit || undefined,
            });
            onClose();
        } catch (error) {
            console.error('Failed to save stock item:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Modifier l\'article' : 'Nouvel article'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Nom de l'article</label>
                    <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Serviette de bain"
                    />
                </div>

                <div>
                    <Select
                        label="Catégorie"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        options={[
                            { value: 'linge', label: 'Linge & Textiles' },
                            { value: 'consommable', label: 'Consommables' },
                        ]}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Quantité initiale</label>
                        <Input
                            type="number"
                            min="0"
                            required
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Seuil d'alerte</label>
                        <Input
                            type="number"
                            min="0"
                            required
                            value={alertThreshold}
                            onChange={(e) => setAlertThreshold(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium">Unité (optionnel)</label>
                    <Input
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="Ex: pièces, rouleaux..."
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
