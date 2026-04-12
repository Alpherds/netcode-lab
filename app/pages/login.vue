<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

definePageMeta({
  layout: 'auth',
  public: true
})

const auth = useAuthStore()
const route = useRoute()

const activeTab = ref<'login' | 'register'>('login')
const errorMessage = ref('')
const successMessage = ref('')

const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showConfirmPassword = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  accountType: 'STUDENT' as 'STUDENT' | 'INSTRUCTOR'
})

const loginValid = computed(() => {
  return loginForm.email.trim() !== '' && loginForm.password.trim() !== ''
})

const registerValid = computed(() => {
  return (
    registerForm.fullName.trim().length >= 2 &&
    registerForm.email.trim() !== '' &&
    registerForm.password.length >= 6 &&
    registerForm.password === registerForm.confirmPassword &&
    !!registerForm.accountType
  )
})

const registerHeading = computed(() => {
  return registerForm.accountType === 'INSTRUCTOR'
    ? 'Create instructor account request'
    : 'Create student account'
})

const registerDescription = computed(() => {
  return registerForm.accountType === 'INSTRUCTOR'
    ? 'Instructor registration requires protected approval. Your selected account type will be recorded and activated through admin or server-side promotion.'
    : 'Student registration is open. You can create your account and access the student dashboard after authentication.'
})

async function handleLogin() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await auth.signIn(loginForm.email, loginForm.password)

    const redirect = Array.isArray(route.query.redirect)
      ? route.query.redirect[0]
      : route.query.redirect

    await navigateTo(
      typeof redirect === 'string' && redirect
        ? redirect
        : auth.dashboardPath
    )
  } catch (error: any) {
    errorMessage.value = error.message || 'Login failed.'
  }
}

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (registerForm.password !== registerForm.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  try {
    const result = await auth.signUp(
      registerForm.fullName,
      registerForm.email,
      registerForm.password,
      registerForm.accountType
    )

    if (result.session) {
      if (registerForm.accountType === 'INSTRUCTOR') {
        successMessage.value =
          'Instructor account request created. Access level still requires approval.'
      } else {
        successMessage.value = 'Student account created successfully.'
      }

      await navigateTo(auth.dashboardPath)
      return
    }

    successMessage.value =
      registerForm.accountType === 'INSTRUCTOR'
        ? 'Instructor account request submitted. Check your email if confirmation is enabled. Final instructor access still requires approval.'
        : 'Account created. Check your email first if email confirmation is enabled in Supabase.'

    activeTab.value = 'login'
    loginForm.email = registerForm.email
    loginForm.password = ''
  } catch (error: any) {
    errorMessage.value = error.message || 'Registration failed.'
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
            A modern virtual laboratory for
            <span>live IT education</span>
          </h1>

          <p class="brand-subtitle">
            NetCode combines secure online classes, live coding activities,
            and interactive simulation practice inside one controlled digital learning space.
          </p>

          <div class="feature-grid">
            <article class="feature-card feature-blue">
              <div class="feature-icon feature-blue-icon">
                <v-icon size="26">mdi-laptop</v-icon>
              </div>
              <div class="feature-title">Live Coding Lab</div>
              <div class="feature-text">
                Write, run, and evaluate code outputs during active class sessions.
              </div>
            </article>

            <article class="feature-card feature-green">
              <div class="feature-icon feature-green-icon">
                <v-icon size="26">mdi-puzzle</v-icon>
              </div>
              <div class="feature-title">Interactive Simulators</div>
              <div class="feature-text">
                Practice PC assembly and LAN cable activities with guided validation.
              </div>
            </article>

            <article class="feature-card feature-pink">
              <div class="feature-icon feature-pink-icon">
                <v-icon size="26">mdi-video-wireless</v-icon>
              </div>
              <div class="feature-title">Secure Live Sessions</div>
              <div class="feature-text">
                Conduct controlled online classes with attendance and activity tracking.
              </div>
            </article>
          </div>
        </section>
      </v-col>

      <!-- RIGHT / AUTH -->
      <v-col cols="12" lg="5" class="auth-form-col">
        <v-card class="auth-card" rounded="xl" elevation="0">
          <div class="auth-card-glow auth-card-glow-1" />
          <div class="auth-card-glow auth-card-glow-2" />

          <v-tabs
            v-model="activeTab"
            fixed-tabs
            color="primary"
            bg-color="transparent"
            class="auth-tabs"
          >
            <v-tab value="login">Sign In</v-tab>
            <v-tab value="register">Create Account</v-tab>
          </v-tabs>

          <div class="auth-content pa-5 pa-sm-6 pa-md-8">
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

            <v-window v-model="activeTab">
              <!-- LOGIN -->
              <v-window-item value="login">
                <form @submit.prevent="handleLogin">
                  <div class="text-h4 font-weight-bold mb-2 text-white auth-heading">
                    Welcome back
                  </div>

                  <div class="text-body-1 text-grey-lighten-1 mb-6 auth-subheading">
                    Sign in to continue to your NetCode classroom dashboard.
                  </div>

                  <v-text-field
                    v-model="loginForm.email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    autocomplete="email"
                    class="auth-input mb-3"
                    density="comfortable"
                    hide-details="auto"
                  />

                  <v-text-field
                    v-model="loginForm.password"
                    :type="showLoginPassword ? 'text' : 'password'"
                    label="Password"
                    variant="outlined"
                    autocomplete="current-password"
                    class="auth-input mb-2"
                    density="comfortable"
                    hide-details="auto"
                    :append-inner-icon="showLoginPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    @click:append-inner="showLoginPassword = !showLoginPassword"
                  />

                  <div class="d-flex flex-wrap justify-space-between align-center ga-3 mb-6 auth-meta">
                    <div class="text-caption text-grey-lighten-1 auth-meta-text">
                      Use your registered NetCode account.
                    </div>

                    <NuxtLink to="/forgot-password" class="auth-link">
                      Forgot password?
                    </NuxtLink>
                  </div>

                  <v-btn
                    block
                    size="large"
                    color="primary"
                    class="auth-btn"
                    :loading="auth.loading"
                    :disabled="!loginValid"
                    type="submit"
                  >
                    Sign In
                  </v-btn>
                </form>
              </v-window-item>

              <!-- REGISTER -->
              <v-window-item value="register">
                <form @submit.prevent="handleRegister">
                  <div class="text-h4 font-weight-bold mb-2 text-white auth-heading">
                    {{ registerHeading }}
                  </div>

                  <div class="text-body-1 text-grey-lighten-1 mb-6 auth-subheading">
                    {{ registerDescription }}
                  </div>

                  <v-select
                    v-model="registerForm.accountType"
                    label="Account Type"
                    variant="outlined"
                    class="auth-input mb-3"
                    density="comfortable"
                    hide-details="auto"
                    :items="[
                      { title: 'Student', value: 'STUDENT' },
                      { title: 'Instructor', value: 'INSTRUCTOR' }
                    ]"
                  />

                  <v-text-field
                    v-model="registerForm.fullName"
                    label="Full Name"
                    variant="outlined"
                    autocomplete="name"
                    class="auth-input mb-3"
                    density="comfortable"
                    hide-details="auto"
                  />

                  <v-text-field
                    v-model="registerForm.email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    autocomplete="email"
                    class="auth-input mb-3"
                    density="comfortable"
                    hide-details="auto"
                  />

                  <v-text-field
                    v-model="registerForm.password"
                    :type="showRegisterPassword ? 'text' : 'password'"
                    label="Password"
                    variant="outlined"
                    autocomplete="new-password"
                    class="auth-input mb-3"
                    density="comfortable"
                    hide-details="auto"
                    :append-inner-icon="showRegisterPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    @click:append-inner="showRegisterPassword = !showRegisterPassword"
                  />

                  <v-text-field
                    v-model="registerForm.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    label="Confirm Password"
                    variant="outlined"
                    autocomplete="new-password"
                    class="auth-input mb-6"
                    density="comfortable"
                    hide-details="auto"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  />

                  <v-alert
                    v-if="registerForm.accountType === 'INSTRUCTOR'"
                    type="info"
                    variant="tonal"
                    class="mb-4"
                  >
                    Instructor selection is recorded, but final instructor access should still be approved through protected admin or server-side role assignment.
                  </v-alert>

                  <v-btn
                    block
                    size="large"
                    color="primary"
                    class="auth-btn"
                    :loading="auth.loading"
                    :disabled="!registerValid"
                    type="submit"
                  >
                    Create Account
                  </v-btn>
                </form>
              </v-window-item>
            </v-window>
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

/* BRAND SIDE */
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

/* AUTH SIDE */
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

.auth-tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.auth-content {
  position: relative;
  z-index: 1;
}

.auth-heading {
  line-height: 1.1;
}

.auth-subheading {
  line-height: 1.7;
}

.auth-meta {
  min-height: 28px;
}

.auth-meta-text {
  line-height: 1.6;
}

.auth-link {
  color: #45b8ff;
  text-decoration: none;
  font-weight: 700;
  white-space: nowrap;
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

/* DESKTOP */
@media (min-width: 1280px) {
  .auth-brand-col {
    justify-content: flex-start;
  }

  .auth-form-col {
    justify-content: center;
  }

  .brand-panel {
    margin-right: auto;
  }
}

/* TABLET */
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

/* MOBILE / STACK */
/* MOBILE / STACK */
@media (max-width: 959px) {
  .auth-page {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
  }

  .auth-wrapper {
    max-width: 860px;
  }

  /* BRAND FIRST */
  .auth-brand-col {
    order: 1;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  /* LOGIN CARD SECOND / BOTTOM */
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

  .brand-logo-wrap {
    justify-content: center;
    width: 100%;
    margin-bottom: 1.1rem;
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

/* SMALL MOBILE */
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

  .auth-meta {
    flex-direction: column;
    align-items: flex-start !important;
  }
}

/* NARROW MOBILE */
@media (max-width: 480px) {
  .auth-form-col {
    margin-bottom: 1.5rem;
  }

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