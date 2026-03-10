import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Apartment, Bag, BagItem, Mission, StockItem, User, Reservation } from '../types';
import { getApartments, createApartment, updateApartment as updateApartmentService, deleteApartment as deleteApartmentService } from '../services/apartments.service';
import { getBags, updateBagStatus as updateBagStatusService, updateBagItems as updateBagItemsService, createBag as createBagService, prepareBag as prepareBagService } from '../services/bags.service';
import { getMissions, createMission as createMissionService, updateMissionStatus as updateMissionStatusService, assignAgent as assignAgentService } from '../services/missions.service';
import { getStockItems, createStockItem as createStockItemService, updateStockItem as updateStockItemService, deleteStockItem as deleteStockItemService, updateStockQuantity as updateStockQuantityService } from '../services/stock.service';
import { getProfiles } from '../services/profiles.service';
import { getReservations, bulkUpsertReservations } from '../services/reservations.service';
import { parseICal, transformToReservations } from '../lib/ical-parser';
import { useAuth } from '../contexts/AuthContext';

interface LoadingStates {
  apartments: boolean;
  bags: boolean;
  missions: boolean;
  stock: boolean;
  users: boolean;
  reservations: boolean;
}

interface AppContextType {
  apartments: Apartment[];
  bags: Bag[];
  stock: StockItem[];
  missions: Mission[];
  reservations: Reservation[];
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  loadingStates: LoadingStates;
  error: string | null;
  // Actions
  addApartment: (
    apt: Apartment,
    bagItems: {
      stockItemId: string;
      quantity: number;
    }[]
  ) => Promise<void>;
  updateApartment: (apt: Apartment) => Promise<void>;
  deleteApartment: (aptId: string) => Promise<void>;
  updateMissionStatus: (missionId: string, status: Mission['status']) => Promise<void>;
  updateBagStatus: (bagId: string, status: Bag['status']) => Promise<void>;
  updateBagItems: (bagId: string, items: BagItem[]) => Promise<void>;
  prepareBag: (bagId: string, items: BagItem[]) => Promise<void>;
  updateStockQuantity: (itemId: string, quantity: number) => Promise<void>;
  addStockItem: (item: Partial<StockItem>) => Promise<void>;
  updateStockItem: (item: Partial<StockItem>) => Promise<void>;
  deleteStockItem: (itemId: string) => Promise<void>;
  addMission: (mission: Mission) => Promise<void>;
  assignAgent: (missionId: string, agentId: string) => Promise<void>;
  syncApartmentReservations: (apartmentId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to convert database types to frontend types
function convertApartmentToFrontend(dbApartment: any): Apartment {
  return {
    id: dbApartment.id,
    name: dbApartment.name,
    address: dbApartment.address,
    description: dbApartment.description || undefined,
    hasCodeBox: dbApartment.has_code_box || false,
    codeBox: dbApartment.code_box || undefined,
    iCalLink: dbApartment.ical_link || undefined,
    iCalLastSync: dbApartment.ical_last_sync || undefined,
    iCalSyncEnabled: dbApartment.ical_sync_enabled ?? true,
    cleaningPrice: dbApartment.cleaning_price || 0,
    bedCount: dbApartment.bed_count || 0,
    coffeeType: dbApartment.coffee_type || 'none',
    isActive: dbApartment.is_active ?? true,
    bagId: dbApartment.bag?.id,
    createdAt: dbApartment.created_at || new Date().toISOString(),
    updatedAt: dbApartment.updated_at || undefined,
  };
}

function convertBagToFrontend(dbBag: any): Bag {
  return {
    id: dbBag.id,
    apartmentId: dbBag.apartment_id,
    status: dbBag.status,
    items: (dbBag.items || []).map((item: any) => ({
      id: item.id,
      stockItemId: item.stock_item_id,
      quantity: item.quantity,
      createdAt: item.created_at || undefined,
    })),
    notes: dbBag.notes || undefined,
    createdAt: dbBag.created_at || undefined,
    updatedAt: dbBag.updated_at || undefined,
  };
}

function convertMissionToFrontend(dbMission: any): Mission {
  return {
    id: dbMission.id,
    apartmentId: dbMission.apartment_id,
    bagId: dbMission.bag_id,
    agentId: dbMission.agent_id || undefined,
    reservationId: dbMission.reservation_id || undefined,
    date: dbMission.scheduled_date,
    time: dbMission.scheduled_time,
    status: dbMission.status,
    startedAt: dbMission.started_at || undefined,
    completedAt: dbMission.completed_at || undefined,
    isManual: dbMission.is_manual || false,
    notes: dbMission.notes || undefined,
    createdAt: dbMission.created_at || new Date().toISOString(),
    updatedAt: dbMission.updated_at || undefined,
  };
}

function convertReservationToFrontend(dbRes: any): Reservation {
  return {
    id: dbRes.id,
    apartmentId: dbRes.apartment_id,
    icalUid: dbRes.ical_uid || undefined,
    summary: dbRes.summary || undefined,
    checkIn: dbRes.check_in,
    checkOut: dbRes.check_out,
    source: dbRes.source || undefined,
    rawData: dbRes.raw_data || undefined,
    createdAt: dbRes.created_at,
    updatedAt: dbRes.updated_at || undefined,
  };
}

function convertStockItemToFrontend(dbStock: any): StockItem {
  return {
    id: dbStock.id,
    name: dbStock.name,
    category: dbStock.category,
    quantity: dbStock.quantity,
    alertThreshold: dbStock.alert_threshold || 0,
    unit: dbStock.unit || undefined,
    notes: dbStock.notes || undefined,
    createdAt: dbStock.created_at || undefined,
    updatedAt: dbStock.updated_at || undefined,
  };
}

function convertUserToFrontend(dbProfile: any): User {
  return {
    id: dbProfile.id,
    authId: dbProfile.auth_id || undefined,
    name: dbProfile.name,
    role: dbProfile.role,
    email: dbProfile.email,
    phone: dbProfile.phone || undefined,
    isActive: dbProfile.is_active ?? true,
    createdAt: dbProfile.created_at || undefined,
    updatedAt: dbProfile.updated_at || undefined,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const { profile, loading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    apartments: true,
    bags: true,
    missions: true,
    stock: true,
    users: true,
    reservations: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Sync currentUser with real Auth Profile
  useEffect(() => {
    if (profile) {
      setCurrentUser(convertUserToFrontend(profile));
    } else {
      setCurrentUser(null);
      // Clear data when logged out
      setApartments([]);
      setBags([]);
      setMissions([]);
      setReservations([]);
      setStock([]);
      setUsers([]);
    }
  }, [profile]);

  // Fetch all data when user is authenticated
  useEffect(() => {
    async function fetchData() {
      if (!profile) {
        setIsDataLoading(false);
        return;
      }

      try {
        setIsDataLoading(true);
        setError(null);

        const [
          apartmentsData,
          bagsData,
          missionsData,
          reservationsData,
          stockData,
          usersData,
        ] = await Promise.all([
          getApartments(),
          getBags(),
          getMissions(),
          getReservations(),
          getStockItems(),
          getProfiles(),
        ]);

        setApartments(apartmentsData.map(convertApartmentToFrontend));
        setBags(bagsData.map(convertBagToFrontend));
        setMissions(missionsData.map(convertMissionToFrontend));
        setReservations(reservationsData.map(convertReservationToFrontend));
        setStock(stockData.map(convertStockItemToFrontend));
        setUsers(usersData.map(convertUserToFrontend));

        setLoadingStates({
          apartments: false,
          bags: false,
          missions: false,
          stock: false,
          users: false,
          reservations: false,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsDataLoading(false);
      }
    }

    if (!authLoading) {
      if (profile) {
        fetchData();
      } else {
        setIsDataLoading(false);
      }
    }
  }, [profile, authLoading]);

  const isLoading = authLoading || isDataLoading;

  const checkStockForBag = (
    bagItems: {
      stockItemId: string;
      quantity: number;
    }[]
  ) => {
    return bagItems.every((item) => {
      const stockItem = stock.find((s) => s.id === item.stockItemId);
      return stockItem && stockItem.quantity >= item.quantity;
    });
  };

  const addApartment = async (
    apt: Apartment,
    bagItems: {
      stockItemId: string;
      quantity: number;
    }[]
  ) => {
    // Optimistic update
    setApartments([...apartments, apt]);
    const bagId = apt.bagId || crypto.randomUUID();
    const newBag: Bag = {
      id: bagId,
      apartmentId: apt.id,
      status: 'à_préparer',
      items: bagItems,
    };
    const isStockComplete = checkStockForBag(bagItems);
    if (!isStockComplete) {
      newBag.status = 'à_préparer_incomplet';
    }
    setBags([...bags, newBag]);

    try {
      // Convert to database format
      const dbApartment = await createApartment(
        {
          name: apt.name,
          address: apt.address,
          description: apt.description,
          has_code_box: apt.hasCodeBox,
          code_box: apt.codeBox,
          ical_link: apt.iCalLink,
          cleaning_price: apt.cleaningPrice,
          bed_count: apt.bedCount,
          coffee_type: apt.coffeeType,
        },
        bagItems.map((item) => ({
          stock_item_id: item.stockItemId,
          quantity: item.quantity,
        }))
      );

      // Update with actual data from server
      const createdApartment = convertApartmentToFrontend(dbApartment);
      setApartments((prev) => prev.map((a) => (a.id === apt.id ? createdApartment : a)));
    } catch (err) {
      console.error('Error creating apartment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create apartment');
      // Revert optimistic update
      setApartments((prev) => prev.filter((a) => a.id !== apt.id));
      setBags((prev) => prev.filter((b) => b.id !== newBag.id));
      throw err;
    }
  };

  const updateApartment = async (updatedApt: Apartment) => {
    const previousApartments = [...apartments];
    // Optimistic update
    setApartments(apartments.map((a) => (a.id === updatedApt.id ? updatedApt : a)));

    try {
      await updateApartmentService(updatedApt.id, {
        name: updatedApt.name,
        address: updatedApt.address,
        description: updatedApt.description,
        has_code_box: updatedApt.hasCodeBox,
        code_box: updatedApt.codeBox,
        ical_link: updatedApt.iCalLink,
        cleaning_price: updatedApt.cleaningPrice,
        bed_count: updatedApt.bedCount,
        coffee_type: updatedApt.coffeeType,
      });
    } catch (err) {
      console.error('Error updating apartment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update apartment');
      // Revert optimistic update
      setApartments(previousApartments);
      throw err;
    }
  };

  const deleteApartment = async (aptId: string) => {
    const previousApartments = [...apartments];
    const previousBags = [...bags];
    const previousMissions = [...missions];

    // Optimistic update
    setApartments(apartments.filter((a) => a.id !== aptId));
    setBags(bags.filter((b) => b.apartmentId !== aptId));
    setMissions(missions.filter((m) => m.apartmentId !== aptId));

    try {
      await deleteApartmentService(aptId);
    } catch (err) {
      console.error('Error deleting apartment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete apartment');
      // Revert optimistic update
      setApartments(previousApartments);
      setBags(previousBags);
      setMissions(previousMissions);
      throw err;
    }
  };

  const updateMissionStatus = async (
    missionId: string,
    newStatus: Mission['status']
  ) => {
    const previousMissions = [...missions];
    const previousBags = [...bags];

    // Optimistic update
    setMissions(
      missions.map((m) => {
        if (m.id === missionId) {
          const bagId = m.bagId;
          let newBagStatus: Bag['status'] | undefined;
          if (newStatus === 'en_cours') newBagStatus = 'prêt';
          if (newStatus === 'terminée') newBagStatus = 'sale';
          if (newBagStatus) {
            setBags(
              bags.map((b) =>
                b.id === bagId
                  ? {
                    ...b,
                    status: newBagStatus,
                  }
                  : b
              )
            );
          }
          return {
            ...m,
            status: newStatus,
          };
        }
        return m;
      })
    );

    try {
      await updateMissionStatusService(missionId, newStatus);
    } catch (err) {
      console.error('Error updating mission status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update mission status');
      // Revert optimistic update
      setMissions(previousMissions);
      setBags(previousBags);
      throw err;
    }
  };


  const updateBagStatus = async (bagId: string, status: Bag['status']) => {
    if (!status) return; // Guard against undefined status

    const previousBags = [...bags];
    // Optimistic update
    setBags(
      bags.map((b) =>
        b.id === bagId
          ? {
            ...b,
            status,
          }
          : b
      )
    );

    try {
      await updateBagStatusService(bagId, status);
    } catch (err) {
      console.error('Error updating bag status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bag status');
      // Revert optimistic update
      setBags(previousBags);
      throw err;
    }
  };

  const updateBagItems = async (bagId: string, items: BagItem[]) => {
    const previousBags = [...bags];
    // Optimistic update
    setBags(
      bags.map((b) => {
        if (b.id === bagId) {
          const isComplete = checkStockForBag(items);
          return {
            ...b,
            items,
            status:
              b.status === 'à_préparer' || b.status === 'à_préparer_incomplet'
                ? isComplete
                  ? 'à_préparer'
                  : 'à_préparer_incomplet'
                : b.status,
          };
        }
        return b;
      })
    );

    try {
      await updateBagItemsService(
        bagId,
        items.map((item) => ({
          stock_item_id: item.stockItemId,
          quantity: item.quantity,
        }))
      );
    } catch (err) {
      console.error('Error updating bag items:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bag items');
      // Revert optimistic update
      setBags(previousBags);
      throw err;
    }
  };

  const prepareBag = async (bagId: string, usedItems: BagItem[]) => {
    const previousBags = [...bags];
    const previousStock = [...stock];

    // Optimistic: update bag status and decrease stock quantities
    setBags(bags.map(b => b.id === bagId ? { ...b, status: 'prêt', items: usedItems } : b));
    
    setStock(stock.map(s => {
      const used = usedItems.find(u => u.stockItemId === s.id);
      if (used) {
        return { ...s, quantity: Math.max(0, s.quantity - used.quantity) };
      }
      return s;
    }));

    try {
      await prepareBagService(
        bagId,
        usedItems.map(item => ({
          stock_item_id: item.stockItemId,
          quantity: item.quantity
        }))
      );
    } catch (err) {
      console.error('Error preparing bag:', err);
      setError(err instanceof Error ? err.message : 'Failed to prepare bag and deduct stock');
      setBags(previousBags);
      setStock(previousStock);
      throw err;
    }
  };

  const updateStockQuantity = async (itemId: string, quantity: number) => {
    const previousStock = [...stock];
    // Optimistic update
    setStock(
      stock.map((s) =>
        s.id === itemId
          ? {
            ...s,
            quantity,
          }
          : s
      )
    );

    try {
      await updateStockQuantityService(itemId, quantity);
    } catch (err) {
      console.error('Error updating stock quantity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update stock quantity');
      // Revert optimistic update
      setStock(previousStock);
      throw err;
    }
  };

  const addStockItem = async (item: Partial<StockItem>) => {
    try {
      // We can't easily optimistic update since we don't have the ID yet
      const dbItem = await createStockItemService({
        name: item.name!,
        category: item.category!,
        quantity: item.quantity,
        alert_threshold: item.alertThreshold,
        unit: item.unit,
      });
      const newItem = convertStockItemToFrontend(dbItem);
      setStock(prev => [...prev, newItem]);
    } catch (err) {
      console.error('Error adding stock item:', err);
      setError(err instanceof Error ? err.message : 'Failed to add stock item');
      throw err;
    }
  };

  const updateStockItem = async (item: Partial<StockItem>) => {
    if (!item.id) return;
    const previousStock = [...stock];

    setStock(prev => prev.map(s => s.id === item.id ? { ...s, ...item } as StockItem : s));

    try {
      await updateStockItemService(item.id, {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        alert_threshold: item.alertThreshold,
        unit: item.unit
      });
    } catch (err) {
      console.error('Error updating stock item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update stock item');
      setStock(previousStock);
      throw err;
    }
  };

  const deleteStockItem = async (itemId: string) => {
    const previousStock = [...stock];
    setStock(prev => prev.filter(s => s.id !== itemId));

    try {
      await deleteStockItemService(itemId);
    } catch (err) {
      console.error('Error deleting stock item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete stock item');
      setStock(previousStock);
      throw err;
    }
  };

  const addMission = async (mission: Mission) => {
    // 1. Find a template bag for this apartment to copy its items
    const templateBag = bags.find((b) => b.apartmentId === mission.apartmentId);
    const newBagId = crypto.randomUUID();
    const newBagItems = templateBag ? templateBag.items.map(i => ({
      ...i,
      id: crypto.randomUUID()
    })) : [];

    const isComplete = checkStockForBag(newBagItems);
    
    const newBag: Bag = {
      id: newBagId,
      apartmentId: mission.apartmentId,
      status: isComplete ? 'à_préparer' : 'à_préparer_incomplet',
      items: newBagItems,
    };

    // Update mission to point to the newly created bag instead of the template one
    const missionToCreate = { ...mission, bagId: newBagId };

    // Optimistic update
    setBags([...bags, newBag]);
    setMissions([...missions, missionToCreate]);

    try {
      // Create bag in DB first
      const dbBag = await createBagService({
        apartment_id: missionToCreate.apartmentId,
        status: newBag.status,
      }, newBagItems.map(i => ({
        stock_item_id: i.stockItemId,
        quantity: i.quantity
      })));

      // Ensure we use the DB-generated bag ID if it differs (though UI provided UUID works if passed, but createBagService didn't take an ID parameter currently. Wait, we omitted 'id' in createBagService, so DB generates it).
      const finalBagId = dbBag.id;

      const dbMission = await createMissionService({
        apartment_id: missionToCreate.apartmentId,
        scheduled_date: missionToCreate.date,
        scheduled_time: missionToCreate.time,
        agent_id: missionToCreate.agentId,
        status: missionToCreate.status,
        bag_id: finalBagId, // Use the real DB bag ID
        notes: missionToCreate.notes,
        is_manual: missionToCreate.isManual,
      });

      // Update with actual data from server
      const createdMission = convertMissionToFrontend(dbMission);
      const createdBag = convertBagToFrontend(dbBag);

      setBags((prev) => prev.map((b) => (b.id === newBagId ? createdBag : b)));
      setMissions((prev) => prev.map((m) => (m.id === missionToCreate.id ? createdMission : m)));
    } catch (err) {
      console.error('Error creating mission:', err);
      setError(err instanceof Error ? err.message : 'Failed to create mission');
      // Revert optimistic update
      setMissions((prev) => prev.filter((m) => m.id !== missionToCreate.id));
      setBags((prev) => prev.filter((b) => b.id !== newBagId));
      throw err;
    }
  };

  const assignAgent = async (missionId: string, agentId: string) => {
    const previousMissions = [...missions];
    // Optimistic update
    setMissions(
      missions.map((m) =>
        m.id === missionId
          ? {
            ...m,
            agentId,
          }
          : m
      )
    );

    try {
      await assignAgentService(missionId, agentId);
    } catch (err) {
      console.error('Error assigning agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign agent');
      // Revert optimistic update
      setMissions(previousMissions);
      throw err;
    }
  };

  const syncApartmentReservations = async (apartmentId: string) => {
    const apt = apartments.find((a) => a.id === apartmentId);
    if (!apt || !apt.iCalLink) {
      console.warn('Apartment not found or has no iCal link:', apartmentId);
      return;
    }

    try {
      setIsDataLoading(true);
      setError(null);

      // 1. Fetch iCal content (using a proxy if needed, but here we assume direct access or server-side handling)
      // Note: In a real production app, you might need a server-side proxy to bypass CORS
      const response = await fetch(apt.iCalLink);
      if (!response.ok) throw new Error('Failed to fetch iCal feed');
      const content = await response.text();

      // 2. Parse and transform
      const events = parseICal(content);
      const newReservations = transformToReservations(events, apartmentId);

      // 3. Save to Supabase
      const dbReservations = await bulkUpsertReservations(
        newReservations.map((r) => ({
          apartment_id: r.apartmentId,
          ical_uid: r.icalUid,
          summary: r.summary,
          check_in: r.checkIn,
          check_out: r.checkOut,
          source: r.source,
          raw_data: r.rawData,
        }))
      );

      // 4. Update local state
      const syncedReservations = dbReservations.map(convertReservationToFrontend);

      // Update the reservations state while avoiding duplicates
      setReservations(prev => {
        const otherReservations = prev.filter(r => r.apartmentId !== apartmentId);
        return [...otherReservations, ...syncedReservations];
      });

      // Update apartment last sync time (optional, would need an update service call)
      await updateApartmentService(apt.id, {
        ical_last_sync: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error syncing iCal:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync iCal');
      throw err;
    } finally {
      setIsDataLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        apartments,
        bags,
        stock,
        missions,
        reservations,
        users,
        currentUser,
        isLoading,
        loadingStates,
        error,
        addApartment,
        updateApartment,
        deleteApartment,
        updateMissionStatus,
        updateBagStatus,
        updateBagItems,
        prepareBag,

        updateStockQuantity,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        addMission,
        assignAgent,
        syncApartmentReservations,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}