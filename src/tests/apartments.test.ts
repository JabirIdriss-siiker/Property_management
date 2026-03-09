
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApartments, getApartment, createApartment, updateICalLink } from '../services/apartments.service';
import { mockApartments, mockBags } from './supabase-mock';

// Mock Supabase client
vi.mock('../lib/supabaseClient', async () => {
    const { createMockSupabase } = await import('./supabase-mock');
    return {
        supabase: createMockSupabase()
    };
});

import { supabase } from '../lib/supabaseClient';

describe('Apartments Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getApartments', () => {
        it('should fetch apartments and transform bag relation', async () => {
            // Mock return data: Apartments with a nested "bag" array (aliased in query)
            const mockReturnData = mockApartments.map(apt => ({
                ...apt,
                bag: mockBags.filter(b => b.apartment_id === apt.id)
            }));

            // Setup mock chain
            const fromMock = vi.spyOn(supabase, 'from');
            const orderMock = vi.fn().mockResolvedValue({ data: mockReturnData, error: null });
            const eqMock = vi.fn().mockReturnValue({ order: orderMock });
            const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

            fromMock.mockReturnValue({ select: selectMock } as any);

            const result = await getApartments();

            expect(fromMock).toHaveBeenCalledWith('apartments');
            expect(result).toHaveLength(mockApartments.length);
            // Verify transformation: bag property should be an object, not an array
            expect(result[0].bag).toBeDefined();
            expect(result[0].bag?.id).toBe('bag-1');
        });
    });

    describe('getApartment', () => {
        it('should fetch single apartment and transform bag relation', async () => {
            const targetApt = mockApartments[0];
            const targetBag = mockBags.find(b => b.apartment_id === targetApt.id);
            const mockReturnData = {
                ...targetApt,
                bag: [targetBag]
            };

            const fromMock = vi.spyOn(supabase, 'from');
            const singleMock = vi.fn().mockResolvedValue({ data: mockReturnData, error: null });
            const eqMock = vi.fn().mockReturnValue({ single: singleMock });
            const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

            fromMock.mockReturnValue({ select: selectMock } as any);

            const result = await getApartment(targetApt.id);

            expect(result).toBeDefined();
            expect(result?.id).toBe(targetApt.id);
            // Bag should be a single object
            expect(result?.bag).toEqual(targetBag);
        });
    });

    describe('createApartment', () => {
        it('should create apartment and return with auto-created bag', async () => {
            const newAptData = {
                name: 'New Apt',
                address: '123 New St',
                cleaning_price: 50,
                bed_count: 1
            };
            const createdApt = { ...newAptData, id: 'new-apt-id' };
            const autoCreatedBag = { id: 'new-bag-id', apartment_id: 'new-apt-id', status: 'à_préparer' };

            const fromMock = vi.spyOn(supabase, 'from');

            // 1. Insert Apartment Mock
            const insertSelectMock = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: createdApt, error: null }) });
            const insertMock = vi.fn().mockReturnValue({ select: insertSelectMock });

            // 2. Fetch Bag Mock (The service fetches the bag after creation)
            const bagSelectMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: autoCreatedBag, error: null })
                })
            });

            // We need to differentiate calls to .from('apartments') and .from('bags')
            fromMock.mockImplementation((table: string) => {
                if (table === 'apartments') {
                    return { insert: insertMock, select: vi.fn() } as any;
                }
                if (table === 'bags') {
                    return { select: bagSelectMock } as any;
                }
                return {} as any;
            });

            const result = await createApartment(newAptData as any);

            expect(result.id).toBe('new-apt-id');
            expect(result.bag).toEqual(autoCreatedBag);
        });
    });

    describe('updateICalLink', () => {
        it('should update ical link and last sync time', async () => {
            const aptId = 'apt-1';
            const newLink = 'https://new-ical.com';
            const updatedApt = { ...mockApartments[0], ical_link: newLink };

            const fromMock = vi.spyOn(supabase, 'from');
            const updateSelectMock = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: updatedApt, error: null }) });
            const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: updateSelectMock }) });

            fromMock.mockReturnValue({ update: updateMock } as any);

            const result = await updateICalLink(aptId, newLink);

            expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
                ical_link: newLink,
                // We verify that ical_last_sync is set (string), checking exact time is brittle
                ical_last_sync: expect.any(String)
            }));
            expect(result.ical_link).toBe(newLink);
        });
    });
});
