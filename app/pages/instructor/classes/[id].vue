<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['INSTRUCTOR']
})

type ClassStatus = 'ACTIVE' | 'ARCHIVED'

interface ClassDetails {
  id: string
  instructor_id: string
  class_name: string
  class_code: string
  description: string | null
  status: ClassStatus
  created_at: string
  updated_at: string
  active_students_count: number
  pending_invitations_count: number
  sessions_count: number
}

const auth = useAuthStore()
const supabase = useSupabase()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const classItem = ref<ClassDetails | null>(null)

const classId = computed(() => String(route.params.id || ''))

const pageTitle = computed(() => {
  return classItem.value?.class_name || 'Class Details'
})

const pageSubtitle = computed(() => {
  if (!classItem.value) return 'Loading class information...'
  return `${classItem.value.class_code} • ${classItem.value.status}`
})

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Unable to get access token')
  }

  return data.session.access_token
}

async function fetchClassDetails() {
  if (!classId.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const token = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      class: ClassDetails
    }>(`/api/classes/${classId.value}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    classItem.value = response.class
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load class details.'
  } finally {
    loading.value = false
  }
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

function statusColor(status?: ClassStatus) {
  return status === 'ACTIVE' ? 'success' : 'grey'
}

function goBack() {
  navigateTo('/instructor/classes')
}

function goToStudentsModule() {
  infoMessage.value = 'Student enrollment module is the next step to build.'
}

function goToInvitationsModule() {
  infoMessage.value = 'Student invitation module is the next step to build.'
}

function goToSessionsModule() {
  infoMessage.value = 'Class session module is the next step to build.'
}

onMounted(fetchClassDetails)
</script>

<template>
  <v-container fluid class="class-details-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-alert
      v-if="infoMessage"
      type="info"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="infoMessage = ''"
    >
      {{ infoMessage }}
    </v-alert>

    <section v-if="loading" class="loading-wrap">
      <v-progress-circular indeterminate color="primary" size="42" />
      <div class="loading-text">Loading class details...</div>
    </section>

    <template v-else-if="classItem">
      <!-- HERO -->
      <section class="hero-card">
        <div class="hero-glow hero-glow-1" />
        <div class="hero-glow hero-glow-2" />

        <v-row class="ma-0" align="center">
          <v-col cols="12" lg="8">
            <div class="hero-chip mb-4">
              Instructor Class Details • NetCode Virtual Laboratory
            </div>

            <h1 class="hero-title">
              {{ pageTitle }}
            </h1>

            <p class="hero-subtitle">
              Manage this class, review student enrollment status, and create dedicated
              online sessions under this class workspace.
            </p>

            <div class="hero-meta-wrap">
              <v-chip
                size="small"
                :color="statusColor(classItem.status)"
                variant="tonal"
              >
                {{ classItem.status }}
              </v-chip>

              <div class="hero-code">
                {{ classItem.class_code }}
              </div>
            </div>

            <div class="hero-actions">
              <v-btn color="primary" size="large" class="hero-btn" @click="goToInvitationsModule">
                Invite Students
              </v-btn>

              <v-btn variant="outlined" size="large" class="hero-btn-outline" @click="goToSessionsModule">
                Create Session
              </v-btn>

              <v-btn variant="text" size="large" class="hero-btn-text" @click="goBack">
                Back to Classes
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" lg="4">
            <div class="hero-side-card">
              <div class="hero-side-label">Created</div>
              <div class="hero-side-value">{{ formatDate(classItem.created_at) }}</div>
              <div class="hero-side-text">
                Last updated: {{ formatDate(classItem.updated_at) }}
              </div>
            </div>
          </v-col>
        </v-row>
      </section>

      <!-- SUMMARY -->
      <section class="section-space">
        <div class="section-title mb-2">Class Overview</div>
        <div class="section-subtitle mb-5">
          Summary of the current class structure and activity
        </div>

        <v-row>
          <v-col cols="12" md="4">
            <v-card class="summary-card" rounded="xl" elevation="0">
              <div class="summary-icon accent-blue">
                <v-icon size="24">mdi-account-group-outline</v-icon>
              </div>
              <div class="summary-value">{{ classItem.active_students_count }}</div>
              <div class="summary-title">Active Students</div>
              <div class="summary-text">Students currently enrolled in this class.</div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="summary-card" rounded="xl" elevation="0">
              <div class="summary-icon accent-green">
                <v-icon size="24">mdi-email-fast-outline</v-icon>
              </div>
              <div class="summary-value">{{ classItem.pending_invitations_count }}</div>
              <div class="summary-title">Pending Invitations</div>
              <div class="summary-text">Email invitations awaiting acceptance.</div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="summary-card" rounded="xl" elevation="0">
              <div class="summary-icon accent-pink">
                <v-icon size="24">mdi-video-wireless</v-icon>
              </div>
              <div class="summary-value">{{ classItem.sessions_count }}</div>
              <div class="summary-title">Sessions</div>
              <div class="summary-text">Class-specific sessions created under this class.</div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <!-- DESCRIPTION + MODULES -->
      <section class="section-space">
        <v-row>
          <v-col cols="12" lg="5">
            <v-card class="detail-panel" rounded="xl" elevation="0">
              <div class="panel-title">Class Information</div>
              <div class="panel-subtitle mb-4">
                Primary details for this instructor-owned class
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
                  <div class="info-label">Status</div>
                  <div class="info-value">{{ classItem.status }}</div>
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
            <div class="section-title mb-2">Class Modules</div>
            <div class="section-subtitle mb-5">
              These are the next management actions available for this class
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-card class="module-card" rounded="xl" elevation="0">
                  <div class="module-icon accent-blue">
                    <v-icon size="24">mdi-account-plus-outline</v-icon>
                  </div>
                  <div class="module-title">Student Invitations</div>
                  <div class="module-text">
                    Invite registered student emails and manage pending invitation acceptance.
                  </div>
                  <v-btn variant="text" color="primary" class="px-0 mt-2" @click="goToInvitationsModule">
                    Open
                  </v-btn>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="module-card" rounded="xl" elevation="0">
                  <div class="module-icon accent-green">
                    <v-icon size="24">mdi-account-group-outline</v-icon>
                  </div>
                  <div class="module-title">Enrolled Students</div>
                  <div class="module-text">
                    Review active class membership and student participation under this class.
                  </div>
                  <v-btn variant="text" color="primary" class="px-0 mt-2" @click="goToStudentsModule">
                    Open
                  </v-btn>
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-card class="module-card" rounded="xl" elevation="0">
                  <div class="module-icon accent-pink">
                    <v-icon size="24">mdi-video-wireless</v-icon>
                  </div>
                  <div class="module-title">Class Sessions</div>
                  <div class="module-text">
                    Create and manage online class sessions that belong only to this class.
                  </div>
                  <v-btn variant="text" color="primary" class="px-0 mt-2" @click="goToSessionsModule">
                    Open
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </section>
    </template>
  </v-container>
</template>

<style scoped>
.class-details-page {
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
.hero-btn-outline,
.hero-btn-text {
  height: 50px;
  padding-inline: 1.35rem;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
}

.hero-btn-outline,
.hero-btn-text {
  color: white;
}

.hero-btn-outline {
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

.summary-card,
.detail-panel,
.module-card,
.loading-wrap {
  height: 100%;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.summary-card,
.detail-panel,
.module-card {
  padding: 1.25rem;
}

.summary-icon,
.module-icon {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  margin-bottom: 1rem;
}

.summary-value {
  font-size: 2rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 0.55rem;
}

.summary-title,
.panel-title,
.module-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.summary-text,
.panel-subtitle,
.module-text {
  font-size: 0.94rem;
  line-height: 1.7;
  color: #64748b;
}

.info-list {
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

.info-description {
  font-size: 0.95rem;
  line-height: 1.75;
  color: #64748b;
}

.loading-wrap {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  margin-top: 0.9rem;
  color: #64748b;
}

.accent-blue {
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
  color: #1d4ed8;
}

.accent-green {
  background: linear-gradient(180deg, rgba(227, 248, 239, 0.95), rgba(213, 241, 227, 0.88));
  color: #059669;
}

.accent-pink {
  background: linear-gradient(180deg, rgba(255, 232, 239, 0.95), rgba(252, 216, 228, 0.88));
  color: #e11d48;
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
  .class-details-page {
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
  .hero-btn-outline,
  .hero-btn-text {
    width: 100%;
  }

  .section-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .hero-card,
  .summary-card,
  .detail-panel,
  .module-card,
  .loading-wrap {
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