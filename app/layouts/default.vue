<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

const auth = useAuthStore()

async function handleLogout() {
  await auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <v-app>
    <v-app-bar flat border>
      <div class="d-flex align-center ga-3">
        <v-avatar size="38" rounded="lg">
          <v-img src="/logo.png" alt="NetCode Logo" />
        </v-avatar>

        <div>
          <div class="text-subtitle-1 font-weight-bold">NetCode</div>
          <div class="text-caption text-medium-emphasis">Interactive Virtual Laboratory</div>
        </div>
      </div>

      <v-spacer />

      <template v-if="auth.isAuthenticated">
        <v-chip class="mr-3" color="primary" variant="tonal">
          {{ auth.role }}
        </v-chip>

        <div class="text-body-2 mr-4">{{ auth.fullName }}</div>

        <v-btn color="primary" variant="flat" @click="handleLogout">
          Logout
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>