<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

definePageMeta({
  middleware: 'role',
  roles: ['INSTRUCTOR']
})

const auth = useAuthStore()

const quickActions = [
  {
    title: 'Manage Classes',
    text: 'Create and organize classes before inviting students and opening sessions.',
    icon: 'mdi-google-classroom',
    accentClass: 'accent-blue',
    to: '/instructor/classes'
  },
  {
    title: 'Manage Coding Lab',
    text: 'Assign, monitor, and evaluate live coding activities.',
    icon: 'mdi-laptop',
    accentClass: 'accent-green',
    to: '/instructor/classes'
  },
  {
    title: 'Launch Simulators',
    text: 'Prepare PC assembly and LAN cable exercises for the class.',
    icon: 'mdi-puzzle',
    accentClass: 'accent-pink',
    to: '/instructor/classes'
  }
]

const activities = [
  {
    title: 'Networking Fundamentals Session',
    description: 'Live class started and students were admitted successfully.',
    time: 'Today • 9:10 AM',
    icon: 'mdi-video-outline',
    accentClass: 'accent-blue'
  },
  {
    title: 'JavaScript Coding Task Assigned',
    description: 'A new real-time coding exercise was published to the active class.',
    time: 'Today • 8:45 AM',
    icon: 'mdi-code-json',
    accentClass: 'accent-green'
  },
  {
    title: 'LAN Crimping Simulation Enabled',
    description: 'Students can now access RJ45 arrangement and validation practice.',
    time: 'Yesterday • 2:30 PM',
    icon: 'mdi-ethernet-cable',
    accentClass: 'accent-pink'
  }
]
</script>

<template>
  <v-container fluid class="instructor-dashboard px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
    <section class="hero-card">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />

      <v-row class="ma-0" align="center">
        <v-col cols="12" lg="8">
          <div class="hero-chip mb-4">
            Instructor Workspace • NetCode Virtual Laboratory
          </div>

          <h1 class="hero-title">
            Welcome,
            <span>{{ auth.fullName }}</span>
          </h1>

          <p class="hero-subtitle">
            Manage live virtual classes, coding activities, and facilitate interactive
            hardware and networking simulations from one instructor workspace.
          </p>

    <div class="hero-actions">
  <v-btn color="primary" size="large" class="hero-btn" @click="navigateTo('/instructor/classes')">
    Manage Classes
  </v-btn>

  <v-btn
    variant="outlined"
    size="large"
    class="hero-btn-outline"
    @click="navigateTo('/instructor/classes')"
  >
    View Classes
  </v-btn>
</div>
        </v-col>

        <v-col cols="12" lg="4">
          <div class="hero-side-card">
            <div class="hero-side-label">Current Role</div>
            <div class="hero-side-value">{{ auth.role }}</div>
            <div class="hero-side-text">
              Your instructor workspace is active and ready for session creation, live class control,
              student monitoring, and laboratory activity management.
            </div>

            <div class="hero-side-divider" />

            <div class="hero-side-grid">
              <div>
                <div class="hero-side-mini-label">Session Status</div>
                <div class="hero-side-mini-value">Ready</div>
              </div>

              <div>
                <div class="hero-side-mini-label">Instructor Tools</div>
                <div class="hero-side-mini-value">Enabled</div>
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
            Start the most important instructor tasks with one click
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

           <v-btn variant="text" color="primary" class="px-0 mt-2" @click="navigateTo(item.to)">
              Open
            </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card class="activity-panel" rounded="xl" elevation="0">
            <div class="panel-title">Recent Instructor Activity</div>
            <div class="panel-subtitle mb-5">
              Latest classroom and laboratory actions under your control
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
.instructor-dashboard {
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
  font-size: clamp(2rem, 4vw, 3.4rem);
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
  margin: 0 0 1.5rem;
  font-size: 1rem;
  line-height: 1.9;
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
  margin-bottom: 0.65rem;
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
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
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
.panel-subtitle,
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
  .instructor-dashboard {
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

  .hero-side-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .hero-card {
    border-radius: 24px;
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

  .action-card,
  .activity-panel {
    border-radius: 20px;
  }
}
</style>