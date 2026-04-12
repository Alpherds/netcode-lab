<template>
  <v-app>
    <v-main class="auth-shell">
      <div class="auth-bg">
        <div class="bg-orb orb-1" />
        <div class="bg-orb orb-2" />
        <div class="bg-grid" />
      </div>

      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(73, 194, 255, 0.14), transparent 28%),
    radial-gradient(circle at bottom right, rgba(255, 60, 110, 0.12), transparent 24%),
    linear-gradient(135deg, #f4f8fc 0%, #edf3f8 48%, #f7fbff 100%);
}

.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(70px);
  opacity: 0.8;
}

.orb-1 {
  width: 320px;
  height: 320px;
  background: rgba(59, 189, 255, 0.22);
  top: -60px;
  left: -40px;
}

.orb-2 {
  width: 360px;
  height: 360px;
  background: rgba(255, 55, 120, 0.16);
  bottom: -100px;
  right: -80px;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 85%);
  opacity: 0.3;
}
</style>