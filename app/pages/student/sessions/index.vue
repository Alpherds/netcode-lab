<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['STUDENT']
})

type SessionStatus = 'CREATED' | 'ACTIVE' | 'LOCKED' | 'ENDED'

interface SessionClassInfo {
  id: string
  class_name: string
  class_code: string
}

interface SessionInstructorInfo {
  id: string
  full_name: string
  email: string | null
}

interface StudentSessionRow {
  id: string
  class_id: string
  instructor_id: string
  title: string
  description: string | null
  session_code: string
  scheduled_at: string | null
  status: SessionStatus
  created_at: string
  started_at: string | null
  ended_at: string | null
  updated_at: string
  class: SessionClassInfo | null
  instructor: SessionInstructorInfo | null
}

const supabase = useSupabase()

const loading = ref(false)
const joiningId = ref<string | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const search = ref('')

const sessions = ref<StudentSessionRow[]>([])

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

function statusColor(status: SessionStatus) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'CREATED') return 'primary'
  if (status === 'LOCKED') return 'warning'
  if (status === 'ENDED') return 'grey'
  return 'grey'
}

const filteredSessions = computed(() => {
  const term = search.value.trim().toLowerCase()

  return sessions.value.filter((item) => {
    const title = item.title?.toLowerCase() || ''
    const description = item.description?.toLowerCase() || ''
    const className = item.class?.class_name?.toLowerCase() || ''
    const classCode = item.class?.class_code?.toLowerCase() || ''
    const instructor = item.instructor?.full_name?.toLowerCase() || ''

    return (
      !term ||
      title.includes(term) ||
      description.includes(term) ||
      className.includes(term) ||
      classCode.includes(term) ||
      instructor.includes(term)
    )
  })
})

async function fetchSessions() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      sessions: StudentSessionRow[]
    }>('/api/student/sessions/list', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    sessions.value = response.sessions || []
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load sessions.'
  } finally {
    loading.value = false
  }
}

async function joinSession(item: StudentSessionRow) {
  joiningId.value = item.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = await getAccessToken()

    await $fetch(`/api/student/sessions/${item.id}/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    successMessage.value = 'Session joined successfully.'
    await navigateTo(`/student/sessions/${item.id}`)
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to join session.'
  } finally {
    joiningId.value = null
  }
}

function openSession(item: StudentSessionRow) {
  navigateTo(`/student/sessions/${item.id}`)
}

function goBack() {
  navigateTo('/student/dashboard')
}

onMounted(fetchSessions)
</script>

<template>
  <v-container fluid class="sessions-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
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

    <section class="hero-card">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />

      <v-row class="ma-0" align="center">
        <v-col cols="12" lg="8">
          <div class="hero-chip mb-4">
            Student Sessions • NetCode Virtual Laboratory
          </div>

          <h1 class="hero-title">
            My <span>Sessions</span>
          </h1>

          <p class="hero-subtitle">
            View the live sessions available from the classes you joined and enter active classroom sessions.
          </p>

          <div class="hero-actions">
            <v-btn color="primary" size="large" class="hero-btn" @click="fetchSessions">
              Refresh Sessions
            </v-btn>

            <v-btn variant="outlined" size="large" class="hero-btn-outline" @click="goBack">
              Back to Dashboard
            </v-btn>
          </div>
        </v-col>

        <v-col cols="12" lg="4">
          <div class="hero-side-card">
            <div class="hero-side-label">Available Sessions</div>
            <div class="hero-side-value">{{ sessions.length }}</div>
            <div class="hero-side-text">
              Sessions visible from your enrolled classes.
            </div>
          </div>
        </v-col>
      </v-row>
    </section>

    <section class="section-space">
      <v-card class="toolbar-card" rounded="xl" elevation="0">
        <div class="section-title mb-2">Session List</div>
        <div class="section-subtitle mb-4">
          Search and open sessions related to your enrolled classes
        </div>

        <v-text-field
          v-model="search"
          label="Search sessions, class, or instructor"
          variant="outlined"
          density="comfortable"
          hide-details
          prepend-inner-icon="mdi-magnify"
        />
      </v-card>
    </section>

    <section class="section-space">
      <div v-if="loading" class="loading-wrap">
        <v-progress-circular indeterminate color="primary" size="42" />
        <div class="loading-text">Loading sessions...</div>
      </div>

      <template v-else>
        <div v-if="!filteredSessions.length" class="empty-state">
          <div class="empty-icon">
            <v-icon size="34">mdi-video-wireless-outline</v-icon>
          </div>

          <div class="empty-title">No sessions available yet</div>
          <div class="empty-text">
            Sessions from your enrolled classes will appear here once your instructor creates them.
          </div>

          <v-btn color="primary" class="mt-4" @click="goBack">
            Back to Dashboard
          </v-btn>
        </div>

        <v-row v-else>
          <v-col
            v-for="item in filteredSessions"
            :key="item.id"
            cols="12"
            md="6"
            xl="4"
          >
            <v-card class="session-card" rounded="xl" elevation="0">
              <div class="session-top">
                <v-chip
                  size="small"
                  :color="statusColor(item.status)"
                  variant="tonal"
                >
                  {{ item.status }}
                </v-chip>

                <div class="session-code">
                  {{ item.session_code }}
                </div>
              </div>

              <div class="session-title">
                {{ item.title }}
              </div>

              <div class="session-description">
                {{ item.description || 'No session description provided.' }}
              </div>

              <div class="session-meta">
                Class: {{ item.class?.class_name || 'Class' }}
              </div>

              <div class="session-meta">
                Instructor: {{ item.instructor?.full_name || 'Instructor' }}
              </div>

              <div class="session-meta">
                Scheduled: {{ formatDateTime(item.scheduled_at) }}
              </div>

              <div class="session-actions">
                <v-btn
                  variant="text"
                  color="primary"
                  class="px-0"
                  @click="openSession(item)"
                >
                  Open
                </v-btn>

                <v-btn
                  v-if="item.status === 'ACTIVE'"
                  variant="text"
                  color="success"
                  class="px-0"
                  :loading="joiningId === item.id"
                  @click="joinSession(item)"
                >
                  Join
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </section>
  </v-container>
</template>

<style scoped>
.sessions-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(47, 200, 255, 0.05), transparent 24%),
    radial-gradient(circle at bottom right, rgba(255, 60, 95, 0.04), transparent 18%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.section-space {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.section-subtitle {
  font-size: 0.96rem;
  color: #64748b;
  line-height: 1.7;
}

.hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 30px;
  padding: 1.5rem;
  background:
    linear-gradient(135deg, rgba(13, 17, 29, 0.96) 0%, rgba(18, 23, 37, 0.98) 100%);
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-glow-1 {
  width: 240px;
  height: 240px;
  top: -60px;
  right: -30px;
  background: radial-gradient(circle, rgba(47, 200, 255, 0.15), transparent 70%);
}

.hero-glow-2 {
  width: 220px;
  height: 220px;
  bottom: -70px;
  left: -50px;
  background: radial-gradient(circle, rgba(255, 60, 95, 0.12), transparent 70%);
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
  letter-spacing: -0.03em;
  color: #ffffff;
}

.hero-title span {
  background: linear-gradient(90deg, #ff3c5f 0%, #2fc8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  max-width: 720px;
  margin: 0 0 1.4rem;
  font-size: 1rem;
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.72);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.hero-btn,
.hero-btn-outline {
  height: 50px;
  padding-inline: 1.35rem;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
}

.hero-btn-outline {
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

.hero-side-card {
  height: 100%;
  border-radius: 24px;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.hero-side-label {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.55rem;
}

.hero-side-value {
  font-size: 1.8rem;
  font-weight: 900;
  color: #ffffff;
  margin-bottom: 0.45rem;
}

.hero-side-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.72);
}

.toolbar-card,
.session-card,
.loading-wrap,
.empty-state {
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.toolbar-card,
.session-card {
  padding: 1.25rem;
}

.session-card {
  height: 100%;
}

.session-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.session-code {
  font-size: 0.84rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.session-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.45rem;
}

.session-description {
  font-size: 0.94rem;
  line-height: 1.75;
  color: #64748b;
  margin-bottom: 0.9rem;
}

.session-meta {
  font-size: 0.84rem;
  color: #94a3b8;
  margin-bottom: 0.4rem;
}

.session-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.loading-wrap,
.empty-state {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.loading-text {
  margin-top: 0.9rem;
  color: #64748b;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
  color: #1d4ed8;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.45rem;
}

.empty-text {
  max-width: 520px;
  font-size: 0.95rem;
  line-height: 1.75;
  color: #64748b;
}

@media (max-width: 959px) {
  .hero-card {
    padding: 1.15rem;
  }

  .hero-side-card {
    margin-top: 0.7rem;
  }

  .section-space {
    margin-top: 1.6rem;
  }
}

@media (max-width: 768px) {
  .sessions-page {
    padding-left: 0.85rem !important;
    padding-right: 0.85rem !important;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 0.96rem;
    line-height: 1.8;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-btn,
  .hero-btn-outline {
    width: 100%;
  }

  .section-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .hero-card,
  .toolbar-card,
  .session-card,
  .loading-wrap,
  .empty-state {
    border-radius: 20px;
  }

  .hero-card {
    padding: 1rem;
  }

  .hero-chip {
    width: 100%;
    justify-content: center;
    text-align: center;
    border-radius: 18px;
    line-height: 1.5;
  }

  .hero-title {
    font-size: 1.7rem;
  }
}
</style>