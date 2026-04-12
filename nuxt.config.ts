export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@pinia/nuxt',
    'vuetify-nuxt-module'
  ],

  css: [
    'vuetify/styles'
  ],

  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  }
})