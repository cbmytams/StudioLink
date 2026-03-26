import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

const fallbackUrl = 'https://example.supabase.co'
const fallbackAnonKey = 'public-anon-key'

export const supabase = createClient<Database>(
  hasSupabaseConfig ? supabaseUrl : fallbackUrl,
  hasSupabaseConfig ? supabaseAnonKey : fallbackAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
