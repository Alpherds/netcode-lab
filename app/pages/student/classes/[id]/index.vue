<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['STUDENT']
})

type ClassStatus = 'ACTIVE' | 'ARCHIVED'
type SessionStatus = 'CREATED' | 'ACTIVE' | 'LOCKED' | 'ENDED'

interface InstructorInfo {
  id: string
  full_name: string
  email: string | null
}

interface StudentClassDetails {
  id: string
  instructor_id: string
  class_name: string
  class_code: string
  description: string | null
  status: ClassStatus
  created_at: string
  updated_at: string
  joined_at: string | null
  instructor: InstructorInfo | null
}

interface ClassSessionRow {
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
  instructor: InstructorInfo | null
}

const supabase = useSupabase()
const route = useRoute()

const classId = computed(() => String(route.params.id || ''))

const loading = ref(false)
const joiningId = ref<string | null>(null)

const errorMessage = ref('')
const successMessage = ref('')

const classItem = ref<StudentClassDetails | null>(null)
const sessions = ref<ClassSessionRow[]>([])

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Unable to get access token')
  }

  return data.session.access_token
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return value
  }
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

async function fetchClassDetails() {
  const token = await getAccessToken()

  const response = await $fetch<{
    success: boolean
    class: StudentClassDetails
  }>(`/api/student/classes/${classId.value}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  classItem.value = response.class
}

async function fetchSessions() {
  const token = await getAccessToken()

  const response = await $fetch<{
    success: boolean
    sessions: ClassSessionRow[]
  }>(`/api/student/classes/${classId.value}/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  sessions.value = response.sessions || []
}

async function loadPage() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await Promise.all([fetchClassDetails(), fetchSessions()])
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load class details.'
  } finally {
    loading.value = false
  }
}

async function joinSession(item: ClassSessionRow) {
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

function openSession(item: ClassSessionRow) {
  navigateTo(`/student/sessions/${item.id}`)
}

function goBack() {
  navigateTo('/student/classes')
}

onMounted(loadPage)
</script>

<template>
  <v-container fluid class="student-class-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
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

    <section v-if="loading" class="loading-wrap">
      <v-progress-circular indeterminate color="primary" size="42" />
      <div class="loading-text">Loading class details...</div>
    </section>

    <template v-else-if="classItem">
      <section class="hero-card">
        <div class="hero-glow hero-glow-1" />
        <div class="hero-glow hero-glow-2" />

        <v-row class="ma-0" align="center">
          <v-col cols="12" lg="8">
            <div class="hero-chip mb-4">
              Student Class Details • NetCode Virtual Laboratory
            </div>

            <h1 class="hero-title">
              {{ classItem.class_name }}
            </h1>

            <p class="hero-subtitle">
              View your joined class information and access the sessions created for this class.
            </p>

            <div class="hero-meta-wrap">
              <v-chip size="small" color="success" variant="tonal">
                {{ classItem.status }}
              </v-chip>

              <div class="hero-code">
                {{ classItem.class_code }}
              </div>
            </div>

            <div class="hero-actions">
              <v-btn color="primary" size="large" class="hero-btn" @click="goBack">
                Back to My Classes
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" lg="4">
            <div class="hero-side-card">
              <div class="hero-side-label">Instructor</div>
              <div class="hero-side-value">{{ classItem.instructor?.full_name || 'Instructor' }}</div>
              <div class="hero-side-text">
                Joined {{ formatDate(classItem.joined_at) }}
              </div>
            </div>
          </v-col>
        </v-row>
      </section>

      <section class="section-space">
        <v-row>
          <v-col cols="12" lg="5">
            <v-card class="detail-panel" rounded="xl" elevation="0">
              <div class="panel-title">Class Information</div>
              <div class="panel-subtitle mb-4">
                Your joined class details
              </div>

              <div class="info-list">
                <div class="info-row">
                  <div class="info-label">Class Name</div>
                  <div class="info-value">{{ classItem.class_name }}</div>
                </div>

                <div class="info-row">
                  <div class="info-label">Class Code</div>
                  <div class="info-value">{{ classItem.class_code }}</div>
                </div>

                <div class="info-row">
                  <div class="info-label">Instructor</div>
                  <div class="info-value">{{ classItem.instructor?.full_name || 'Instructor' }}</div>
                </div>

                <div class="info-row">
                  <div class="info-label">Joined</div>
                  <div class="info-value">{{ formatDate(classItem.joined_at) }}</div>
                </div>

                <div class="info-row info-row-description">
                  <div class="info-label">Description</div>
                  <div class="info-description">
                    {{ classItem.description || 'No class description provided yet.' }}
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" lg="7">
            <v-card class="sessions-panel" rounded="xl" elevation="0">
              <div class="panel-title">Class Sessions</div>
              <div class="panel-subtitle mb-4">
                Sessions available under this class
              </div>

              <div v-if="!sessions.length" class="empty-state small-empty">
                <div class="empty-icon">
                  <v-icon size="30">mdi-video-wireless-outline</v-icon>
                </div>
                <div class="empty-title">No sessions yet</div>
                <div class="empty-text">
                  Your instructor has not created a session for this class yet.
                </div>
              </div>

              <div v-else class="session-list">
                <div
                  v-for="item in sessions"
                  :key="item.id"
                  class="session-item"
                >
                  <div class="session-top">
                    <div>
                      <div class="session-title">{{ item.title }}</div>
                      <div class="session-meta">
                        Code: {{ item.session_code }}
                      </div>
                      <div class="session-meta">
                        Scheduled: {{ formatDateTime(item.scheduled_at) }}
                      </div>
                    </div>

                    <v-chip
                      size="small"
                      :color="statusColor(item.status)"
                      variant="tonal"
                    >
                      {{ item.status }}
                    </v-chip>
                  </div>

                  <div class="session-description">
                    {{ item.description || 'No session description provided.' }}
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
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>
    </template>
  </v-container>
</template>

<style scoped>
.student-class-page {
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
  color: #ffffff;
}

.hero-subtitle {
  max-width: 720px;
  margin: 0 0 1.4rem;
  font-size: 1rem;
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.72);
}

.hero-meta-wrap {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}

.hero-code {
  font-size: 0.86rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.78);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.hero-btn {
  height: 50px;
  padding-inline: 1.35rem;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
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
  font-size: 1.3rem;
  font-weight: 900;
  color: #ffffff;
  margin-bottom: 0.45rem;
}

.hero-side-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.72);
}

.detail-panel,
.sessions-panel,
.loading-wrap,
.empty-state {
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.detail-panel,
.sessions-panel {
  padding: 1.25rem;
}

.panel-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.panel-subtitle {
  font-size: 0.96rem;
  color: #64748b;
  line-height: 1.7;
}

.info-list,
.session-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.info-description,
.session-description,
.session-meta {
  font-size: 0.94rem;
  line-height: 1.7;
  color: #64748b;
}

.session-item {
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 18px;
  padding: 1rem;
  background: #fbfdff;
}

.session-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.session-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.session-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.9rem;
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

.empty-state.small-empty {
  min-height: 180px;
}

.loading-text {
  margin-top: 0.9rem;
  color: #64748b;
}

.empty-icon {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
  color: #1d4ed8;
  margin-bottom: 0.9rem;
}

.empty-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.empty-text {
  max-width: 420px;
  font-size: 0.94rem;
  line-height: 1.7;
  color: #64748b;
}

@media (max-width: 768px) {
  .student-class-page {
    padding-left: 0.85rem !important;
    padding-right: 0.85rem !important;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .hero-card,
  .detail-panel,
  .sessions-panel,
  .loading-wrap,
  .empty-state {
    border-radius: 20px;
  }

  .hero-card {
    padding: 1rem;
  }

  .session-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>