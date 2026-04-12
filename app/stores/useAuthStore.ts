import { defineStore } from 'pinia'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

export type AppRole = 'INSTRUCTOR' | 'STUDENT'

export interface AppProfile {
  id: string
  full_name: string
  role: AppRole
  created_at: string
  updated_at: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabase()
  const config = useRuntimeConfig()

  const session = ref<Session | null>(null)
  const authUser = ref<SupabaseUser | null>(null)
  const profile = ref<AppProfile | null>(null)

  const loading = ref(false)
  const initialized = ref(false)

  let listenerBound = false

  const isAuthenticated = computed(() => !!session.value?.user)

  const role = computed<AppRole | null>(() => profile.value?.role ?? null)

  const fullName = computed(() => {
    return (
      profile.value?.full_name ||
      authUser.value?.user_metadata?.full_name ||
      authUser.value?.email?.split('@')[0] ||
      'User'
    )
  })

  const dashboardPath = computed(() => {
    if (role.value === 'INSTRUCTOR') return '/instructor/dashboard'
    if (role.value === 'STUDENT') return '/student/dashboard'
    return '/login'
  })

  async function fetchProfile(userId: string, attempts = 5): Promise<AppProfile | null> {
    for (let i = 0; i < attempts; i++) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (data) {
        profile.value = data as AppProfile
        return profile.value
      }

      if (!error || error.code === 'PGRST116') {
        await sleep(400)
        continue
      }

      console.warn('Profile fetch warning:', error.message)
      await sleep(400)
    }

    profile.value = null
    return null
  }

  async function syncFromSession(nextSession: Session | null) {
    session.value = nextSession
    authUser.value = nextSession?.user ?? null

    if (authUser.value) {
      await fetchProfile(authUser.value.id)
    } else {
      profile.value = null
    }
  }

  function bindListener() {
    if (listenerBound) return

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncFromSession(nextSession)
    })

    listenerBound = true
  }

  async function init() {
    if (initialized.value) return

    loading.value = true
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      await syncFromSession(data.session)
      bindListener()
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw new Error(error.message)

      await syncFromSession(data.session)
      return data
    } finally {
      loading.value = false
    }
  }

  async function signUp(
  fullName: string,
  email: string,
  password: string,
  accountType: 'STUDENT' | 'INSTRUCTOR' = 'STUDENT'
) {
  loading.value = true
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType
        },
        emailRedirectTo: `${config.public.siteUrl}/login`
      }
    })

    if (error) throw new Error(error.message)

    if (data.session) {
      await syncFromSession(data.session)
    }

    return data
  } finally {
    loading.value = false
  }
}

async function resendSignupConfirmation(email: string) {
  loading.value = true
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })

    if (error) throw new Error(error.message)
  } finally {
    loading.value = false
  }
}


 

  async function signOut() {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(error.message)

      session.value = null
      authUser.value = null
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  async function sendPasswordReset(email: string) {
    loading.value = true
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.public.siteUrl}/reset-password`
      })

      if (error) throw new Error(error.message)
    } finally {
      loading.value = false
    }
  }

  async function updatePassword(password: string) {
    loading.value = true
    try {
      const { error } = await supabase.auth.updateUser({
        password
      })

      if (error) throw new Error(error.message)
    } finally {
      loading.value = false
    }
  }

  async function refreshProfile() {
    if (!authUser.value) return
    await fetchProfile(authUser.value.id)
  }

  return {
    session,
    authUser,
    profile,
    loading,
    initialized,
    isAuthenticated,
    role,
    fullName,
    dashboardPath,
    init,
    signIn,
    signUp,
    resendSignupConfirmation,
    signOut,
    sendPasswordReset,
    updatePassword,
    refreshProfile
  }
})