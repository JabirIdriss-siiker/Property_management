import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database.types';

type Apartment = Database['public']['Tables']['apartments']['Row'];
type ApartmentInsert = Database['public']['Tables']['apartments']['Insert'];
type ApartmentUpdate = Database['public']['Tables']['apartments']['Update'];
type BagItem = Database['public']['Tables']['bag_items']['Insert'];

export interface ApartmentWithBag extends Apartment {
    bag?: {
        id: string;
        status: Database['public']['Enums']['bag_status'];
    };
}

/**
 * Fetch all apartments with their bag information
 */
export async function getApartments(): Promise<ApartmentWithBag[]> {
    const { data, error } = await supabase
        .from('apartments')
        .select(`
      *,
      bag:bags (
        id,
        status
      )
    `)
        .eq('is_active', true)
        .order('name');

    if (error) throw error;

    // Transform the nested bag array to a single object
    return (data || []).map(apt => ({
        ...apt,
        bag: apt.bag?.[0] || undefined
    }));
}

/**
 * Fetch a single apartment by ID
 */
export async function getApartment(id: string): Promise<ApartmentWithBag | null> {
    const { data, error } = await supabase
        .from('apartments')
        .select(`
      *,
      bag:bags (
        id,
        status
      )
    `)
        .eq('id', id)
        .single();

    if (error) throw error;

    return {
        ...data,
        bag: data.bag?.[0] || undefined
    };
}

/**
 * Create a new apartment
 * Note: The bag is automatically created by the database trigger
 */
export async function createApartment(
    apartmentData: Omit<ApartmentInsert, 'id' | 'created_at' | 'updated_at'>,
    bagItems?: Array<{ stock_item_id: string; quantity: number }>
): Promise<ApartmentWithBag> {
    // Create the apartment (trigger will auto-create the bag)
    const { data: apartment, error: aptError } = await supabase
        .from('apartments')
        .insert(apartmentData)
        .select()
        .single();

    if (aptError) throw aptError;

    // Get the auto-created bag
    const { data: bag, error: bagError } = await supabase
        .from('bags')
        .select('id, status')
        .eq('apartment_id', apartment.id)
        .single();

    if (bagError) throw bagError;

    // If bag items are provided, add them to the bag
    if (bagItems && bagItems.length > 0) {
        const itemsToInsert = bagItems.map(item => ({
            bag_id: bag.id,
            stock_item_id: item.stock_item_id,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('bag_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;
    }

    return {
        ...apartment,
        bag
    };
}

/**
 * Update an existing apartment
 */
export async function updateApartment(
    id: string,
    updates: ApartmentUpdate
): Promise<Apartment> {
    const { data, error } = await supabase
        .from('apartments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete an apartment
 * Note: This will cascade delete the bag and missions due to foreign key constraints
 */
export async function deleteApartment(id: string): Promise<void> {
    const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Update the iCal link for an apartment
 */
export async function updateICalLink(
    id: string,
    icalLink: string | null
): Promise<Apartment> {
    const { data, error } = await supabase
        .from('apartments')
        .update({
            ical_link: icalLink,
            ical_last_sync: icalLink ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Soft delete an apartment (set is_active to false)
 */
export async function deactivateApartment(id: string): Promise<Apartment> {
    const { data, error } = await supabase
        .from('apartments')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
