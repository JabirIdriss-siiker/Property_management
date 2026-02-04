import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database.types';

type Bag = Database['public']['Tables']['bags']['Row'];
type BagUpdate = Database['public']['Tables']['bags']['Update'];
type BagItem = Database['public']['Tables']['bag_items']['Row'];
type BagItemInsert = Database['public']['Tables']['bag_items']['Insert'];

export interface BagWithDetails extends Bag {
    apartment?: {
        id: string;
        name: string;
        address: string;
    };
    items?: Array<{
        id: string;
        stock_item_id: string;
        quantity: number;
        stock_item?: {
            id: string;
            name: string;
            category: Database['public']['Enums']['stock_category'];
            quantity: number;
        };
    }>;
    item_count?: number;
    stock_available?: boolean;
}

/**
 * Fetch all bags with apartment and item details
 */
export async function getBags(): Promise<BagWithDetails[]> {
    const { data, error } = await supabase
        .from('bags')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address
      ),
      items:bag_items (
        id,
        stock_item_id,
        quantity,
        stock_item:stock_items (
          id,
          name,
          category,
          quantity
        )
      )
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform and add computed fields
    return await Promise.all((data || []).map(async (bag) => {
        const stockAvailable = await checkBagStockAvailability(bag.id);
        return {
            ...bag,
            apartment: bag.apartment?.[0],
            items: bag.items || [],
            item_count: bag.items?.length || 0,
            stock_available: stockAvailable
        };
    }));
}

/**
 * Fetch a single bag by ID with all details
 */
export async function getBag(id: string): Promise<BagWithDetails | null> {
    const { data, error } = await supabase
        .from('bags')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address
      ),
      items:bag_items (
        id,
        stock_item_id,
        quantity,
        stock_item:stock_items (
          id,
          name,
          category,
          quantity
        )
      )
    `)
        .eq('id', id)
        .single();

    if (error) throw error;

    const stockAvailable = await checkBagStockAvailability(id);

    return {
        ...data,
        apartment: data.apartment?.[0],
        items: data.items || [],
        item_count: data.items?.length || 0,
        stock_available: stockAvailable
    };
}

/**
 * Update bag status
 */
export async function updateBagStatus(
    id: string,
    status: Database['public']['Enums']['bag_status']
): Promise<Bag> {
    const { data, error } = await supabase
        .from('bags')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update bag items (replaces all existing items)
 */
export async function updateBagItems(
    bagId: string,
    items: Array<{ stock_item_id: string; quantity: number }>
): Promise<void> {
    // Delete all existing items for this bag
    const { error: deleteError } = await supabase
        .from('bag_items')
        .delete()
        .eq('bag_id', bagId);

    if (deleteError) throw deleteError;

    // Insert new items if any
    if (items.length > 0) {
        const itemsToInsert: BagItemInsert[] = items.map(item => ({
            bag_id: bagId,
            stock_item_id: item.stock_item_id,
            quantity: item.quantity
        }));

        const { error: insertError } = await supabase
            .from('bag_items')
            .insert(itemsToInsert);

        if (insertError) throw insertError;
    }

    // Check stock availability and update bag status if needed
    const stockAvailable = await checkBagStockAvailability(bagId);

    // Get current bag status
    const { data: bag } = await supabase
        .from('bags')
        .select('status')
        .eq('id', bagId)
        .single();

    // Only update status if bag is in preparation state
    if (bag && (bag.status === 'à_préparer' || bag.status === 'à_préparer_incomplet')) {
        await updateBagStatus(
            bagId,
            stockAvailable ? 'à_préparer' : 'à_préparer_incomplet'
        );
    }
}

/**
 * Check if all items in a bag have sufficient stock
 * Uses the database function for consistency
 */
export async function checkBagStockAvailability(bagId: string): Promise<boolean> {
    // Fetch bag items with stock quantities
    const { data: bagItems, error: itemsError } = await supabase
        .from('bag_items')
        .select(`
      quantity,
      stock_item:stock_items (
        quantity
      )
    `)
        .eq('bag_id', bagId);

    if (itemsError) throw itemsError;

    // If no items, consider it available
    if (!bagItems || bagItems.length === 0) return true;

    // Check if all items have sufficient stock
    return bagItems.every(item => {
        const stockQuantity = item.stock_item?.[0]?.quantity || 0;
        return stockQuantity >= item.quantity;
    });
}

/**
 * Get bags that need preparation
 */
export async function getBagsToPrep(): Promise<BagWithDetails[]> {
    const { data, error } = await supabase
        .from('bags')
        .select(`
      *,
      apartment:apartments (
        id,
        name,
        address
      ),
      items:bag_items (
        id,
        stock_item_id,
        quantity,
        stock_item:stock_items (
          id,
          name,
          category,
          quantity
        )
      )
    `)
        .in('status', ['à_préparer', 'à_préparer_incomplet'])
        .order('created_at', { ascending: false });

    if (error) throw error;

    return await Promise.all((data || []).map(async (bag) => {
        const stockAvailable = await checkBagStockAvailability(bag.id);
        return {
            ...bag,
            apartment: bag.apartment?.[0],
            items: bag.items || [],
            item_count: bag.items?.length || 0,
            stock_available: stockAvailable
        };
    }));
}
