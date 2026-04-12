<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'

const auth = useAuthStore()
const mobileDrawer = ref(false)

const dashboardHome = computed(() => {
  if (auth.role === 'INSTRUCTOR') return '/instructor/dashboard'
  if (auth.role === 'STUDENT') return '/student/dashboard'
  return '/'
})

const workspaceLabel = computed(() => {
  if (auth.role === 'INSTRUCTOR') return 'Instructor Workspace'
  if (auth.role === 'STUDENT') return 'Student Workspace'
  return 'Interactive Virtual Laboratory'
})

const initials = computed(() => {
  const name = auth.fullName || 'User'
  return name
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

async function handleLogout() {
  mobileDrawer.value = false
  await auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <v-app>
    <v-app-bar class="app-navbar" flat height="74">
      <v-container fluid class="navbar-container">
        <div class="navbar-inner">
          <!-- LEFT: LOGO ONLY -->
          <NuxtLink :to="dashboardHome" class="navbar-brand">
            <img src="/logo.png" alt="NetCode Logo" class="brand-logo" />
          </NuxtLink>

          <!-- DESKTOP ACTIONS -->
          <div v-if="auth.isAuthenticated" class="navbar-actions desktop-actions">
            <v-chip
              class="role-chip"
              color="primary"
              variant="tonal"
              size="small"
            >
              {{ auth.role }}
            </v-chip>

            <div class="user-block">
              <div class="user-name">{{ auth.fullName }}</div>
              <div class="user-subtitle">{{ workspaceLabel }}</div>
            </div>

            <v-btn
              color="primary"
              variant="flat"
              class="logout-btn"
              @click="handleLogout"
            >
              <v-icon size="18" class="mr-2">mdi-logout</v-icon>
              Logout
            </v-btn>
          </div>

          <!-- MOBILE HAMBURGER -->
          <div v-if="auth.isAuthenticated" class="mobile-actions">
            <v-btn
              icon
              variant="text"
              class="menu-btn"
              @click="mobileDrawer = true"
            >
              <v-icon size="26">mdi-menu</v-icon>
            </v-btn>
          </div>
        </div>
      </v-container>
    </v-app-bar>

    <!-- MOBILE DRAWER -->
    <v-navigation-drawer
      v-model="mobileDrawer"
      location="right"
      temporary
      width="300"
      class="mobile-drawer"
    >
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="drawer-brand">
            <img src="/logo.png" alt="NetCode Logo" class="drawer-logo" />
          </div>

          <v-btn
            icon
            variant="text"
            @click="mobileDrawer = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="drawer-user-card">
          <div class="drawer-avatar">{{ initials }}</div>

          <div class="drawer-user-copy">
            <div class="drawer-user-name">{{ auth.fullName }}</div>
            <div class="drawer-user-subtitle">{{ workspaceLabel }}</div>
          </div>
        </div>

        <div class="drawer-role-wrap">
          <v-chip color="primary" variant="tonal">
            {{ auth.role }}
          </v-chip>
        </div>

        <div class="drawer-links">
          <NuxtLink :to="dashboardHome" class="drawer-link" @click="mobileDrawer = false">
            <v-icon size="20">mdi-view-dashboard-outline</v-icon>
            <span>Dashboard</span>
          </NuxtLink>

          <button class="drawer-link drawer-link-button" @click="handleLogout">
            <v-icon size="20">mdi-logout</v-icon>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </v-navigation-drawer>

    <v-main class="app-main">
      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.app-navbar {
  background:
    linear-gradient(135deg, rgba(9, 17, 34, 0.97) 0%, rgba(7, 16, 34, 0.99) 55%, rgba(8, 28, 58, 0.98) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 10px 30px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(14px);
}

.navbar-container {
  max-width: 1440px;
  margin: 0 auto;
  padding-inline: 1rem;
}

.navbar-inner {
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.brand-logo {
  width: 150px;
  object-fit: contain;
  display: block;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.role-chip {
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.user-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
}

.user-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.96rem;
  line-height: 1.15;
  font-weight: 800;
  color: #ffffff;
}

.user-subtitle {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.6);
}

.logout-btn {
  height: 44px;
  padding-inline: 1rem;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
  box-shadow: 0 10px 24px rgba(47, 200, 255, 0.16);
}

.mobile-actions {
  display: none;
}

.menu-btn {
  color: white;
}

.app-main {
  background: transparent;
}

/* DRAWER */
.drawer-content {
  height: 100%;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(13, 17, 29, 0.98) 0%, rgba(16, 19, 31, 1) 100%);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.drawer-brand {
  display: flex;
  align-items: center;
}

.drawer-logo {
  width: 120px;
  height: auto;
  object-fit: contain;
  display: block;
}

.drawer-user-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 1rem;
}

.drawer-avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(135deg, rgba(47, 200, 255, 0.18) 0%, rgba(142, 194, 244, 0.22) 100%);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 900;
  flex-shrink: 0;
}

.drawer-user-copy {
  min-width: 0;
}

.drawer-user-name {
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.2;
  color: #ffffff;
  margin-bottom: 0.15rem;
}

.drawer-user-subtitle {
  font-size: 0.82rem;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.62);
}

.drawer-role-wrap {
  margin-bottom: 1rem;
}

.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.drawer-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 48px;
  padding: 0.8rem 0.95rem;
  border-radius: 14px;
  text-decoration: none;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
  transition: background 0.2s ease;
}

.drawer-link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.drawer-link-button {
  border: 0;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .desktop-actions {
    display: none;
  }

  .mobile-actions {
    display: flex;
    align-items: center;
  }

  .navbar-container {
    padding-inline: 0.8rem;
  }

  .brand-logo {
    width: 120px;
  }
}

@media (max-width: 640px) {
  .navbar-container {
    padding-inline: 0.6rem;
  }

  .brand-logo {
    width: 120px;
  }
}
</style>