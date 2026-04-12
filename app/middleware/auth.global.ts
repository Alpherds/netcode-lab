import { useAuthStore } from "~/stores/useAuthStore"

export default defineNuxtRouteMiddleware(async (to) => {
    
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.init()
  }

  const publicPaths = ['/login', '/forgot-password', '/reset-password']
  const isPublicRoute = Boolean(to.meta.public) || publicPaths.includes(to.path)

  if (!auth.isAuthenticated && !isPublicRoute) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (
    auth.isAuthenticated &&
    (to.path === '/' || publicPaths.includes(to.path))
  ) {
    return navigateTo(auth.dashboardPath)
  }
})