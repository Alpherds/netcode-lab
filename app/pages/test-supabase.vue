<script setup lang="ts">
const supabase = useSupabase()

const status = ref('Checking...')
const details = ref<any>(null)

onMounted(async () => {
  try {
    const results: Record<string, any> = {}

    // 1) Basic client check
    results.clientLoaded = !!supabase

    // 2) Auth layer check
    const sessionRes = await supabase.auth.getSession()
    results.authCheck = {
      hasSession: !!sessionRes.data.session,
      error: sessionRes.error ? sessionRes.error.message : null
    }

    // 3) Database/API response check
    const dbRes = await supabase
      .from('users')
      .select('id')
      .limit(1)

    results.dbCheck = {
      data: dbRes.data,
      error: dbRes.error ? dbRes.error.message : null
    }

    details.value = results

    // Connection success logic
    if (results.clientLoaded && !sessionRes.error && !dbRes.error) {
      status.value = '✅ Supabase connected successfully'
    } else if (
      results.clientLoaded &&
      !sessionRes.error &&
      dbRes.error &&
      (
        dbRes.error.message?.includes('row-level security') ||
        dbRes.error.message?.includes('permission denied') ||
        dbRes.error.message?.includes('JWT')
      )
    ) {
      status.value = '✅ Supabase connected, but access is restricted by auth/RLS'
    } else {
      status.value = '⚠️ Supabase responded, but check details below'
    }
  } catch (err: any) {
    status.value = '❌ Supabase connection failed'
    details.value = {
      fatalError: err?.message || String(err)
    }
  }
})
</script>

<template>
  <v-container class="py-10">
    <v-card>
      <v-card-title>Supabase Connection Test</v-card-title>
      <v-card-text>
        <div class="mb-4">{{ status }}</div>

        <pre style="white-space: pre-wrap;">{{ details }}</pre>
      </v-card-text>
    </v-card>
  </v-container>
</template>