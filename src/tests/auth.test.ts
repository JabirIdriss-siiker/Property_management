
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUserProfile, getProfile } from '../services/profiles.service';
import { mockProfiles, createMockSupabase } from './supabase-mock';

vi.mock('../lib/supabaseClient', async () => {
    const { createMockSupabase } = await import('./supabase-mock');
    return {
        supabase: createMockSupabase()
    };
});

// Access the mocked client for setting up return values
import { supabase } from '../lib/supabaseClient';

describe('Auth & Profiles Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCurrentUserProfile', () => {
        it('should return null if user is not authenticated', async () => {
            // Setup mock: getUser returns no user
            const authMock = vi.spyOn(supabase.auth, 'getUser');
            authMock.mockResolvedValueOnce({ data: { user: null }, error: null } as any);

            const result = await getCurrentUserProfile();

            expect(result).toBeNull();
            expect(authMock).toHaveBeenCalled();
        });

        it('should return profile if user is authenticated', async () => {
            const mockUser = { id: 'auth-admin', email: 'admin@test.com' };
            const mockProfile = mockProfiles.find(p => p.auth_id === 'auth-admin');

            // Setup mock: getUser returns a user
            const authMock = vi.spyOn(supabase.auth, 'getUser');
            authMock.mockResolvedValueOnce({ data: { user: mockUser }, error: null } as any);

            // Setup mock: DB query returns the profile
            const fromMock = vi.spyOn(supabase, 'from');
            // We need to simulate the chain: .from().select().eq().single()
            // Our factory returns mocks that return 'this', but single() needs a return value.
            // However, vitest mocks on the factory are generic. We can intercept specific calls.

            // A simpler way with the factory structure:
            // The factory methods return `this` (the mock object itself). 
            // `single()` is the end of the chain.

            // Let's refine the factory behavior for this test or manually override the chain.
            // Since `supabase.from` is already a mock, we can control its return.

            const singleMock = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
            const eqMock = vi.fn().mockReturnValue({ single: singleMock });
            const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

            fromMock.mockReturnValue({ select: selectMock } as any);


            const result = await getCurrentUserProfile();

            expect(result).toEqual(mockProfile);
            expect(fromMock).toHaveBeenCalledWith('profiles');
            expect(selectMock).toHaveBeenCalledWith('*');
            expect(eqMock).toHaveBeenCalledWith('auth_id', 'auth-admin');
        });
    });

    describe('getProfile', () => {
        it('should fetch profile by ID', async () => {
            const targetProfile = mockProfiles[0];

            const fromMock = vi.spyOn(supabase, 'from');

            const singleMock = vi.fn().mockResolvedValue({ data: targetProfile, error: null });
            const eqMock = vi.fn().mockReturnValue({ single: singleMock });
            const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

            fromMock.mockReturnValue({ select: selectMock } as any);

            const result = await getProfile(targetProfile.id);

            expect(result).toEqual(targetProfile);
            expect(eqMock).toHaveBeenCalledWith('id', targetProfile.id);
        });
    });
});
