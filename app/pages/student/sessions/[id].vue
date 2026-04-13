<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['STUDENT']
})

interface SessionDetails {
  id: string
  class_id: string
  instructor_id: string
  title: string
  description: string | null
  session_code: string
  scheduled_at: string | null
  status: 'CREATED' | 'ACTIVE' | 'LOCKED' | 'ENDED'
  created_at: string
  started_at: string | null
  ended_at: string | null
  updated_at: string
  class: {
    id: string
    class_name: string
    class_code: string
    description: string | null
  } | null
  instructor: {
    id: string
    full_name: string
    email: string | null
  } | null
}

const supabase = useSupabase()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')
const session = ref<SessionDetails | null>(null)

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

async function fetchSession() {
  loading.value = true
  errorMessage.value = ''

  try {
    const token = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      session: SessionDetails
    }>(`/api/student/sessions/${route.params.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    session.value = response.session
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load session room.'
  } finally {
    loading.value = false
  }
}

function goBack() {
  navigateTo('/student/sessions')
}

onMounted(fetchSession)
</script>

<template>
  <v-container fluid class="session-room-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <section v-if="loading" class="loading-wrap">
      <v-progress-circular indeterminate color="primary" size="42" />
      <div class="loading-text">Loading session room...</div>
    </section>

    <template v-else-if="session">
      <section class="hero-card">
        <div class="hero-chip mb-4">
          Student Session Room • NetCode Virtual Laboratory
        </div>

        <h1 class="hero-title">
          {{ session.title }}
        </h1>

        <p class="hero-subtitle">
          This is the student session room shell where coding, simulation, and live class tools will be attached next.
        </p>

        <div class="hero-meta">
          <div><strong>Class:</strong> {{ session.class?.class_name || 'Class' }}</div>
          <div><strong>Instructor:</strong> {{ session.instructor?.full_name || 'Instructor' }}</div>
          <div><strong>Session Code:</strong> {{ session.session_code }}</div>
          <div><strong>Status:</strong> {{ session.status }}</div>
          <div><strong>Scheduled:</strong> {{ formatDateTime(session.scheduled_at) }}</div>
        </div>

        <div class="hero-actions">
          <v-btn color="primary" size="large" class="hero-btn" @click="goBack">
            Back to Sessions
          </v-btn>
        </div>
      </section>

      <section class="section-space">
        <v-row>
          <v-col cols="12" md="4">
            <v-card class="module-card" rounded="xl" elevation="0">
              <div class="module-title">Live Class Area</div>
              <div class="module-text">
                Reserved for class video, attendance, announcements, and live interaction.
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="module-card" rounded="xl" elevation="0">
              <div class="module-title">Coding Lab</div>
              <div class="module-text">
                Reserved for live code editor, task execution, and result feedback.
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="module-card" rounded="xl" elevation="0">
              <div class="module-title">Simulation Area</div>
              <div class="module-text">
                Reserved for PC assembly and networking simulator activities.
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>
    </template>
  </v-container>
</template>

<style scoped>
.session-room-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(47, 200, 255, 0.05), transparent 24%),
    radial-gradient(circle at bottom right, rgba(255, 60, 95, 0.04), transparent 18%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.section-space {
  margin-top: 2rem;
}

.hero-card {
  border-radius: 28px;
  padding: 1.5rem;
  background:
    linear-gradient(135deg, rgba(13, 17, 29, 0.96) 0%, rgba(18, 23, 37, 0.98) 100%);
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #dbeafe;
  font-size: 0.88rem;
  font-weight: 700;
}

.hero-title {
  margin: 0 0 1rem;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.04;
  font-weight: 900;
  color: #ffffff;
}

.hero-subtitle {
  margin: 0 0 1.2rem;
  font-size: 1rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.72);
}

.hero-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 1.4rem;
}

.hero-actions {
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.hero-btn {
  height: 50px;
  padding-inline: 1.35rem;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
}

.module-card,
.loading-wrap {
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
  padding: 1.25rem;
}

.module-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.module-text {
  font-size: 0.94rem;
  line-height: 1.7;
  color: #64748b;
}

.loading-wrap {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  margin-top: 0.9rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .hero-meta {
    grid-template-columns: 1fr;
  }
}
</style>