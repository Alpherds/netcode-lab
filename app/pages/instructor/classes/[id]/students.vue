<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

interface StudentProfile {
  id: string
  full_name: string
  email: string | null
  role: 'STUDENT' | 'INSTRUCTOR'
}

interface EnrollmentRow {
  id: string
  class_id: string
  student_id: string
  invitation_id: string | null
  status: 'ACTIVE' | 'REMOVED'
  joined_at: string | null
  created_at: string
  updated_at: string
  student: StudentProfile | null
}

const supabase = useSupabase()
const route = useRoute()

const classId = computed(() => String(route.params.id || ''))

const loading = ref(false)
const removing = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const classItem = ref<ClassDetails | null>(null)
const students = ref<EnrollmentRow[]>([])

const removeDialog = ref(false)
const selectedEnrollment = ref<EnrollmentRow | null>(null)

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

function studentInitials(name?: string | null) {
  const safe = String(name || 'Student').trim()

  return safe
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function fetchClassDetails() {
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
}

async function fetchStudents() {
  const token = await getAccessToken()

  const response = await $fetch<{
    success: boolean
    students: EnrollmentRow[]
  }>(`/api/classes/${classId.value}/students`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  students.value = response.students || []
}

async function loadPage() {
  loading.value = true
  clearMessages()

  try {
    await Promise.all([fetchClassDetails(), fetchStudents()])
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load enrolled students.'
  } finally {
    loading.value = false
  }
}

function goBack() {
  navigateTo(`/instructor/classes/${classId.value}`)
}

function openRemoveDialog(item: EnrollmentRow) {
  selectedEnrollment.value = item
  removeDialog.value = true
}

function closeRemoveDialog() {
  selectedEnrollment.value = null
  removeDialog.value = false
}

async function removeStudent() {
  if (!selectedEnrollment.value) return

  removing.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    await $fetch(`/api/classes/${classId.value}/students/${selectedEnrollment.value.student_id}/remove`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    successMessage.value = 'Student removed successfully. Related class enrollment and invitation records were also removed.'
    closeRemoveDialog()
    await Promise.all([fetchClassDetails(), fetchStudents()])
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to remove student.'
  } finally {
    removing.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <v-container fluid class="students-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
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
      <div class="loading-text">Loading enrolled students...</div>
    </section>

    <template v-else-if="classItem">
      <section class="hero-card">
        <div class="hero-glow hero-glow-1" />
        <div class="hero-glow hero-glow-2" />

        <v-row class="ma-0" align="center">
          <v-col cols="12" lg="8">
            <div class="hero-chip mb-4">
              Enrolled Students • NetCode Virtual Laboratory
            </div>

            <h1 class="hero-title">
              {{ classItem.class_name }}
            </h1>

            <p class="hero-subtitle">
              View active class membership and manage enrolled students inside this class.
            </p>

            <div class="hero-meta-wrap">
              <div class="hero-code">
                {{ classItem.class_code }}
              </div>
            </div>

            <div class="hero-actions">
              <v-btn color="primary" size="large" class="hero-btn" @click="goBack">
                Back to Class Details
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" lg="4">
            <div class="hero-side-card">
              <div class="hero-side-label">Active Students</div>
              <div class="hero-side-value">{{ classItem.active_students_count }}</div>
              <div class="hero-side-text">
                Students currently enrolled and active in this class.
              </div>
            </div>
          </v-col>
        </v-row>
      </section>

      <section class="section-space">
        <div class="section-title mb-2">Student List</div>
        <div class="section-subtitle mb-5">
          Students with active enrollment in this class
        </div>

        <div v-if="!students.length" class="empty-state">
          <div class="empty-icon">
            <v-icon size="34">mdi-account-group-outline</v-icon>
          </div>

          <div class="empty-title">No enrolled students yet</div>
          <div class="empty-text">
            Invite students from the class details page to start building your class membership.
          </div>

          <v-btn color="primary" class="mt-4" @click="goBack">
            Go Back
          </v-btn>
        </div>

        <v-row v-else>
          <v-col
            v-for="item in students"
            :key="item.id"
            cols="12"
            md="6"
            xl="4"
          >
            <v-card class="student-card" rounded="xl" elevation="0">
              <div class="student-top">
                <div class="student-avatar">
                  {{ studentInitials(item.student?.full_name) }}
                </div>

                <v-chip
                  size="small"
                  color="success"
                  variant="tonal"
                >
                  {{ item.status }}
                </v-chip>
              </div>

              <div class="student-name">
                {{ item.student?.full_name || 'Student' }}
              </div>

              <div class="student-email">
                {{ item.student?.email || 'No email available' }}
              </div>

              <div class="student-meta">
                Joined {{ formatDate(item.joined_at || item.created_at) }}
              </div>

              <div class="student-actions">
                <v-btn
                  variant="text"
                  color="error"
                  class="px-0"
                  @click="openRemoveDialog(item)"
                >
                  Remove
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>
    </template>

    <v-dialog v-model="removeDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="dialog-title">
          Remove Student
        </v-card-title>

        <v-card-text class="pt-2">
          Are you sure you want to remove
          <strong>{{ selectedEnrollment?.student?.full_name || 'this student' }}</strong>
          from this class?
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeRemoveDialog">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="removing"
            @click="removeStudent"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.students-page {
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

.student-card,
.loading-wrap,
.empty-state {
  height: 100%;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.student-card {
  padding: 1.25rem;
}

.student-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.student-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
  color: #1d4ed8;
  font-weight: 900;
  letter-spacing: 0.03em;
}

.student-name {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.student-email {
  font-size: 0.94rem;
  color: #64748b;
  line-height: 1.7;
  margin-bottom: 0.8rem;
  word-break: break-word;
}

.student-meta {
  font-size: 0.82rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.student-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  .students-page {
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

  .hero-btn {
    width: 100%;
  }

  .section-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .hero-card,
  .student-card,
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