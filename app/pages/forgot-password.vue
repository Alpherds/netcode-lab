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
    successMessage.value = 'Password reset email sent. Check your inbox.'
  } catch (error: any) {
    errorMessage.value = error.message || 'Unable to send reset email.'
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
              <div class="text-h5 font-weight-bold">Forgot Password</div>
              <div class="text-body-2 text-medium-emphasis">
                Enter your account email to receive a password reset link.
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

          <form @submit.prevent="handleResetRequest">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              variant="outlined"
              autocomplete="email"
              class="mb-6"
            />

            <v-btn
              block
              size="large"
              color="primary"
              :loading="auth.loading"
              :disabled="!email"
              type="submit"
            >
              Send Reset Link
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