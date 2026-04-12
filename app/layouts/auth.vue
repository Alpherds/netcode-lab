<template>
  <v-app>
    <v-main class="auth-shell">
      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(25, 118, 210, 0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(76, 175, 80, 0.14), transparent 26%),
    linear-gradient(135deg, #f7f9fc 0%, #eef3f9 100%);
}
</style>