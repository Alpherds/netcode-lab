<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['INSTRUCTOR']
})

type SessionStatus = 'CREATED' | 'ACTIVE' | 'LOCKED' | 'ENDED'

interface SessionDetails {
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
  class: {
    id: string
    class_name: string
    class_code: string
    description: string | null
  } | null
}

interface SessionParticipant {
  id: string
  session_id: string
  user_id: string
  joined_at: string | null
  left_at: string | null
  user: {
    id: string
    full_name: string
    email: string | null
    role: 'STUDENT' | 'INSTRUCTOR'
  } | null
}

const supabase = useSupabase()
const route = useRoute()

const classId = computed(() => String(route.params.id || ''))
const sessionId = computed(() => String(route.params.sessionId || ''))

const loading = ref(false)
const actionLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const session = ref<SessionDetails | null>(null)
const participants = ref<SessionParticipant[]>([])

let realtimeChannel: any = null

const activeParticipants = computed(() =>
  participants.value.filter((item) => !item.left_at)
)

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Unable to get access token')
  }

  return data.session.access_token
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
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

function userInitials(name?: string | null) {
  return String(name || 'User')
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function statusColor(status: SessionStatus) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'CREATED') return 'primary'
  if (status === 'LOCKED') return 'warning'
  if (status === 'ENDED') return 'grey'
  return 'grey'
}

async function fetchSession() {
  const token = await getAccessToken()

  const response = await $fetch<{
    success: boolean
    sessions: SessionDetails[]
  }>(`/api/classes/${classId.value}/sessions/list`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const found = (response.sessions || []).find((item: any) => item.id === sessionId.value)

  if (!found) {
    throw new Error('Session not found')
  }

  session.value = found
}

async function fetchParticipants() {
  const token = await getAccessToken()

  const response = await $fetch<{
    success: boolean
    participants: SessionParticipant[]
  }>(`/api/classes/${classId.value}/sessions/${sessionId.value}/participants`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  participants.value = response.participants || []
}

async function loadPage() {
  loading.value = true
  clearMessages()

  try {
    await Promise.all([fetchSession(), fetchParticipants()])
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load session room.'
  } finally {
    loading.value = false
  }
}

async function startSession() {
  if (!session.value) return

  actionLoading.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    await $fetch(`/api/classes/${classId.value}/sessions/${session.value.id}/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    successMessage.value = 'Session started successfully.'
    await fetchSession()
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to start session.'
  } finally {
    actionLoading.value = false
  }
}

async function endSession() {
  if (!session.value) return

  actionLoading.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    await $fetch(`/api/classes/${classId.value}/sessions/${session.value.id}/end`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    successMessage.value = 'Session ended successfully.'
    await fetchSession()
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to end session.'
  } finally {
    actionLoading.value = false
  }
}

function subscribeRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  realtimeChannel = supabase
    .channel(`session-room-${sessionId.value}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_participants',
        filter: `session_id=eq.${sessionId.value}`
      },
      async () => {
        await fetchParticipants()
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId.value}`
      },
      async () => {
        await fetchSession()
      }
    )
    .subscribe()
}

function goBack() {
  navigateTo(`/instructor/classes/${classId.value}/sessions`)
}

onMounted(async () => {
  await loadPage()
  subscribeRealtime()
})

onBeforeUnmount(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
})
</script>

<template>
  <v-container fluid class="room-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
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
      <div class="loading-text">Loading instructor session room...</div>
    </section>

    <template v-else-if="session">
      <section class="hero-card">
        <v-row class="ma-0" align="center">
          <v-col cols="12" lg="8">
            <div class="hero-chip mb-4">
              Instructor Session Room • NetCode Virtual Laboratory
            </div>

            <h1 class="hero-title">
              {{ session.title }}
            </h1>

            <p class="hero-subtitle">
              Monitor session status and participant presence in real time.
            </p>

            <div class="hero-meta-wrap">
              <v-chip size="small" :color="statusColor(session.status)" variant="tonal">
                {{ session.status }}
              </v-chip>

              <div class="hero-code">
                {{ session.session_code }}
              </div>
            </div>

            <div class="hero-actions">
              <v-btn
                v-if="session.status === 'CREATED'"
                color="primary"
                size="large"
                class="hero-btn"
                :loading="actionLoading"
                @click="startSession"
              >
                Start Session
              </v-btn>

              <v-btn
                v-if="session.status === 'ACTIVE'"
                color="error"
                size="large"
                class="hero-btn"
                :loading="actionLoading"
                @click="endSession"
              >
                End Session
              </v-btn>

              <v-btn variant="outlined" size="large" class="hero-btn-outline" @click="goBack">
                Back to Sessions
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" lg="4">
            <div class="hero-side-card">
              <div class="hero-side-label">Active Participants</div>
              <div class="hero-side-value">{{ activeParticipants.length }}</div>
              <div class="hero-side-text">
                Students currently inside this live session.
              </div>
            </div>
          </v-col>
        </v-row>
      </section>

      <section class="section-space">
        <v-card class="panel-card" rounded="xl" elevation="0">
          <div class="panel-title">Participant Presence</div>
          <div class="panel-subtitle mb-4">
            Live participant updates from this session
          </div>

          <div v-if="!participants.length" class="empty-state small-empty">
            <div class="empty-icon">
              <v-icon size="30">mdi-account-group-outline</v-icon>
            </div>
            <div class="empty-title">No participants yet</div>
            <div class="empty-text">
              Students will appear here once they join the session.
            </div>
          </div>

          <div v-else class="participant-list">
            <div
              v-for="item in participants"
              :key="item.id"
              class="participant-item"
            >
              <div class="participant-left">
                <div class="participant-avatar">
                  {{ userInitials(item.user?.full_name) }}
                </div>

                <div>
                  <div class="participant-name">
                    {{ item.user?.full_name || 'User' }}
                  </div>
                  <div class="participant-meta">
                    Joined {{ formatDateTime(item.joined_at) }}
                  </div>
                  <div class="participant-meta" v-if="item.left_at">
                    Left {{ formatDateTime(item.left_at) }}
                  </div>
                </div>
              </div>

              <v-chip
                size="small"
                :color="item.left_at ? 'grey' : 'success'"
                variant="tonal"
              >
                {{ item.left_at ? 'LEFT' : 'ACTIVE' }}
              </v-chip>
            </div>
          </div>
        </v-card>
      </section>
    </template>
  </v-container>
</template>

<style scoped>
.room-page {
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
  border-radius: 30px;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(13, 17, 29, 0.96) 0%, rgba(18, 23, 37, 0.98) 100%);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
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

.hero-side-card,
.panel-card,
.loading-wrap,
.empty-state {
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.hero-side-card {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: white;
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

.panel-card {
  padding: 1.25rem;
}

.panel-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.panel-subtitle,
.participant-meta,
.empty-text,
.loading-text {
  font-size: 0.94rem;
  line-height: 1.7;
  color: #64748b;
}

.participant-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.participant-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 18px;
  padding: 1rem;
  background: #fbfdff;
}

.participant-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.participant-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
  color: #1d4ed8;
  font-weight: 900;
}

.participant-name {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.loading-wrap,
.empty-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state.small-empty {
  text-align: center;
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

@media (max-width: 768px) {
  .room-page {
    padding-left: 0.85rem !important;
    padding-right: 0.85rem !important;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-btn,
  .hero-btn-outline {
    width: 100%;
  }

  .participant-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>