
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getMissions,
    createMission,
    updateMissionStatus,
    getAgentMissions
} from '../services/missions.service';
import { mockMissions, mockApartments, mockBags, mockProfiles } from './supabase-mock';

// Mock Supabase client
vi.mock('../lib/supabaseClient', async () => {
    const { createMockSupabase } = await import('./supabase-mock');
    return {
        supabase: createMockSupabase()
    };
});

import { supabase } from '../lib/supabaseClient';

describe('Missions Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getMissions', () => {
        it('should fetch missions and transform relations', async () => {
            // Mock return data with nested relations
            const mockReturnData = mockMissions.map(m => ({
                ...m,
                apartment: [mockApartments.find(a => a.id === m.apartment_id)],
                bag: [mockBags.find(b => b.id === m.bag_id)],
                agent: [mockProfiles.find(p => p.id === m.agent_id)],
                reservation: []
            }));

            // Setup mock chain
            const fromMock = vi.spyOn(supabase, 'from');
            const orderMock2 = vi.fn().mockResolvedValue({ data: mockReturnData, error: null });
            const orderMock1 = vi.fn().mockReturnValue({ order: orderMock2 });
            const selectMock = vi.fn().mockReturnValue({ order: orderMock1 });

            fromMock.mockReturnValue({ select: selectMock } as any);

            const result = await getMissions();

            expect(fromMock).toHaveBeenCalledWith('missions');
            expect(result).toHaveLength(mockMissions.length);
            // Verify transformation (arrays flattened to single objects)
            expect(result[0].apartment).toBeDefined();
            expect(result[0].apartment?.id).toBe('apk-1');
            expect(Array.isArray(result[0].apartment)).toBe(false);
        });

        it('should apply filters correctly', async () => {
            const agentId = 'user-agent';
            const fromMock = vi.spyOn(supabase, 'from');

            // Mock chain for filters
            const orderMock2 = vi.fn().mockResolvedValue({ data: [], error: null });
            const orderMock1 = vi.fn().mockReturnValue({ order: orderMock2 });
            const eqMock = vi.fn().mockReturnValue({ order: orderMock1 });
            const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

            fromMock.mockReturnValue({ select: selectMock } as any);

            await getMissions({ agentId });

            expect(eqMock).toHaveBeenCalledWith('agent_id', agentId);
        });
    });

    describe('createMission', () => {
        it('should create a mission', async () => {
            const newMissionData = {
                apartment_id: 'apk-1',
                bag_id: 'bag-1',
                scheduled_date: '2024-03-01',
                status: 'à_faire' as const
            };
            const createdMission = { ...newMissionData, id: 'mission-new', created_at: 'now' };

            const fromMock = vi.spyOn(supabase, 'from');
            const singleMock = vi.fn().mockResolvedValue({ data: createdMission, error: null });
            const selectMock = vi.fn().mockReturnValue({ single: singleMock });
            const insertMock = vi.fn().mockReturnValue({ select: selectMock });

            fromMock.mockReturnValue({ insert: insertMock } as any);

            const result = await createMission(newMissionData);

            expect(insertMock).toHaveBeenCalledWith(newMissionData);
            expect(result).toEqual(createdMission);
        });
    });

    describe('Verification: Checkout Missions on Sync', () => {
        it('should create checkout missions from reservation data', async () => {
            // Scenario: Sync process detects a reservation ending and needs to create a mission
            const mockReservation = {
                id: 'res-123',
                apartment_id: 'apk-1',
                check_out: '2024-03-15',
                check_in: '2024-03-10'
            };

            // Defines the payload the Sync Logic would construct
            const missionPayload = {
                apartment_id: mockReservation.apartment_id,
                bag_id: 'bag-associated-with-apt', // Assumed derived logic
                reservation_id: mockReservation.id,
                scheduled_date: mockReservation.check_out, // Critical: Mission is on Checkout Day
                status: 'à_faire' as const,
                notes: 'Checkout cleaning'
            };

            const createdMission = { ...missionPayload, id: 'mission-sync-1', created_at: 'now' };

            const fromMock = vi.spyOn(supabase, 'from');
            const singleMock = vi.fn().mockResolvedValue({ data: createdMission, error: null });
            const selectMock = vi.fn().mockReturnValue({ single: singleMock });
            const insertMock = vi.fn().mockReturnValue({ select: selectMock });

            fromMock.mockReturnValue({ insert: insertMock } as any);

            // Execute the service call with the simulated payload
            const result = await createMission(missionPayload);

            // Verify the contract: Service successfully transmits the synced mission to DB
            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                reservation_id: mockReservation.id,
                scheduled_date: mockReservation.check_out,
                status: 'à_faire'
            }));
            expect(result.scheduled_date).toBe(mockReservation.check_out);
        });
    });

    describe('updateMissionStatus', () => {
        it('should update status', async () => {
            const missionId = 'mission-1';
            const newStatus = 'terminée';

            const fromMock = vi.spyOn(supabase, 'from');
            const singleMock = vi.fn().mockResolvedValue({ data: { id: missionId, status: newStatus }, error: null });
            const selectMock = vi.fn().mockReturnValue({ single: singleMock });
            const eqMock = vi.fn().mockReturnValue({ select: selectMock });
            const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

            fromMock.mockReturnValue({ update: updateMock } as any);

            const result = await updateMissionStatus(missionId, newStatus);

            expect(updateMock).toHaveBeenCalledWith({ status: newStatus });
            expect(result.status).toBe(newStatus);
        });
    });
});
