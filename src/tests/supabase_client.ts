import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_ANON_KEY || 'your-local-anon-key'
)
