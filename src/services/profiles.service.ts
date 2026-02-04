import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Fetch all profiles (users)
 */
export async function getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data || [];
}

/**
 * Fetch a single profile by ID
 */
export async function getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Fetch profile by auth_id
 */
export async function getProfileByAuthId(authId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', authId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return getProfileByAuthId(user.id);
}

/**
 * Create a new profile
 * Note: This is typically called automatically by the database trigger
 */
export async function createProfile(
    profileData: Omit<ProfileInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<Profile> {
    const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a profile
 */
export async function updateProfile(
    id: string,
    updates: ProfileUpdate
): Promise<Profile> {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a profile (soft delete by setting is_active to false)
 */
export async function deactivateProfile(id: string): Promise<Profile> {
    const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get all agents (users with role 'agent')
 */
export async function getAgents(): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data || [];
}

/**
 * Get all admins (users with role 'admin')
 */
export async function getAdmins(): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data || [];
}

/**
 * Update user role
 */
export async function updateUserRole(
    id: string,
    role: Database['public']['Enums']['user_role']
): Promise<Profile> {
    return updateProfile(id, { role });
}
