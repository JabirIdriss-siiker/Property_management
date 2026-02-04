import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database.types';

type Mission = Database['public']['Tables']['missions']['Row'];
type MissionInsert = Database['public']['Tables']['missions']['Insert'];
type MissionUpdate = Database['public']['Tables']['missions']['Update'];

export interface MissionWithDetails extends Mission {
    apartment?: {
        id: string;
        name: string;
        address: string;
        code_box: string | null;
        has_code_box: boolean | null;
    };
    bag?: {
        id: string;
        status: Database['public']['Enums']['bag_status'];
    };
    agent?: {
        id: string;
        name: string;
        email: string;
    };
    reservation?: {
        id: string;
        check_in: string;
        check_out: string;
    };
}

export interface MissionFilters {
    date?: string;
    status?: Database['public']['Enums']['mission_status'];
    agentId?: string;
    apartmentId?: string;
}

/**
 * Fetch missions with optional filters
 */
export async function getMissions(filters?: MissionFilters): Promise<MissionWithDetails[]> {
    let query = supabase
        .from('missions')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address,
        code_box,
        has_code_box
      ),
      bag:bags (
        id,
        status
      ),
      agent:profiles (
        id,
        name,
        email
      ),
      reservation:reservations (
        id,
        check_in,
        check_out
      )
    `);

    // Apply filters
    if (filters?.date) {
        query = query.eq('scheduled_date', filters.date);
    }
    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId);
    }
    if (filters?.apartmentId) {
        query = query.eq('apartment_id', filters.apartmentId);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

    if (error) throw error;

    // Transform nested arrays to single objects
    return (data || []).map(mission => ({
        ...mission,
        apartment: mission.apartment?.[0],
        bag: mission.bag?.[0],
        agent: mission.agent?.[0],
        reservation: mission.reservation?.[0]
    }));
}

/**
 * Fetch a single mission by ID with full details
 */
export async function getMission(id: string): Promise<MissionWithDetails | null> {
    const { data, error } = await supabase
        .from('missions')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address,
        code_box,
        has_code_box
      ),
      bag:bags (
        id,
        status
      ),
      agent:profiles (
        id,
        name,
        email
      ),
      reservation:reservations (
        id,
        check_in,
        check_out
      )
    `)
        .eq('id', id)
        .single();

    if (error) throw error;

    return {
        ...data,
        apartment: data.apartment?.[0],
        bag: data.bag?.[0],
        agent: data.agent?.[0],
        reservation: data.reservation?.[0]
    };
}

/**
 * Create a new mission
 */
export async function createMission(
    missionData: Omit<MissionInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<Mission> {
    const { data, error } = await supabase
        .from('missions')
        .insert(missionData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update mission status
 * Note: Database trigger will automatically sync bag status
 */
export async function updateMissionStatus(
    id: string,
    status: Database['public']['Enums']['mission_status']
): Promise<Mission> {
    const { data, error } = await supabase
        .from('missions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Assign an agent to a mission
 */
export async function assignAgent(
    id: string,
    agentId: string | null
): Promise<Mission> {
    const { data, error } = await supabase
        .from('missions')
        .update({ agent_id: agentId })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a mission
 */
export async function deleteMission(id: string): Promise<void> {
    const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Get today's missions
 */
export async function getTodayMissions(): Promise<MissionWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    return getMissions({ date: today });
}

/**
 * Get missions for a specific agent
 */
export async function getAgentMissions(agentId: string): Promise<MissionWithDetails[]> {
    return getMissions({ agentId });
}

/**
 * Get pending missions (à_faire status)
 */
export async function getPendingMissions(): Promise<MissionWithDetails[]> {
    return getMissions({ status: 'à_faire' });
}

/**
 * Update mission details
 */
export async function updateMission(
    id: string,
    updates: MissionUpdate
): Promise<Mission> {
    const { data, error } = await supabase
        .from('missions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
