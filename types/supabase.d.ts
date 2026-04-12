import type { SupabaseClient } from '@supabase/supabase-js'

declare module '#app' {
  interface NuxtApp {
    $supabase: SupabaseClient
  }

  interface PageMeta {
    public?: boolean
    roles?: Array<'INSTRUCTOR' | 'STUDENT'>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $supabase: SupabaseClient
  }
}

export {}