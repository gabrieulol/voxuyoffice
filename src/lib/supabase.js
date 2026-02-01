import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wcdmwzxwzrncmkoxogho.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZG13enh3enJuY21rb3hvZ2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzQxNzQsImV4cCI6MjA4NTU1MDE3NH0.-sPL-LB0CwD-Ritb0qUUDv2-WoUxhYUAL3v5wLUD3rU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 15 },
  },
})
