<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

definePageMeta({
  layout: 'auth',
  public: true
})

const auth = useAuthStore()

const password = ref('')
const confirmPassword = ref('')

const errorMessage = ref('')
const successMessage = ref('')

const valid = computed(() => {
  return password.value.length >= 6 && password.value === confirmPassword.value
})

async function handleUpdatePassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  try {
    await auth.updatePassword(password.value)
    successMessage.value = 'Password updated successfully. Redirecting to login...'

    setTimeout(() => {
      navigateTo('/login')
    }, 1200)
  } catch (error: any) {
    errorMessage.value =
      error.message || 'Password update failed. Open the reset link from your email again.'
  }
}
</script>

<template>
  <v-container class="fill-height py-8">
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" lg="5">
        <v-card rounded="xl" elevation="8" class="pa-6 pa-md-8">
          <div class="d-flex align-center ga-4 mb-6">
            <v-avatar size="56" rounded="lg">
              <v-img src="/logo.png" alt="NetCode Logo" />
            </v-avatar>

            <div>
              <div class="text-h5 font-weight-bold">Set New Password</div>
              <div class="text-body-2 text-medium-emphasis">
                Enter your new password to recover access to your NetCode account.
              </div>
            </div>
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

          <form @submit.prevent="handleUpdatePassword">
            <v-text-field
              v-model="password"
              label="New Password"
              type="password"
              variant="outlined"
              autocomplete="new-password"
              class="mb-3"
            />

            <v-text-field
              v-model="confirmPassword"
              label="Confirm New Password"
              type="password"
              variant="outlined"
              autocomplete="new-password"
              class="mb-6"
            />

            <v-btn
              block
              size="large"
              color="primary"
              :loading="auth.loading"
              :disabled="!valid"
              type="submit"
            >
              Update Password
            </v-btn>
          </form>

          <div class="text-center mt-5">
            <NuxtLink to="/login" class="text-decoration-none text-primary">
              Back to login
            </NuxtLink>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>