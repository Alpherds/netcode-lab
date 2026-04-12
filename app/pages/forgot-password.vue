<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

definePageMeta({
  layout: 'auth',
  public: true
})

const auth = useAuthStore()

const email = ref('')
const errorMessage = ref('')
const successMessage = ref('')

async function handleResetRequest() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await auth.sendPasswordReset(email.value)
    successMessage.value =
      'Password reset link sent. Check your email inbox and follow the recovery link.'
  } catch (error: any) {
    errorMessage.value = error.message || 'Unable to send reset link.'
  }
}
</script>

<template>
  <v-container fluid class="auth-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
    <v-row class="auth-wrapper ma-0" align="center" justify="center">
      <!-- LEFT / BRAND -->
      <v-col cols="12" lg="7" class="auth-brand-col">
        <section class="brand-panel">
          <div class="brand-logo-wrap">
            <img src="/logo.png" alt="NetCode Logo" class="brand-logo" />
          </div>

          <div class="brand-chip">
            learning • Live coding • Interactive simulations
          </div>

          <h1 class="brand-title">
            Recover access to your
            <span>NetCode account</span>
          </h1>

          <p class="brand-subtitle">
            Enter your registered email address and we will send you a secure password
            recovery link so you can continue using your virtual laboratory account.
          </p>

          <div class="feature-grid">
            <article class="feature-card feature-blue">
              <div class="feature-icon feature-blue-icon">
                <v-icon size="26">mdi-email-fast-outline</v-icon>
              </div>
              <div class="feature-title">Secure Recovery</div>
              <div class="feature-text">
                Reset links are delivered through your registered account email.
              </div>
            </article>

            <article class="feature-card feature-green">
              <div class="feature-icon feature-green-icon">
                <v-icon size="26">mdi-shield-lock-outline</v-icon>
              </div>
              <div class="feature-title">Protected Access</div>
              <div class="feature-text">
                Recovery is handled through the authentication layer for safer account access.
              </div>
            </article>

            <article class="feature-card feature-pink">
              <div class="feature-icon feature-pink-icon">
                <v-icon size="26">mdi-account-check-outline</v-icon>
              </div>
              <div class="feature-title">Continue Learning</div>
              <div class="feature-text">
                Restore your access and continue coding, simulations, and live classes.
              </div>
            </article>
          </div>
        </section>
      </v-col>

      <!-- RIGHT / CARD -->
      <v-col cols="12" lg="5" class="auth-form-col">
        <v-card class="auth-card" rounded="xl" elevation="0">
          <div class="auth-card-glow auth-card-glow-1" />
          <div class="auth-card-glow auth-card-glow-2" />

          <div class="auth-content pa-5 pa-sm-6 pa-md-8">
            <div class="auth-card-logo-wrap mb-5">
              <img src="/logo.png" alt="NetCode Logo" class="auth-card-logo" />
            </div>

            <div class="text-h4 font-weight-bold mb-2 text-white auth-heading">
              Forgot password
            </div>

            <div class="text-body-1 text-grey-lighten-1 mb-6 auth-subheading">
              Enter your account email to receive a password reset link.
            </div>

            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ errorMessage }}
            </v-alert>

            <v-alert
              v-if="successMessage"
              type="success"
              variant="tonal"
              class="mb-4"
            >
              {{ successMessage }}
            </v-alert>

            <form @submit.prevent="handleResetRequest">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                variant="outlined"
                autocomplete="email"
                class="auth-input mb-6"
                density="comfortable"
                hide-details="auto"
              />

              <v-btn
                block
                size="large"
                color="primary"
                class="auth-btn"
                :loading="auth.loading"
                :disabled="!email.trim()"
                type="submit"
              >
                Send Reset Link
              </v-btn>
            </form>

            <div class="d-flex justify-center mt-5">
              <NuxtLink to="/login" class="auth-link">
                Back to login
              </NuxtLink>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.auth-wrapper {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.auth-brand-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-panel {
  width: 100%;
  max-width: 760px;
  padding: 1rem 1.5rem 1rem 0.5rem;
}

.brand-logo-wrap {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1.25rem;
}

.brand-logo {
  width: min(100%, 420px);
  height: auto;
  display: block;
  object-fit: contain;
}

.brand-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.65rem 1.1rem;
  margin-bottom: 1.2rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(16px);
}

.brand-title {
  max-width: 720px;
  margin: 0 0 1rem;
  font-size: clamp(2.4rem, 5vw, 4.6rem);
  line-height: 1.02;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #0f172a;
}

.brand-title span {
  background: linear-gradient(90deg, #ff3c5f 0%, #2fc8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-subtitle {
  max-width: 680px;
  margin: 0 0 2rem;
  font-size: 1.08rem;
  line-height: 1.8;
  color: #475569;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

.feature-card {
  grid-column: span 4;
  min-height: 190px;
  padding: 1.2rem 1.1rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}

.feature-blue {
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
}

.feature-green {
  background: linear-gradient(180deg, rgba(227, 248, 239, 0.95), rgba(213, 241, 227, 0.88));
}

.feature-pink {
  background: linear-gradient(180deg, rgba(255, 232, 239, 0.95), rgba(252, 216, 228, 0.88));
}

.feature-icon {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  margin-bottom: 0.95rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

.feature-blue-icon {
  background: linear-gradient(180deg, rgba(77, 166, 255, 0.16), rgba(59, 130, 246, 0.12));
  color: #1d4ed8;
}

.feature-green-icon {
  background: linear-gradient(180deg, rgba(52, 211, 153, 0.16), rgba(16, 185, 129, 0.12));
  color: #059669;
}

.feature-pink-icon {
  background: linear-gradient(180deg, rgba(251, 113, 133, 0.16), rgba(244, 63, 94, 0.12));
  color: #e11d48;
}

.feature-title {
  margin-bottom: 0.55rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.feature-text {
  font-size: 0.97rem;
  line-height: 1.75;
  color: #475569;
}

.auth-form-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.36);
  background:
    linear-gradient(180deg, rgba(13, 17, 29, 0.9) 0%, rgba(16, 19, 31, 0.95) 100%);
  box-shadow:
    0 24px 80px rgba(15, 23, 42, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px);
}

.auth-card-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(12px);
}

.auth-card-glow-1 {
  width: 220px;
  height: 220px;
  left: -40px;
  bottom: -70px;
  background: radial-gradient(circle, rgba(47, 200, 255, 0.17), transparent 70%);
}

.auth-card-glow-2 {
  width: 180px;
  height: 180px;
  right: -40px;
  top: -50px;
  background: radial-gradient(circle, rgba(255, 60, 95, 0.12), transparent 70%);
}

.auth-content {
  position: relative;
  z-index: 1;
}

.auth-card-logo-wrap {
  display: flex;
  justify-content: flex-start;
}

.auth-card-logo {
  width: min(100%, 210px);
  height: auto;
  object-fit: contain;
}

.auth-heading {
  line-height: 1.1;
}

.auth-subheading {
  line-height: 1.7;
}

.auth-link {
  color: #45b8ff;
  text-decoration: none;
  font-weight: 700;
}

.auth-link:hover {
  text-decoration: underline;
}

.auth-btn {
  height: 54px;
  border-radius: 14px;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;
  box-shadow: 0 12px 30px rgba(47, 200, 255, 0.24);
}

:deep(.auth-input .v-field) {
  min-height: 56px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
}

:deep(.auth-input .v-field__outline) {
  opacity: 0.9;
}

:deep(.auth-input input) {
  color: white;
}

:deep(.auth-input .v-label) {
  color: rgba(255, 255, 255, 0.72);
}

@media (min-width: 1280px) {
  .auth-brand-col {
    justify-content: flex-start;
  }

  .brand-panel {
    margin-right: auto;
  }
}

@media (max-width: 1279px) {
  .brand-panel {
    max-width: 720px;
    padding: 0.5rem 1rem 0.5rem;
  }

  .brand-logo {
    width: min(100%, 380px);
  }

  .feature-card {
    grid-column: span 6;
    min-height: 176px;
  }
}

@media (max-width: 959px) {
  .auth-page {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
  }

  .auth-wrapper {
    max-width: 860px;
  }

  .auth-brand-col {
    order: 1;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .auth-form-col {
    order: 2;
    justify-content: center;
    margin-bottom: 0;
  }

  .auth-card {
    max-width: 760px;
    margin: 0 auto;
  }

  .brand-panel {
    max-width: 760px;
    padding: 0;
    margin: 0 auto;
    text-align: center;
  }

  .brand-logo-wrap,
  .auth-card-logo-wrap {
    justify-content: center;
    width: 100%;
  }

  .brand-logo {
    width: min(100%, 420px);
    margin: 0 auto;
  }

  .brand-chip {
    width: 100%;
    max-width: 720px;
    margin-left: auto;
    margin-right: auto;
  }

  .brand-title,
  .brand-subtitle {
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  .feature-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .feature-card {
    grid-column: auto;
    min-height: auto;
    text-align: left;
  }
}

@media (max-width: 768px) {
  .auth-page {
    padding-left: 0.75rem !important;
    padding-right: 0.75rem !important;
  }

  .auth-card {
    max-width: 100%;
    border-radius: 28px !important;
  }

  .auth-content {
    padding: 1.35rem !important;
  }

  .auth-heading {
    font-size: 1.8rem !important;
  }

  .auth-subheading {
    font-size: 0.98rem !important;
    margin-bottom: 1.35rem !important;
  }

  .brand-logo {
    width: min(100%, 330px);
  }

  .brand-title {
    font-size: 2.35rem;
    line-height: 1.06;
  }

  .brand-subtitle {
    font-size: 0.98rem;
    line-height: 1.75;
    margin-bottom: 1.5rem;
  }

  .brand-chip {
    padding: 0.85rem 1rem;
    border-radius: 22px;
    font-size: 0.95rem;
  }

  .feature-card {
    padding: 1.2rem 1rem;
    border-radius: 24px;
  }
}

@media (max-width: 480px) {
  .auth-card {
    max-width: 100%;
  }

  .auth-content {
    padding: 1.1rem !important;
  }

  .auth-heading {
    font-size: 1.45rem !important;
  }

  .auth-subheading {
    font-size: 0.93rem !important;
    line-height: 1.65;
  }

  .brand-logo {
    width: min(100%, 285px);
  }

  .brand-title {
    font-size: 1.85rem;
    line-height: 1.08;
  }

  .brand-subtitle {
    font-size: 0.92rem;
    line-height: 1.7;
  }

  .brand-chip {
    font-size: 0.9rem;
    line-height: 1.55;
  }

  .feature-title {
    font-size: 1rem;
  }

  .feature-text {
    font-size: 0.92rem;
  }

  .auth-btn {
    height: 52px;
  }

  :deep(.auth-input .v-field) {
    min-height: 54px;
  }
}
</style>