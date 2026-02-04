import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database.types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];
type StockItemInsert = Database['public']['Tables']['stock_items']['Insert'];
type StockItemUpdate = Database['public']['Tables']['stock_items']['Update'];

/**
 * Fetch all stock items
 */
export async function getStockItems(): Promise<StockItem[]> {
    const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('category')
        .order('name');

    if (error) throw error;
    return data || [];
}

/**
 * Fetch a single stock item by ID
 */
export async function getStockItem(id: string): Promise<StockItem | null> {
    const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create a new stock item
 */
export async function createStockItem(
    itemData: Omit<StockItemInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<StockItem> {
    const { data, error } = await supabase
        .from('stock_items')
        .insert(itemData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update stock quantity
 * Note: Database trigger will automatically update bag statuses
 */
export async function updateStockQuantity(
    id: string,
    quantity: number
): Promise<StockItem> {
    const { data, error } = await supabase
        .from('stock_items')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update stock item details
 */
export async function updateStockItem(
    id: string,
    updates: StockItemUpdate
): Promise<StockItem> {
    const { data, error } = await supabase
        .from('stock_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a stock item
 */
export async function deleteStockItem(id: string): Promise<void> {
    const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Get stock items below alert threshold
 */
export async function getLowStockItems(): Promise<StockItem[]> {
    const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .filter('quantity', 'lte', 'alert_threshold')
        .order('quantity', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Get stock items by category
 */
export async function getStockItemsByCategory(
    category: Database['public']['Enums']['stock_category']
): Promise<StockItem[]> {
    const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('category', category)
        .order('name');

    if (error) throw error;
    return data || [];
}

/**
 * Increment stock quantity
 */
export async function incrementStock(
    id: string,
    amount: number
): Promise<StockItem> {
    // First get current quantity
    const currentItem = await getStockItem(id);
    if (!currentItem) throw new Error('Stock item not found');

    const newQuantity = currentItem.quantity + amount;
    return updateStockQuantity(id, newQuantity);
}

/**
 * Decrement stock quantity
 */
export async function decrementStock(
    id: string,
    amount: number
): Promise<StockItem> {
    // First get current quantity
    const currentItem = await getStockItem(id);
    if (!currentItem) throw new Error('Stock item not found');

    const newQuantity = Math.max(0, currentItem.quantity - amount);
    return updateStockQuantity(id, newQuantity);
}
