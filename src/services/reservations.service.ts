import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database.types';

type Reservation = Database['public']['Tables']['reservations']['Row'];
type ReservationInsert = Database['public']['Tables']['reservations']['Insert'];
type ReservationUpdate = Database['public']['Tables']['reservations']['Update'];

export interface ReservationWithApartment extends Reservation {
    apartment?: {
        id: string;
        name: string;
        address: string;
    };
}

/**
 * Fetch all reservations with optional apartment filter
 */
export async function getReservations(apartmentId?: string): Promise<ReservationWithApartment[]> {
    let query = supabase
        .from('reservations')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address
      )
    `);

    if (apartmentId) {
        query = query.eq('apartment_id', apartmentId);
    }

    const { data, error } = await query
        .order('check_in', { ascending: false });

    if (error) throw error;

    return (data || []).map(reservation => ({
        ...reservation,
        apartment: Array.isArray(reservation.apartment) ? reservation.apartment[0] : (reservation.apartment || undefined)
    }));
}

/**
 * Fetch a single reservation by ID
 */
export async function getReservation(id: string): Promise<ReservationWithApartment | null> {
    const { data, error } = await supabase
        .from('reservations')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address
      )
    `)
        .eq('id', id)
        .single();

    if (error) throw error;

    return {
        ...data,
        apartment: Array.isArray(data.apartment) ? data.apartment[0] : (data.apartment || undefined)
    };
}

/**
 * Bulk upsert reservations (used for iCal sync)
 */
export async function bulkUpsertReservations(
    reservations: Omit<ReservationInsert, 'id' | 'created_at' | 'updated_at'>[]
): Promise<Reservation[]> {
    if (reservations.length === 0) return [];

    const { data, error } = await supabase
        .from('reservations')
        .upsert(reservations, {
            onConflict: 'apartment_id, ical_uid',
            ignoreDuplicates: false
        })
        .select();

    if (error) throw error;
    return data || [];
}


/**
 * Update a reservation
 */
export async function updateReservation(
    id: string,
    updates: ReservationUpdate
): Promise<Reservation> {
    const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a reservation
 */
export async function deleteReservation(id: string): Promise<void> {
    const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Get upcoming reservations
 */
export async function getUpcomingReservations(apartmentId?: string): Promise<ReservationWithApartment[]> {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
        .from('reservations')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address
      )
    `)
        .gte('check_in', today);

    if (apartmentId) {
        query = query.eq('apartment_id', apartmentId);
    }

    const { data, error } = await query.order('check_in', { ascending: true });

    if (error) throw error;

    return (data || []).map(reservation => ({
        ...reservation,
        apartment: Array.isArray(reservation.apartment) ? reservation.apartment[0] : (reservation.apartment || undefined)
    }));
}

/**
 * Get reservations for a date range
 */
export async function getReservationsByDateRange(
    startDate: string,
    endDate: string,
    apartmentId?: string
): Promise<ReservationWithApartment[]> {
    let query = supabase
        .from('reservations')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address
      )
    `)
        .gte('check_in', startDate)
        .lte('check_out', endDate);

    if (apartmentId) {
        query = query.eq('apartment_id', apartmentId);
    }

    const { data, error } = await query.order('check_in', { ascending: true });

    if (error) throw error;

    return (data || []).map(reservation => ({
        ...reservation,
        apartment: Array.isArray(reservation.apartment) ? reservation.apartment[0] : (reservation.apartment || undefined)
    }));
}
