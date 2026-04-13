<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
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

const auth = useAuthStore()
const supabase = useSupabase()

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const joinedClasses = ref<StudentClassRow[]>([])

const joinedClassCount = computed(() => joinedClasses.value.length)

const quickActions = [
  {
    title: 'My Classes',
    text: 'View the classes you joined and access your class-based learning space.',
    icon: 'mdi-google-classroom',
    accentClass: 'accent-blue',
    action: () => navigateTo('/student/classes')
  },
  {
    title: 'Open Coding Lab',
    text: 'Practice and review coding activities assigned inside your classes.',
    icon: 'mdi-laptop',
    accentClass: 'accent-green',
    action: () => {
      successMessage.value = 'Coding Lab module is the next step to build.'
    }
  },
  {
    title: 'Open Simulators',
    text: 'Launch your upcoming PC assembly and LAN cable learning activities.',
    icon: 'mdi-puzzle-outline',
    accentClass: 'accent-pink',
    action: () => {
      successMessage.value = 'Simulation module is the next step to build.'
    }
  }
]

const activities = [
  {
    title: 'Class Invitation Accepted',
    description: 'You successfully joined a class through an invitation link.',
    time: 'Recent activity',
    icon: 'mdi-check-decagram-outline',
    accentClass: 'accent-blue'
  },
  {
    title: 'My Classes Available',
    description: 'Your enrolled classes are now visible in the student class module.',
    time: 'Current',
    icon: 'mdi-google-classroom',
    accentClass: 'accent-green'
  },
  {
    title: 'Session Access Ready',
    description: 'Class-based online sessions will appear once they are created by your instructor.',
    time: 'Upcoming',
    icon: 'mdi-video-wireless-outline',
    accentClass: 'accent-pink'
  }
]

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Unable to get access token')
  }

  return data.session.access_token
}

async function fetchMyClasses() {
  loading.value = true
  errorMessage.value = ''

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

    joinedClasses.value = response.classes || []
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage ||
      error?.message ||
      'Unable to load student dashboard.'
  } finally {
    loading.value = false
  }
}

function goToMyClasses() {
  navigateTo('/student/classes')
}

onMounted(fetchMyClasses)
</script>

<template>
  <v-container fluid class="student-dashboard px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
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
            Student Workspace • NetCode Virtual Laboratory
          </div>

          <h1 class="hero-title">
            Welcome,
            <span>{{ auth.fullName }}</span>
          </h1>

          <p class="hero-subtitle">
            Access your joined classes, upcoming online sessions, coding activities,
            and virtual laboratory learning space from one student dashboard.
          </p>

          <div class="hero-actions">
            <v-btn color="primary" size="large" class="hero-btn" @click="goToMyClasses">
              My Classes
            </v-btn>

            <v-btn
              variant="outlined"
              size="large"
              class="hero-btn-outline"
              @click="fetchMyClasses"
              :loading="loading"
            >
              Refresh Dashboard
            </v-btn>
          </div>
        </v-col>

        <v-col cols="12" lg="4">
          <div class="hero-side-card">
            <div class="hero-side-label">Joined Classes</div>
            <div class="hero-side-value">{{ joinedClassCount }}</div>
            <div class="hero-side-text">
              Active classes currently connected to your student account.
            </div>

            <div class="hero-side-divider" />

            <div class="hero-side-grid">
              <div>
                <div class="hero-side-mini-label">Role</div>
                <div class="hero-side-mini-value">{{ auth.role }}</div>
              </div>

              <div>
                <div class="hero-side-mini-label">Workspace</div>
                <div class="hero-side-mini-value">Ready</div>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </section>

    <section class="section-space">
      <v-row>
        <v-col cols="12" lg="7">
          <div class="section-title mb-2">Quick Actions</div>
          <div class="section-subtitle mb-5">
            Start the most important student tasks with one click
          </div>

          <v-row>
            <v-col
              v-for="item in quickActions"
              :key="item.title"
              cols="12"
              md="6"
              xl="4"
            >
              <v-card class="action-card" rounded="xl" elevation="0">
                <div class="action-icon" :class="item.accentClass">
                  <v-icon size="24">{{ item.icon }}</v-icon>
                </div>

                <div class="action-title">{{ item.title }}</div>
                <div class="action-text">{{ item.text }}</div>

                <v-btn variant="text" color="primary" class="px-0 mt-2" @click="item.action()">
                  Open
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card class="activity-panel" rounded="xl" elevation="0">
            <div class="panel-title">Recent Student Activity</div>
            <div class="panel-subtitle mb-5">
              Latest updates related to your learning workspace
            </div>

            <div class="activity-list">
              <div
                v-for="item in activities"
                :key="item.title"
                class="activity-item"
              >
                <div class="activity-icon" :class="item.accentClass">
                  <v-icon size="20">{{ item.icon }}</v-icon>
                </div>

                <div class="activity-content">
                  <div class="activity-title">{{ item.title }}</div>
                  <div class="activity-text">{{ item.description }}</div>
                  <div class="activity-time">{{ item.time }}</div>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </v-container>
</template>

<style scoped>
.student-dashboard {
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

.action-card,
.activity-panel {
  height: 100%;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.action-card,
.activity-panel {
  padding: 1.25rem;
}

.action-icon,
.activity-icon {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  margin-bottom: 1rem;
}

.action-title,
.panel-title,
.activity-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
}

.action-text,
.activity-text {
  font-size: 0.94rem;
  line-height: 1.7;
  color: #64748b;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  margin-bottom: 0.2rem;
}

.activity-text {
  margin-bottom: 0.35rem;
}

.activity-time {
  font-size: 0.82rem;
  color: #94a3b8;
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
  .student-dashboard {
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
  .action-card,
  .activity-panel {
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