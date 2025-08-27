import { createClient } from '@supabase/supabase-js'

// Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://avvmbehtckiyvmrhmbzv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2dm1iZWh0Y2tpeXZtcmhtYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNjYxNjEsImV4cCI6MjA3MTg0MjE2MX0.rHwsoFObSDvHhfZdSeo5L2UOcZPB8v1SnETgQuQL0CQ'

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)