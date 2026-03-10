import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBag, prepareBag } from '../services/bags.service';
import { mockApartments, mockStockItems } from './supabase-mock';

// Mock Supabase client
vi.mock('../lib/supabaseClient', async () => {
    const { createMockSupabase } = await import('./supabase-mock');
    return {
        supabase: createMockSupabase()
    };
});

import { supabase } from '../lib/supabaseClient';

describe('Bags Service - New Features', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createBag', () => {
        it('should create a new bag and insert its items', async () => {
            const bagData = {
                apartment_id: 'apk-1',
                status: 'à_préparer' as const
            };
            const bagItemsData = [
                { stock_item_id: 'stock-1', quantity: 2 }
            ];
            
            const createdBag = { ...bagData, id: 'new-bag-id', created_at: 'now', updated_at: 'now' };

            // Mock supabase chain for 'bags' insert
            const fromMock = vi.spyOn(supabase, 'from');
            const singleMockBag = vi.fn().mockResolvedValue({ data: createdBag, error: null });
            const selectMockBag = vi.fn().mockReturnValue({ single: singleMockBag });
            const insertMockBag = vi.fn().mockReturnValue({ select: selectMockBag });

            // Mock supabase chain for 'bag_items' insert
            const insertMockItems = vi.fn().mockResolvedValue({ error: null });

            fromMock.mockImplementation((tableName: string) => {
                if (tableName === 'bags') {
                    return { insert: insertMockBag } as any;
                }
                if (tableName === 'bag_items') {
                    return { insert: insertMockItems } as any;
                }
                return {} as any;
            });

            const result = await createBag(bagData, bagItemsData);

            expect(fromMock).toHaveBeenCalledWith('bags');
            expect(insertMockBag).toHaveBeenCalledWith(bagData);
            
            expect(fromMock).toHaveBeenCalledWith('bag_items');
            expect(insertMockItems).toHaveBeenCalledWith([{
                bag_id: 'new-bag-id',
                stock_item_id: 'stock-1',
                quantity: 2
            }]);
            
            expect(result).toEqual(createdBag);
        });
    });

    describe('prepareBag', () => {
        it('should update bag items, decrement stock quantities, and update bag status to prêt', async () => {
            const bagId = 'bag-1';
            const usedItems = [
                { stock_item_id: 'stock-1', quantity: 3 }
            ];
            const currentStock = { quantity: 10 };

            const fromMock = vi.spyOn(supabase, 'from');

            // 1. Mock updateBagItems internal calls (delete + insert)
            const deleteMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
            const insertMockItems = vi.fn().mockResolvedValue({ error: null });

            // 2. Mock stock fetch and update
            const singleMockStock = vi.fn().mockResolvedValue({ data: currentStock, error: null });
            const eqMockSelectStock = vi.fn().mockReturnValue({ single: singleMockStock });
            const selectMockStock = vi.fn().mockReturnValue({ eq: eqMockSelectStock });
            
            const eqMockUpdateStock = vi.fn().mockResolvedValue({ error: null });
            const updateMockStock = vi.fn().mockReturnValue({ eq: eqMockUpdateStock });

            // 3. Mock updateBagStatus internal call
            const eqMockUpdateBag = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) }) });
            const updateMockBag = vi.fn().mockReturnValue({ eq: eqMockUpdateBag });

            fromMock.mockImplementation((tableName: string) => {
                if (tableName === 'bag_items') {
                    return { delete: deleteMock, insert: insertMockItems } as any;
                }
                if (tableName === 'stock_items') {
                    return { select: selectMockStock, update: updateMockStock } as any;
                }
                if (tableName === 'bags') {
                    return { update: updateMockBag } as any;
                }
                return {} as any;
            });

            await prepareBag(bagId, usedItems);

            // Verify stock was fetched and updated with correct new quantity
            expect(fromMock).toHaveBeenCalledWith('stock_items');
            expect(selectMockStock).toHaveBeenCalledWith('quantity');
            expect(eqMockSelectStock).toHaveBeenCalledWith('id', 'stock-1');
            
            expect(updateMockStock).toHaveBeenCalledWith({ quantity: 7 }); // 10 - 3
            expect(eqMockUpdateStock).toHaveBeenCalledWith('id', 'stock-1');

            // Verify bag status was updated
            expect(fromMock).toHaveBeenCalledWith('bags');
            expect(updateMockBag).toHaveBeenCalledWith({ status: 'prêt', updated_at: expect.any(String) });
        });
    });
});
