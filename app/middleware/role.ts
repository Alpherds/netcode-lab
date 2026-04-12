import { useAuthStore } from "~/stores/useAuthStore"

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.init()
  }

  const allowedRoles = (to.meta.roles || []) as Array<'INSTRUCTOR' | 'STUDENT'>

  if (!allowedRoles.length) return

  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }

  if (!auth.role || !allowedRoles.includes(auth.role)) {
    return navigateTo(auth.dashboardPath)
  }
})