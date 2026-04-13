<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['STUDENT']
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
  instructor: {
    id: string
    full_name: string
    email: string | null
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

const sessionId = computed(() => String(route.params.id || ''))

const loading = ref(false)
const joining = ref(false)
const leaving = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const session = ref<SessionDetails | null>(null)
const participants = ref<SessionParticipant[]>([])
const myUserId = ref<string | null>(null)

let realtimeChannel: any = null

const activeParticipants = computed(() =>
  participants.value.filter((item) => !item.left_at)
)

const amIInside = computed(() =>
  activeParticipants.value.some((item) => item.user_id === myUserId.value)
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

async function fetchMe() {
  const { data } = await supabase.auth.getUser()
  myUserId.value = data.user?.id || null
}

async function fetchSession() {
  const token = await getAccessToken()

  const response = await $fetch<{
    success: boolean
    session: SessionDetails
  }>(`/api/student/sessions/${sessionId.value}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  session.value = response.session
}

async function fetchParticipants() {
  const token = await getAccessToken()

  const response = await $fetch<{
    success: boolean
    participants: SessionParticipant[]
  }>(`/api/student/sessions/${sessionId.value}/participants`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  participants.value = response.participants || []
}

async function joinSession() {
  if (!session.value) return
  if (session.value.status !== 'ACTIVE') return
  if (amIInside.value) return

  joining.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    await $fetch(`/api/student/sessions/${sessionId.value}/join`, {
      method: 'POST' as any,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    await fetchParticipants()
    successMessage.value = 'You joined the session.'
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to join session.'
  } finally {
    joining.value = false
  }
}

async function ensureJoined() {
  if (!session.value) return
  if (session.value.status !== 'ACTIVE') return
  if (amIInside.value) return

  await joinSession()
}

async function leaveSession() {
  leaving.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    await $fetch(`/api/student/sessions/${sessionId.value}/leave`, {
      method: 'POST' as any,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    await fetchParticipants()
    successMessage.value = 'You left the session.'
    await navigateTo('/student/sessions')
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to leave session.'
  } finally {
    leaving.value = false
  }
}

function subscribeRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  realtimeChannel = supabase
    .channel(`student-session-room-${sessionId.value}`)
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
        event: '*',
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

async function loadPage() {
  loading.value = true
  clearMessages()

  try {
    await fetchMe()
    await fetchSession()
    await fetchParticipants()
    await ensureJoined()
    await fetchParticipants()
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
  <v-container fluid class="session-room-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
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
          Participate in the live class session and monitor realtime class presence.
        </p>

        <div class="hero-meta">
          <div><strong>Class:</strong> {{ session.class?.class_name || 'Class' }}</div>
          <div><strong>Instructor:</strong> {{ session.instructor?.full_name || 'Instructor' }}</div>
          <div><strong>Session Code:</strong> {{ session.session_code }}</div>
          <div><strong>Status:</strong> {{ session.status }}</div>
          <div><strong>Participants Inside:</strong> {{ activeParticipants.length }}</div>
        </div>

        <div class="hero-actions">
          <v-btn variant="outlined" size="large" class="hero-btn-outline" @click="goBack">
            Back to Sessions
          </v-btn>

          <v-btn
            v-if="session.status === 'ACTIVE' && !amIInside"
            color="primary"
            size="large"
            class="hero-btn"
            :loading="joining"
            @click="joinSession"
          >
            Join Session
          </v-btn>

          <v-btn
            v-if="amIInside"
            color="error"
            size="large"
            class="hero-btn"
            :loading="leaving"
            @click="leaveSession"
          >
            Leave Session
          </v-btn>
        </div>
      </section>

      <section class="section-space">
        <v-row>
          <v-col cols="12" md="8">
            <v-card class="module-card" rounded="xl" elevation="0">
              <div class="module-title">Live Session Workspace</div>
              <div class="module-text">
                This is the live room shell. Coding lab, simulations, and classroom tools connect here next.
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="module-card" rounded="xl" elevation="0">
              <div class="module-title">Realtime Presence</div>

              <div v-if="!participants.length" class="empty-small">
                No participants yet.
              </div>

              <div v-else class="presence-list">
                <div
                  v-for="item in participants"
                  :key="item.id"
                  class="presence-item"
                >
                  <div class="presence-left">
                    <div class="presence-avatar">
                      {{ userInitials(item.user?.full_name) }}
                    </div>

                    <div>
                      <div class="presence-name">
                        {{ item.user?.full_name || 'User' }}
                      </div>
                      <div class="presence-meta">
                        {{ item.left_at ? 'Left' : 'Inside' }}
                      </div>
                    </div>
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

.module-text,
.loading-text,
.presence-meta,
.empty-small {
  font-size: 0.94rem;
  line-height: 1.7;
  color: #64748b;
}

.presence-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.presence-item {
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 16px;
  padding: 0.8rem;
  background: #fbfdff;
}

.presence-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.presence-avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
  color: #1d4ed8;
  font-weight: 900;
}

.presence-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.loading-wrap {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .hero-meta {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-btn,
  .hero-btn-outline {
    width: 100%;
  }
}
</style>