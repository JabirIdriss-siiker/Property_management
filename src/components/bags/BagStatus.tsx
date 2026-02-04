import React from 'react';
import { Badge } from '../ui/Badge';
import { Bag } from '../../types';

interface BagStatusProps {
  status: Bag['status'];
}

export function BagStatus({ status }: BagStatusProps) {
  const config: Record<NonNullable<Bag['status']>, { label: string; variant: 'warning' | 'destructive' | 'success' | 'secondary' | 'info' }> = {
    à_préparer: {
      label: 'À préparer',
      variant: 'warning' as const
    },
    à_préparer_incomplet: {
      label: 'Incomplet',
      variant: 'destructive' as const
    },
    prêt: {
      label: 'Prêt',
      variant: 'success' as const
    },
    sale: {
      label: 'Sale',
      variant: 'secondary' as const
    },
    en_lavage: {
      label: 'En lavage',
      variant: 'info' as const
    }
  };

  // Handle undefined status with default fallback
  const statusConfig = status ? config[status] : { label: 'Unknown', variant: 'secondary' as const };
  const { label, variant } = statusConfig;

  return <Badge variant={variant}>{label}</Badge>;
}