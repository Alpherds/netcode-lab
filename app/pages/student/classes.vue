<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['STUDENT']
})

interface InstructorInfo {
  id: string
  full_name: string
  email: string | null
}

interface ClassInfo {
  id: string
  class_name: string
  class_code: string
  description: string | null
  status: 'ACTIVE' | 'ARCHIVED'
  created_at: string
  updated_at: string
  instructor_id: string
  instructor: InstructorInfo | null
}

interface StudentClassRow {
  id: string
  class_id: string
  student_id: string
  invitation_id: string | null
  status: 'ACTIVE'
  joined_at: string | null
  created_at: string
  updated_at: string
  class: ClassInfo | null
}

const supabase = useSupabase()

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const search = ref('')

const studentClasses = ref<StudentClassRow[]>([])

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

const filteredClasses = computed(() => {
  const term = search.value.trim().toLowerCase()

  return studentClasses.value.filter((item) => {
    const className = item.class?.class_name?.toLowerCase() || ''
    const classCode = item.class?.class_code?.toLowerCase() || ''
    const description = item.class?.description?.toLowerCase() || ''
    const instructorName = item.class?.instructor?.full_name?.toLowerCase() || ''

    return (
      !term ||
      className.includes(term) ||
      classCode.includes(term) ||
      description.includes(term) ||
      instructorName.includes(term)
    )
  })
})

async function fetchMyClasses() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const token = await getAccessToken()

    const response = await $fetch<{
      success: boolean
      classes: StudentClassRow[]
    }>('/api/student/classes/list', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    studentClasses.value = response.classes || []
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load your classes.'
  } finally {
    loading.value = false
  }
}

function goToDashboard() {
  navigateTo('/student/dashboard')
}

function goToClass(item: StudentClassRow) {
  successMessage.value = `Class details page is the next step to build for ${item.class?.class_name || 'this class'}.`
}

onMounted(fetchMyClasses)
</script>

<template>
  <v-container fluid class="my-classes-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
    <section class="hero-card">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />

      <v-row class="ma-0" align="center">
        <v-col cols="12" lg="8">
          <div class="hero-chip mb-4">
            Student Classes • NetCode Virtual Laboratory
          </div>

          <h1 class="hero-title">
            My <span>Classes</span>
          </h1>

          <p class="hero-subtitle">
            View the classes you joined through accepted invitations and access your class-based learning space.
          </p>

          <div class="hero-actions">
            <v-btn color="primary" size="large" class="hero-btn" @click="fetchMyClasses">
              Refresh Classes
            </v-btn>

            <v-btn variant="outlined" size="large" class="hero-btn-outline" @click="goToDashboard">
              Back to Dashboard
            </v-btn>
          </div>
        </v-col>

        <v-col cols="12" lg="4">
          <div class="hero-side-card">
            <div class="hero-side-label">Joined Classes</div>
            <div class="hero-side-value">{{ studentClasses.length }}</div>
            <div class="hero-side-text">
              Total active classes currently available in your student account.
            </div>
          </div>
        </v-col>
      </v-row>
    </section>

    <section class="section-space">
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

      <div class="toolbar-card">
        <div class="toolbar-head">
          <div>
            <div class="section-title">Enrolled Classes</div>
            <div class="section-subtitle">
              These are the classes where your student account is currently enrolled.
            </div>
          </div>
        </div>

        <v-row class="mt-2">
          <v-col cols="12">
            <v-text-field
              v-model="search"
              label="Search class, code, or instructor"
              variant="outlined"
              density="comfortable"
              hide-details
              prepend-inner-icon="mdi-magnify"
            />
          </v-col>
        </v-row>
      </div>
    </section>

    <section class="section-space">
      <div v-if="loading" class="loading-wrap">
        <v-progress-circular indeterminate color="primary" size="42" />
        <div class="loading-text">Loading your classes...</div>
      </div>

      <template v-else>
        <div v-if="!filteredClasses.length" class="empty-state">
          <div class="empty-icon">
            <v-icon size="34">mdi-google-classroom</v-icon>
          </div>

          <div class="empty-title">No joined classes yet</div>
          <div class="empty-text">
            Once you accept a class invitation from your instructor, your joined classes will appear here.
          </div>

          <v-btn color="primary" class="mt-4" @click="goToDashboard">
            Back to Dashboard
          </v-btn>
        </div>

        <v-row v-else>
          <v-col
            v-for="item in filteredClasses"
            :key="item.id"
            cols="12"
            md="6"
            xl="4"
          >
            <v-card class="class-card" rounded="xl" elevation="0">
              <div class="class-card-top">
                <v-chip
                  size="small"
                  color="success"
                  variant="tonal"
                >
                  {{ item.status }}
                </v-chip>

                <div class="class-code">
                  {{ item.class?.class_code || '—' }}
                </div>
              </div>

              <div class="class-name">
                {{ item.class?.class_name || 'Class' }}
              </div>

              <div class="class-description">
                {{ item.class?.description || 'No class description provided yet.' }}
              </div>

              <div class="class-meta">
                Instructor: {{ item.class?.instructor?.full_name || 'Instructor' }}
              </div>

              <div class="class-meta">
                Joined {{ formatDate(item.joined_at || item.created_at) }}
              </div>

              <div class="class-actions">
                <v-btn variant="text" color="primary" class="px-0" @click="goToClass(item)">
                  Open Class
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
.my-classes-page {
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
.class-card,
.loading-wrap,
.empty-state {
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.toolbar-card,
.class-card {
  padding: 1.25rem;
}

.toolbar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.class-card {
  height: 100%;
}

.class-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.class-code {
  font-size: 0.84rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.class-name {
  font-size: 1.08rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.55rem;
}

.class-description {
  font-size: 0.94rem;
  line-height: 1.75;
  color: #64748b;
  margin-bottom: 0.9rem;
}

.class-meta {
  font-size: 0.84rem;
  color: #94a3b8;
  margin-bottom: 0.45rem;
}

.class-actions {
  margin-top: 1rem;
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
  .my-classes-page {
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
  .class-card,
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