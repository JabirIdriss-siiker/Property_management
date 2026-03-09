
import { Database } from '../types/database.types';
import { vi } from 'vitest';

export type Apartment = Database['public']['Tables']['apartments']['Row'];
export type Bag = Database['public']['Tables']['bags']['Row'];
export type BagItem = Database['public']['Tables']['bag_items']['Row'];
export type Mission = Database['public']['Tables']['missions']['Row'];
export type StockItem = Database['public']['Tables']['stock_items']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Reservation = Database['public']['Tables']['reservations']['Row'];

// --- Mock Data Store ---

export const mockApartments: Apartment[] = [
    {
        id: 'apk-1',
        name: 'Studio Marais',
        address: '12 Rue des Rosiers',
        description: 'Charming studio',
        has_code_box: true,
        code_box: '1234',
        cleaning_price: 40,
        bed_count: 1,
        coffee_type: 'nespresso',
        is_active: true,
        ical_link: 'https://airbnb.com/calendar/123',
        ical_last_sync: '2024-01-01T10:00:00Z',
        ical_sync_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 'apk-2',
        name: 'Loft Bastille',
        address: '45 Rue de la Roquette',
        description: 'Spacious loft',
        has_code_box: false,
        code_box: null,
        cleaning_price: 60,
        bed_count: 2,
        coffee_type: 'senseo',
        is_active: true,
        ical_link: null,
        ical_last_sync: null,
        ical_sync_enabled: false,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
    }
];

export const mockBags: Bag[] = [
    {
        id: 'bag-1',
        apartment_id: 'apk-1',
        status: 'prêt',
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 'bag-2',
        apartment_id: 'apk-2',
        status: 'à_préparer',
        notes: 'Missing towels',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
    }
];

export const mockStockItems: StockItem[] = [
    {
        id: 'stock-1',
        name: 'Serviette Bain',
        category: 'linge',
        quantity: 50,
        alert_threshold: 10,
        unit: 'unité',
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 'stock-2',
        name: 'Dosette Nespresso',
        category: 'consommable',
        quantity: 5, // Below threshold
        alert_threshold: 20,
        unit: 'boite',
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    }
];

export const mockBagItems: BagItem[] = [
    {
        id: 'bi-1',
        bag_id: 'bag-1',
        stock_item_id: 'stock-1',
        quantity: 2,
        created_at: '2024-01-01T00:00:00Z'
    }
];

export const mockProfiles: Profile[] = [
    {
        id: 'user-admin',
        auth_id: 'auth-admin',
        email: 'admin@apios.com',
        name: 'Alice Admin',
        role: 'admin',
        phone: null,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 'user-agent',
        auth_id: 'auth-agent',
        email: 'bob@apios.com',
        name: 'Bob Agent',
        role: 'agent',
        phone: '0600000000',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    }
];

export const mockMissions: Mission[] = [
    {
        id: 'mission-1',
        apartment_id: 'apk-1',
        bag_id: 'bag-1',
        agent_id: 'user-agent',
        reservation_id: null,
        scheduled_date: '2024-02-01',
        scheduled_time: '11:00',
        status: 'à_faire',
        started_at: null,
        completed_at: null,
        is_manual: true,
        notes: null,
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z'
    }
];


// --- Mock Client Factory ---

export const createMockSupabase = () => {
    return {
        from: vi.fn((table) => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn(),
            filter: vi.fn().mockReturnThis(),
        })),
        auth: {
            getUser: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        }
    };
};
