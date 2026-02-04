export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            apartments: {
                Row: {
                    id: string
                    name: string
                    address: string
                    description: string | null
                    has_code_box: boolean | null
                    code_box: string | null
                    ical_link: string | null
                    ical_last_sync: string | null
                    ical_sync_enabled: boolean | null
                    cleaning_price: number
                    bed_count: number
                    coffee_type: Database['public']['Enums']['coffee_type'] | null
                    is_active: boolean | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    address: string
                    description?: string | null
                    has_code_box?: boolean | null
                    code_box?: string | null
                    ical_link?: string | null
                    ical_last_sync?: string | null
                    ical_sync_enabled?: boolean | null
                    cleaning_price?: number
                    bed_count?: number
                    coffee_type?: Database['public']['Enums']['coffee_type'] | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    address?: string
                    description?: string | null
                    has_code_box?: boolean | null
                    code_box?: string | null
                    ical_link?: string | null
                    ical_last_sync?: string | null
                    ical_sync_enabled?: boolean | null
                    cleaning_price?: number
                    bed_count?: number
                    coffee_type?: Database['public']['Enums']['coffee_type'] | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            bag_items: {
                Row: {
                    id: string
                    bag_id: string
                    stock_item_id: string
                    quantity: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    bag_id: string
                    stock_item_id: string
                    quantity?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    bag_id?: string
                    stock_item_id?: string
                    quantity?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bag_items_bag_id_fkey"
                        columns: ["bag_id"]
                        isOneToOne: false
                        referencedRelation: "bags"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bag_items_stock_item_id_fkey"
                        columns: ["stock_item_id"]
                        isOneToOne: false
                        referencedRelation: "stock_items"
                        referencedColumns: ["id"]
                    }
                ]
            }
            bags: {
                Row: {
                    id: string
                    apartment_id: string
                    status: Database['public']['Enums']['bag_status']
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    apartment_id: string
                    status?: Database['public']['Enums']['bag_status']
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    apartment_id?: string
                    status?: Database['public']['Enums']['bag_status']
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bags_apartment_id_fkey"
                        columns: ["apartment_id"]
                        isOneToOne: true
                        referencedRelation: "apartments"
                        referencedColumns: ["id"]
                    }
                ]
            }
            missions: {
                Row: {
                    id: string
                    apartment_id: string
                    bag_id: string
                    agent_id: string | null
                    reservation_id: string | null
                    scheduled_date: string
                    scheduled_time: string
                    status: Database['public']['Enums']['mission_status']
                    started_at: string | null
                    completed_at: string | null
                    is_manual: boolean | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    apartment_id: string
                    bag_id: string
                    agent_id?: string | null
                    reservation_id?: string | null
                    scheduled_date: string
                    scheduled_time?: string
                    status?: Database['public']['Enums']['mission_status']
                    started_at?: string | null
                    completed_at?: string | null
                    is_manual?: boolean | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    apartment_id?: string
                    bag_id?: string
                    agent_id?: string | null
                    reservation_id?: string | null
                    scheduled_date?: string
                    scheduled_time?: string
                    status?: Database['public']['Enums']['mission_status']
                    started_at?: string | null
                    completed_at?: string | null
                    is_manual?: boolean | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "missions_agent_id_fkey"
                        columns: ["agent_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "missions_apartment_id_fkey"
                        columns: ["apartment_id"]
                        isOneToOne: false
                        referencedRelation: "apartments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "missions_bag_id_fkey"
                        columns: ["bag_id"]
                        isOneToOne: false
                        referencedRelation: "bags"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "missions_reservation_id_fkey"
                        columns: ["reservation_id"]
                        isOneToOne: false
                        referencedRelation: "reservations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    auth_id: string | null
                    email: string
                    name: string
                    role: Database['public']['Enums']['user_role']
                    phone: string | null
                    is_active: boolean | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    auth_id?: string | null
                    email: string
                    name: string
                    role?: Database['public']['Enums']['user_role']
                    phone?: string | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    auth_id?: string | null
                    email?: string
                    name?: string
                    role?: Database['public']['Enums']['user_role']
                    phone?: string | null
                    is_active?: boolean | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            reservations: {
                Row: {
                    id: string
                    apartment_id: string
                    ical_uid: string | null
                    summary: string | null
                    check_in: string
                    check_out: string
                    source: string | null
                    raw_data: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    apartment_id: string
                    ical_uid?: string | null
                    summary?: string | null
                    check_in: string
                    check_out: string
                    source?: string | null
                    raw_data?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    apartment_id?: string
                    ical_uid?: string | null
                    summary?: string | null
                    check_in?: string
                    check_out?: string
                    source?: string | null
                    raw_data?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "reservations_apartment_id_fkey"
                        columns: ["apartment_id"]
                        isOneToOne: false
                        referencedRelation: "apartments"
                        referencedColumns: ["id"]
                    }
                ]
            }
            stock_items: {
                Row: {
                    id: string
                    name: string
                    category: Database['public']['Enums']['stock_category']
                    quantity: number
                    alert_threshold: number
                    unit: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    category: Database['public']['Enums']['stock_category']
                    quantity?: number
                    alert_threshold?: number
                    unit?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    category?: Database['public']['Enums']['stock_category']
                    quantity?: number
                    alert_threshold?: number
                    unit?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            v_dashboard_stats: {
                Row: {
                    missions_today: number | null
                    bags_to_prepare: number | null
                    stock_alerts: number | null
                    active_apartments: number | null
                }
                Relationships: []
            }
            v_today_missions: {
                Row: {
                    id: string | null
                    apartment_id: string | null
                    bag_id: string | null
                    agent_id: string | null
                    reservation_id: string | null
                    scheduled_date: string | null
                    scheduled_time: string | null
                    status: Database['public']['Enums']['mission_status'] | null
                    started_at: string | null
                    completed_at: string | null
                    is_manual: boolean | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                    apartment_name: string | null
                    apartment_address: string | null
                    code_box: string | null
                    has_code_box: boolean | null
                    bag_status: Database['public']['Enums']['bag_status'] | null
                    agent_name: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "missions_agent_id_fkey"
                        columns: ["agent_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "missions_apartment_id_fkey"
                        columns: ["apartment_id"]
                        isOneToOne: false
                        referencedRelation: "apartments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "missions_bag_id_fkey"
                        columns: ["bag_id"]
                        isOneToOne: false
                        referencedRelation: "bags"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "missions_reservation_id_fkey"
                        columns: ["reservation_id"]
                        isOneToOne: false
                        referencedRelation: "reservations"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Functions: {
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            get_my_profile_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            bag_status: 'à_préparer' | 'à_préparer_incomplet' | 'prêt' | 'sale' | 'en_lavage'
            coffee_type: 'none' | 'nespresso' | 'senseo' | 'filter' | 'other'
            mission_status: 'à_faire' | 'en_cours' | 'terminée' | 'annulée'
            stock_category: 'linge' | 'consommable'
            user_role: 'admin' | 'agent'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
