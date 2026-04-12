<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore';

const auth = useAuthStore()

onMounted(async () => {
  if (!auth.initialized) {
    await auth.init()
  }

  if (auth.isAuthenticated) {
    await navigateTo(auth.dashboardPath)
  } else {
    await navigateTo('/login')
  }
})
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <div class="text-center">
      <v-progress-circular indeterminate color="primary" size="48" />
      <div class="text-body-1 mt-4">Loading NetCode...</div>
    </div>
  </v-container>
</template>