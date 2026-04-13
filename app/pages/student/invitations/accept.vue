<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['STUDENT']
})

interface InvitationPreview {
  id: string
  email: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expires_at: string
  class_id: string
  class_name: string
  class_code: string
  class_status: 'ACTIVE' | 'ARCHIVED'
  instructor_name: string
}

const supabase = useSupabase()
const route = useRoute()

const loading = ref(false)
const accepting = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const invitation = ref<InvitationPreview | null>(null)

const token = computed(() => {
  return typeof route.query.token === 'string' ? route.query.token.trim() : ''
})

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Unable to get access token')
  }

  return data.session.access_token
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'

  try {
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return value
  }
}

async function fetchInvitation() {
  if (!token.value) {
    errorMessage.value = 'Missing invitation token.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const accessToken = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      invitation: InvitationPreview
    }>(`/api/invitations/resolve?token=${encodeURIComponent(token.value)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    invitation.value = response.invitation
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load invitation.'
  } finally {
    loading.value = false
  }
}

async function acceptInvitation() {
  if (!token.value) return

  accepting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const accessToken = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      class: {
        id: string
        class_name: string
      }
    }>('/api/invitations/accept', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: {
        token: token.value
      }
    })

    successMessage.value = `You have successfully joined ${response.class.class_name}.`

    setTimeout(() => {
      navigateTo('/student/dashboard')
    }, 1400)
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to accept invitation.'
  } finally {
    accepting.value = false
  }
}

onMounted(fetchInvitation)
</script>

<template>
  <v-container fluid class="accept-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
    <section v-if="loading" class="state-card">
      <v-progress-circular indeterminate color="primary" size="42" />
      <div class="state-text">Loading invitation...</div>
    </section>

    <template v-else>
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

      <section v-if="invitation" class="accept-card">
        <div class="accept-chip mb-4">
          Student Invitation • NetCode Virtual Laboratory
        </div>

        <h1 class="accept-title">
          Accept class invitation
        </h1>

        <p class="accept-subtitle">
          Review the class invitation below and confirm enrollment into the class.
        </p>

        <div class="accept-info">
          <div class="info-row">
            <div class="info-label">Class</div>
            <div class="info-value">{{ invitation.class_name }}</div>
          </div>

          <div class="info-row">
            <div class="info-label">Class Code</div>
            <div class="info-value">{{ invitation.class_code }}</div>
          </div>

          <div class="info-row">
            <div class="info-label">Instructor</div>
            <div class="info-value">{{ invitation.instructor_name }}</div>
          </div>

          <div class="info-row">
            <div class="info-label">Invited Email</div>
            <div class="info-value">{{ invitation.email }}</div>
          </div>

          <div class="info-row">
            <div class="info-label">Status</div>
            <div class="info-value">{{ invitation.status }}</div>
          </div>

          <div class="info-row">
            <div class="info-label">Expires</div>
            <div class="info-value">{{ formatDateTime(invitation.expires_at) }}</div>
          </div>
        </div>

        <div class="accept-actions">
          <v-btn
            color="primary"
            size="large"
            class="accept-btn"
            :loading="accepting"
            :disabled="invitation.status !== 'PENDING'"
            @click="acceptInvitation"
          >
            Accept Invitation
          </v-btn>

          <v-btn
            variant="outlined"
            size="large"
            class="accept-btn-outline"
            @click="navigateTo('/student/dashboard')"
          >
            Back to Dashboard
          </v-btn>
        </div>
      </section>
    </template>
  </v-container>
</template>

<style scoped>
.accept-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(47, 200, 255, 0.05), transparent 24%),
    radial-gradient(circle at bottom right, rgba(255, 60, 95, 0.04), transparent 18%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.state-card,
.accept-card {
  max-width: 760px;
  margin: 0 auto;
  border-radius: 28px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
  padding: 1.5rem;
}

.state-card {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.state-text {
  margin-top: 0.9rem;
  color: #64748b;
}

.accept-chip {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
  color: #1d4ed8;
  font-size: 0.88rem;
  font-weight: 700;
}

.accept-title {
  margin: 0 0 0.8rem;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  line-height: 1.05;
  font-weight: 900;
  color: #0f172a;
}

.accept-subtitle {
  margin: 0 0 1.4rem;
  font-size: 1rem;
  line-height: 1.8;
  color: #64748b;
}

.accept-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.info-row {
  padding: 1rem;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.info-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

.info-value {
  font-size: 0.98rem;
  font-weight: 800;
  color: #0f172a;
  word-break: break-word;
}

.accept-actions {
  margin-top: 1.4rem;
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.accept-btn,
.accept-btn-outline {
  height: 50px;
  padding-inline: 1.35rem;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
}

@media (max-width: 768px) {
  .accept-page {
    padding-left: 0.85rem !important;
    padding-right: 0.85rem !important;
  }

  .accept-info {
    grid-template-columns: 1fr;
  }

  .accept-actions {
    flex-direction: column;
  }

  .accept-btn,
  .accept-btn-outline {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .state-card,
  .accept-card {
    border-radius: 22px;
    padding: 1.1rem;
  }

  .accept-title {
    font-size: 1.7rem;
  }
}
</style>