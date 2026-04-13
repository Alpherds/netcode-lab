<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['INSTRUCTOR']
})

type ClassStatus = 'ACTIVE' | 'ARCHIVED'
type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'

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

interface ClassInvitation {
  id: string
  class_id: string
  email: string
  student_user_id: string | null
  status: InvitationStatus
  expires_at: string
  created_at: string
  accepted_at: string | null
}

const auth = useAuthStore()
const supabase = useSupabase()
const route = useRoute()

const loading = ref(false)
const inviteSaving = ref(false)
const invitationLoading = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const latestInvitationLink = ref('')

const classItem = ref<ClassDetails | null>(null)
const invitations = ref<ClassInvitation[]>([])

const inviteDialog = ref(false)
const invitationEmail = ref('')

const classId = computed(() => String(route.params.id || ''))

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

function statusColor(status: ClassStatus | InvitationStatus) {
  if (status === 'ACTIVE' || status === 'ACCEPTED') return 'success'
  if (status === 'PENDING') return 'warning'
  if (status === 'EXPIRED') return 'grey'
  if (status === 'CANCELLED' || status === 'ARCHIVED') return 'error'
  return 'grey'
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    successMessage.value = 'Invitation link copied to clipboard.'
  } catch {
    successMessage.value = `Invitation link generated: ${text}`
  }
}

async function fetchClassDetails() {
  if (!classId.value) return

  loading.value = true
  clearMessages()

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

async function fetchInvitations() {
  if (!classId.value) return

  invitationLoading.value = true

  try {
    const token = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      invitations: ClassInvitation[]
    }>(`/api/classes/${classId.value}/invitations`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    invitations.value = response.invitations || []
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load invitations.'
  } finally {
    invitationLoading.value = false
  }
}

function openInviteDialog() {
  clearMessages()
  invitationEmail.value = ''
  latestInvitationLink.value = ''
  inviteDialog.value = true
}

function closeInviteDialog() {
  inviteDialog.value = false
  invitationEmail.value = ''
}

async function inviteStudent() {
  if (!invitationEmail.value.trim()) return

  inviteSaving.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      invitation: ClassInvitation
      invitation_url: string
    }>(`/api/classes/${classId.value}/invite-student`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: {
        email: invitationEmail.value
      }
    })

    latestInvitationLink.value = response.invitation_url
    successMessage.value = 'Invitation created successfully.'
    closeInviteDialog()

    await Promise.all([fetchClassDetails(), fetchInvitations()])
    await copyToClipboard(response.invitation_url)
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to create invitation.'
  } finally {
    inviteSaving.value = false
  }
}

async function resendInvitation(item: ClassInvitation) {
  clearMessages()

  try {
    const token = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      invitation_url: string
    }>(`/api/invitations/${item.id}/resend`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    latestInvitationLink.value = response.invitation_url
    successMessage.value = 'Invitation link regenerated successfully.'

    await fetchInvitations()
    await copyToClipboard(response.invitation_url)
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to resend invitation.'
  }
}

async function cancelInvitation(item: ClassInvitation) {
  clearMessages()

  try {
    const token = await getAccessToken()

    await $fetch(`/api/invitations/${item.id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    successMessage.value = 'Invitation cancelled successfully.'
    await Promise.all([fetchClassDetails(), fetchInvitations()])
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to cancel invitation.'
  }
}

function goBack() {
  navigateTo('/instructor/classes')
}

function goToStudentsModule() {
  navigateTo(`/instructor/classes/${classId.value}/students`)
}

function goToSessionsModule() {
  successMessage.value = 'Session module is the next step to build for this class.'
}

onMounted(async () => {
  await Promise.all([fetchClassDetails(), fetchInvitations()])
})
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
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
    >
      {{ successMessage }}
    </v-alert>

    <v-alert
      v-if="latestInvitationLink"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Latest invitation link:
      <div class="mt-2 invitation-link-wrap">
        <code class="invitation-link-code">{{ latestInvitationLink }}</code>
      </div>
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
              Instructor Class Details • NetCode Virtual Laboratory
            </div>

            <h1 class="hero-title">
              {{ classItem.class_name }}
            </h1>

            <p class="hero-subtitle">
              Manage student invitations and prepare class-based online sessions inside this class workspace.
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
              <div class="hero-side-label">Class Summary</div>
              <div class="hero-side-value">{{ classItem.active_students_count }}</div>
              <div class="hero-side-text">
                Active students currently enrolled in this class.
              </div>

              <div class="hero-side-divider" />

              <div class="hero-side-grid">
                <div>
                  <div class="hero-side-mini-label">Pending Invites</div>
                  <div class="hero-side-mini-value">{{ classItem.pending_invitations_count }}</div>
                </div>

                <div>
                  <div class="hero-side-mini-label">Sessions</div>
                  <div class="hero-side-mini-value">{{ classItem.sessions_count }}</div>
                </div>
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
                  <div class="info-label">Created</div>
                  <div class="info-value">{{ formatDate(classItem.created_at) }}</div>
                </div>

                <div class="info-row info-row-description">
                  <div class="info-label">Description</div>
                  <div class="info-description">
                    {{ classItem.description || 'No class description provided yet.' }}
                  </div>
                </div>
              </div>

              <v-btn
                block
                color="primary"
                class="mt-5 manage-students-btn"
                @click="goToStudentsModule"
              >
                <v-icon start size="18">mdi-account-group-outline</v-icon>
                View Students
              </v-btn>
            </v-card>
          </v-col>

          <v-col cols="12" lg="7">
            <v-card class="invitation-panel" rounded="xl" elevation="0">
              <div class="panel-head">
                <div>
                  <div class="panel-title">Student Invitations</div>
                  <div class="panel-subtitle">
                    Invite only registered student accounts by email.
                  </div>
                </div>

                <v-btn color="primary" class="panel-btn" @click="openInviteDialog">
                  <v-icon start size="18">mdi-account-plus</v-icon>
                  Invite
                </v-btn>
              </div>

              <v-alert
                type="warning"
                variant="tonal"
                class="mb-4"
              >
                This module currently generates secure invitation links for manual sharing.
                Automatic email sending can be added later.
              </v-alert>

              <div v-if="invitationLoading" class="mini-loading">
                <v-progress-circular indeterminate color="primary" size="28" />
                <div class="loading-text">Loading invitations...</div>
              </div>

              <div v-else-if="!invitations.length" class="empty-state small-empty">
                <div class="empty-icon">
                  <v-icon size="30">mdi-email-outline</v-icon>
                </div>
                <div class="empty-title">No invitations yet</div>
                <div class="empty-text">
                  Invite a registered student email to enroll them into this class.
                </div>
              </div>

              <div v-else class="invitation-list">
                <div
                  v-for="item in invitations"
                  :key="item.id"
                  class="invitation-item"
                >
                  <div class="invitation-top">
                    <div>
                      <div class="invitation-email">{{ item.email }}</div>
                      <div class="invitation-meta">
                        Expires {{ formatDateTime(item.expires_at) }}
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

                  <div class="invitation-actions">
                    <v-btn
                      v-if="item.status !== 'ACCEPTED'"
                      variant="text"
                      color="primary"
                      class="px-0"
                      @click="resendInvitation(item)"
                    >
                      Regenerate Link
                    </v-btn>

                    <v-btn
                      v-if="item.status !== 'ACCEPTED' && item.status !== 'CANCELLED'"
                      variant="text"
                      color="error"
                      class="px-0"
                      @click="cancelInvitation(item)"
                    >
                      Cancel
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>
    </template>

    <v-dialog v-model="inviteDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="dialog-title">
          Invite Student
        </v-card-title>

        <v-card-text class="pt-2">
          <v-text-field
            v-model="invitationEmail"
            label="Registered Student Email"
            type="email"
            variant="outlined"
          />
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeInviteDialog">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="inviteSaving"
            :disabled="!invitationEmail.trim()"
            @click="inviteStudent"
          >
            Create Invitation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

.section-subtitle,
.panel-subtitle {
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

.hero-side-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 1rem 0;
}

.hero-side-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.hero-side-mini-label {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 0.35rem;
}

.hero-side-mini-value {
  font-size: 1rem;
  font-weight: 800;
  color: white;
}

.detail-panel,
.invitation-panel,
.loading-wrap {
  height: 100%;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.detail-panel,
.invitation-panel {
  padding: 1.25rem;
}

.panel-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-btn {
  height: 44px;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
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

.manage-students-btn {
  height: 46px;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
}

.invitation-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.invitation-item {
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 18px;
  padding: 1rem;
  background: #fbfdff;
}

.invitation-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.invitation-email {
  font-size: 0.98rem;
  font-weight: 800;
  color: #0f172a;
  word-break: break-word;
}

.invitation-meta {
  font-size: 0.84rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.invitation-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.invitation-link-wrap {
  overflow-x: auto;
}

.invitation-link-code {
  display: block;
  white-space: nowrap;
  font-size: 0.82rem;
  color: #0f172a;
}

.loading-wrap,
.mini-loading,
.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.mini-loading {
  min-height: 140px;
}

.loading-text {
  margin-top: 0.9rem;
  color: #64748b;
}

.empty-state.small-empty {
  min-height: 180px;
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

.empty-text {
  max-width: 420px;
  font-size: 0.94rem;
  line-height: 1.7;
  color: #64748b;
}

.dialog-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  padding-top: 1.15rem;
}

.dialog-actions {
  padding-inline: 1rem 1.2rem;
  padding-bottom: 1rem;
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
  .hero-btn-text,
  .panel-btn,
  .manage-students-btn {
    width: 100%;
  }

  .panel-head {
    flex-direction: column;
    align-items: stretch;
  }

  .section-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .hero-card,
  .detail-panel,
  .invitation-panel,
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

  .invitation-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>