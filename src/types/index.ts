// Frontend types aligned with database schema
// Database columns use snake_case, frontend uses camelCase

export interface Apartment {
  id: string;
  name: string;
  address: string;
  description?: string;
  hasCodeBox: boolean;
  codeBox?: string;
  iCalLink?: string;
  iCalLastSync?: string;
  iCalSyncEnabled?: boolean;
  cleaningPrice: number;
  bedCount: number;
  coffeeType: 'none' | 'nespresso' | 'senseo' | 'filter' | 'other';
  isActive?: boolean;
  bagId?: string; // Optional since it might not be loaded with apartment data
  createdAt: string;
  updatedAt?: string;
}

export interface Bag {
  id: string;
  apartmentId: string;
  status?: 'à_préparer' | 'à_préparer_incomplet' | 'prêt' | 'sale' | 'en_lavage';
  items: BagItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BagItem {
  id?: string;
  stockItemId: string;
  quantity: number;
  createdAt?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: 'linge' | 'consommable';
  quantity: number;
  alertThreshold: number;
  unit?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Mission {
  id: string;
  apartmentId: string;
  bagId: string;
  agentId?: string;
  reservationId?: string;
  date: string; // scheduled_date - ISO Date string
  time: string; // scheduled_time
  status: 'à_faire' | 'en_cours' | 'terminée' | 'annulée';
  startedAt?: string;
  completedAt?: string;
  isManual: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Reservation {
  id: string;
  apartmentId: string;
  icalUid?: string;
  summary?: string;
  checkIn: string; // ISO Date string
  checkOut: string; // ISO Date string
  source?: string;
  rawData?: Record<string, any>; // JSONB
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  authId?: string;
  name: string;
  role: 'admin' | 'agent';
  email: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AppState = {
  apartments: Apartment[];
  bags: Bag[];
  stock: StockItem[];
  missions: Mission[];
  reservations: Reservation[];
  users: User[];
  currentUser: User | null;
};