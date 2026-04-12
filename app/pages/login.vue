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

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loginValid = computed(() => {
  return loginForm.email.trim() !== '' && loginForm.password.trim() !== ''
})

const registerValid = computed(() => {
  return (
    registerForm.fullName.trim().length >= 2 &&
    registerForm.email.trim() !== '' &&
    registerForm.password.length >= 6 &&
    registerForm.password === registerForm.confirmPassword
  )
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
      registerForm.password
    )

    if (result.session) {
      successMessage.value = 'Account created successfully.'
      await navigateTo(auth.dashboardPath)
      return
    }

    successMessage.value =
      'Account created. Check your email first if email confirmation is enabled in Supabase.'

    activeTab.value = 'login'
    loginForm.email = registerForm.email
    loginForm.password = ''
  } catch (error: any) {
    errorMessage.value = error.message || 'Registration failed.'
  }
}
</script>

<template>
  <v-container class="fill-height py-8">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12" md="6" lg="5" class="mb-6 mb-md-0">
        <v-sheet
          rounded="xl"
          elevation="0"
          class="pa-8 h-100 d-flex flex-column justify-center"
          color="transparent"
        >
          <div class="d-flex align-center ga-4 mb-8">
            <v-avatar size="70" rounded="xl" color="white">
              <v-img src="/logo.png" alt="NetCode Logo" />
            </v-avatar>

            <div>
              <div class="text-h3 font-weight-bold">NetCode</div>
              <div class="text-subtitle-1 text-medium-emphasis">
                Interactive Virtual Laboratory for IT Education
              </div>
            </div>
          </div>

          <v-card rounded="xl" variant="flat" class="pa-6 mb-6">
            <div class="text-h5 font-weight-bold mb-3">One platform for live IT learning</div>
            <div class="text-body-1 text-medium-emphasis">
              Conduct secure online classes, real-time coding activities, and interactive
              virtual simulations inside one controlled digital classroom.
            </div>
          </v-card>

          <v-row>
            <v-col cols="12" sm="6">
              <v-card rounded="xl" variant="tonal" color="primary" class="pa-4">
                <div class="font-weight-bold mb-2">Live Coding Lab</div>
                <div class="text-body-2">
                  Run coding tasks, display outputs, and track student attempts.
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6">
              <v-card rounded="xl" variant="tonal" color="success" class="pa-4">
                <div class="font-weight-bold mb-2">Interactive Simulators</div>
                <div class="text-body-2">
                  Practice PC assembly and LAN cable activities in a guided virtual lab.
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>

      <v-col cols="12" md="6" lg="5">
        <v-card rounded="xl" elevation="8" class="overflow-hidden">
          <v-tabs v-model="activeTab" fixed-tabs color="primary" bg-color="white">
            <v-tab value="login">Sign In</v-tab>
            <v-tab value="register">Create Account</v-tab>
          </v-tabs>

          <div class="pa-6 pa-md-8">
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
              <v-window-item value="login">
                <form @submit.prevent="handleLogin">
                  <div class="text-h5 font-weight-bold mb-2">Welcome back</div>
                  <div class="text-body-2 text-medium-emphasis mb-6">
                    Sign in to continue to your NetCode classroom dashboard.
                  </div>

                  <v-text-field
                    v-model="loginForm.email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    autocomplete="email"
                    class="mb-3"
                  />

                  <v-text-field
                    v-model="loginForm.password"
                    label="Password"
                    type="password"
                    variant="outlined"
                    autocomplete="current-password"
                    class="mb-2"
                  />

                  <div class="d-flex justify-space-between align-center mb-6">
                    <div class="text-caption text-medium-emphasis">
                      Use your registered NetCode account.
                    </div>

                    <NuxtLink to="/forgot-password" class="text-decoration-none text-primary">
                      Forgot password?
                    </NuxtLink>
                  </div>

                  <v-btn
                    block
                    size="large"
                    color="primary"
                    variant="flat"
                    :loading="auth.loading"
                    :disabled="!loginValid"
                    type="submit"
                  >
                    Sign In
                  </v-btn>
                </form>
              </v-window-item>

              <v-window-item value="register">
                <form @submit.prevent="handleRegister">
                  <div class="text-h5 font-weight-bold mb-2">Create student account</div>
                  <div class="text-body-2 text-medium-emphasis mb-6">
                    Student registration is open. Instructor accounts should be assigned through
                    protected admin/server setup.
                  </div>

                  <v-text-field
                    v-model="registerForm.fullName"
                    label="Full Name"
                    variant="outlined"
                    autocomplete="name"
                    class="mb-3"
                  />

                  <v-text-field
                    v-model="registerForm.email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    autocomplete="email"
                    class="mb-3"
                  />

                  <v-text-field
                    v-model="registerForm.password"
                    label="Password"
                    type="password"
                    variant="outlined"
                    autocomplete="new-password"
                    class="mb-3"
                  />

                  <v-text-field
                    v-model="registerForm.confirmPassword"
                    label="Confirm Password"
                    type="password"
                    variant="outlined"
                    autocomplete="new-password"
                    class="mb-6"
                  />

                  <v-btn
                    block
                    size="large"
                    color="primary"
                    variant="flat"
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