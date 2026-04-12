<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

definePageMeta({
  middleware: 'role',
  roles: ['STUDENT']
})

const auth = useAuthStore()

const stats = [
  {
    title: 'Active Sessions',
    value: '02',
    subtitle: 'Sessions available to join',
    icon: 'mdi-video-wireless',
    colorClass: 'stat-blue'
  },
  {
    title: 'Coding Attempts',
    value: '14',
    subtitle: 'Recent lab executions',
    icon: 'mdi-code-tags',
    colorClass: 'stat-green'
  },
  {
    title: 'Simulations Done',
    value: '06',
    subtitle: 'Completed activities',
    icon: 'mdi-puzzle',
    colorClass: 'stat-pink'
  },
  {
    title: 'Attendance',
    value: '92%',
    subtitle: 'Current participation rate',
    icon: 'mdi-account-check-outline',
    colorClass: 'stat-purple'
  }
]

const quickActions = [
  {
    title: 'Join Session',
    text: 'Enter and participate in a live classroom session.',
    icon: 'mdi-login-variant',
    accentClass: 'action-blue'
  },
  {
    title: 'Open Coding Lab',
    text: 'Practice, run, and review your code activities.',
    icon: 'mdi-laptop',
    accentClass: 'action-green'
  },
  {
    title: 'Open Simulators',
    text: 'Launch PC assembly and LAN cable lab exercises.',
    icon: 'mdi-puzzle-outline',
    accentClass: 'action-pink'
  }
]

const activities = [
  {
    title: 'PC Assembly Simulation',
    description: 'Completed motherboard and RAM placement validation.',
    time: 'Today • 10:15 AM',
    icon: 'mdi-desktop-classic',
    accentClass: 'activity-blue'
  },
  {
    title: 'Live Coding Activity',
    description: 'Submitted JavaScript practice output successfully.',
    time: 'Yesterday • 3:40 PM',
    icon: 'mdi-code-json',
    accentClass: 'activity-green'
  },
  {
    title: 'Joined Online Session',
    description: 'Participated in Networking Fundamentals live class.',
    time: 'Yesterday • 1:05 PM',
    icon: 'mdi-video-outline',
    accentClass: 'activity-pink'
  }
]

const modules = [
  {
    title: 'Live Coding Laboratory',
    text: 'Write, execute, and review source code during class activities.',
    icon: 'mdi-laptop',
    accentClass: 'module-blue'
  },
  {
    title: 'PC Assembly Simulator',
    text: 'Practice component identification and hardware assembly flow.',
    icon: 'mdi-desktop-tower-monitor',
    accentClass: 'module-green'
  },
  {
    title: 'LAN Cable Simulator',
    text: 'Perform guided RJ45 arrangement and crimping simulation.',
    icon: 'mdi-ethernet-cable',
    accentClass: 'module-pink'
  }
]
</script>

<template>
  <v-container fluid class="student-dashboard px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
    <!-- HERO -->
    <section class="hero-card">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />

      <v-row class="ma-0" align="center">
        <v-col cols="12" lg="8">
          <div class="hero-chip mb-4">
            Student Workspace • NetCode Virtual Laboratory
          </div>

          <div class="d-flex align-center flex-wrap ga-4 mb-4">
            <div class="hero-logo-wrap">
              <img src="/logo.png" alt="NetCode Logo" class="hero-logo" />
            </div>
          </div>

          <h1 class="hero-title">
            Welcome back,
            <span>{{ auth.fullName }}</span>
          </h1>

          <p class="hero-subtitle">
            Access your live sessions, coding exercises, and interactive simulations from one
            student workspace designed for modern IT learning.
          </p>

          <div class="hero-actions">
            <v-btn color="primary" size="large" class="hero-btn">
              Join Live Session
            </v-btn>

            <v-btn variant="outlined" size="large" class="hero-btn-outline">
              View Learning Modules
            </v-btn>
          </div>
        </v-col>

        <v-col cols="12" lg="4">
          <div class="hero-side-card">
            <div class="hero-side-label">Current Role</div>
            <div class="hero-side-value">{{ auth.role }}</div>
            <div class="hero-side-text">
              Your student account is active and ready for live classes, simulations, and coding activities.
            </div>

            <div class="hero-side-divider" />

            <div class="hero-side-grid">
              <div>
                <div class="hero-side-mini-label">Status</div>
                <div class="hero-side-mini-value">Ready</div>
              </div>

              <div>
                <div class="hero-side-mini-label">Modules</div>
                <div class="hero-side-mini-value">3 Active</div>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </section>

    <!-- STATS -->
    <section class="section-space">
      <div class="section-heading-wrap">
        <div>
          <div class="section-title">Overview</div>
          <div class="section-subtitle">Your current learning activity snapshot</div>
        </div>
      </div>

      <v-row>
        <v-col
          v-for="item in stats"
          :key="item.title"
          cols="12"
          sm="6"
          xl="3"
        >
          <v-card class="stat-card" rounded="xl" elevation="0">
            <div class="stat-icon" :class="item.colorClass">
              <v-icon size="24">{{ item.icon }}</v-icon>
            </div>

            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-subtitle">{{ item.subtitle }}</div>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <!-- QUICK ACTIONS + ACTIVITY -->
    <section class="section-space">
      <v-row>
        <v-col cols="12" lg="7">
          <div class="section-title mb-2">Quick Actions</div>
          <div class="section-subtitle mb-5">
            Jump directly into your most important student tasks
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

                <v-btn variant="text" color="primary" class="px-0 mt-2">
                  Open
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" lg="5">
          <v-card class="activity-panel" rounded="xl" elevation="0">
            <div class="panel-title">Recent Activity</div>
            <div class="panel-subtitle mb-5">
              Latest classroom and laboratory actions
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

    <!-- MODULES -->
    <section class="section-space">
      <div class="section-title mb-2">Learning Modules</div>
      <div class="section-subtitle mb-5">
        Tools and environments available in your student dashboard
      </div>

      <v-row>
        <v-col
          v-for="item in modules"
          :key="item.title"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card class="module-card" rounded="xl" elevation="0">
            <div class="module-icon" :class="item.accentClass">
              <v-icon size="26">{{ item.icon }}</v-icon>
            </div>

            <div class="module-title">{{ item.title }}</div>
            <div class="module-text">{{ item.text }}</div>

            <div class="module-footer">
              <v-chip size="small" color="primary" variant="tonal">
                Available
              </v-chip>

              <v-btn variant="text" color="primary" class="px-0">
                Explore
              </v-btn>
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
    radial-gradient(circle at top left, rgba(47, 200, 255, 0.08), transparent 24%),
    radial-gradient(circle at bottom right, rgba(255, 60, 95, 0.06), transparent 18%);
}

.section-space {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

.section-subtitle {
  font-size: 0.98rem;
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
    0 24px 70px rgba(15, 23, 42, 0.18),
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
  letter-spacing: 0.01em;
}

.hero-logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hero-logo {
  width: min(100%, 250px);
  height: auto;
  display: block;
  object-fit: contain;
}

.hero-title {
  margin: 0 0 1rem;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1.04;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #ffffff;
}

.hero-title span {
  background: linear-gradient(90deg, #8ec2f4 0%, #2fc8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  max-width: 720px;
  margin: 0 0 1.6rem;
  font-size: 1.02rem;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.72);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.hero-btn {
  height: 52px;
  padding-inline: 1.4rem;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
}

.hero-btn-outline {
  height: 52px;
  padding-inline: 1.4rem;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
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

.stat-card,
.action-card,
.module-card,
.activity-panel {
  height: 100%;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
}

.stat-card {
  padding: 1.2rem;
}

.stat-icon,
.action-icon,
.module-icon,
.activity-icon {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 0.55rem;
}

.stat-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.stat-subtitle {
  font-size: 0.92rem;
  line-height: 1.7;
  color: #64748b;
}

.action-card,
.module-card {
  padding: 1.25rem;
}

.action-title,
.module-title,
.panel-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.45rem;
}

.action-text,
.module-text,
.panel-subtitle {
  font-size: 0.95rem;
  line-height: 1.75;
  color: #64748b;
}

.module-footer {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.activity-panel {
  padding: 1.25rem;
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
  font-size: 0.98rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.activity-text {
  font-size: 0.92rem;
  line-height: 1.65;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.activity-time {
  font-size: 0.82rem;
  color: #94a3b8;
}

/* Accent classes */
.stat-blue,
.action-blue,
.module-blue,
.activity-blue {
  background: linear-gradient(180deg, rgba(226, 240, 255, 0.95), rgba(212, 230, 255, 0.88));
  color: #1d4ed8;
}

.stat-green,
.action-green,
.module-green,
.activity-green {
  background: linear-gradient(180deg, rgba(227, 248, 239, 0.95), rgba(213, 241, 227, 0.88));
  color: #059669;
}

.stat-pink,
.action-pink,
.module-pink,
.activity-pink {
  background: linear-gradient(180deg, rgba(255, 232, 239, 0.95), rgba(252, 216, 228, 0.88));
  color: #e11d48;
}

.stat-purple {
  background: linear-gradient(180deg, rgba(239, 233, 255, 0.95), rgba(229, 220, 255, 0.88));
  color: #7c3aed;
}

/* Responsive */
@media (max-width: 1279px) {
  .hero-card {
    padding: 1.25rem;
  }
}

@media (max-width: 959px) {
  .hero-card {
    padding: 1.15rem;
  }

  .hero-side-card {
    margin-top: 0.6rem;
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

  .hero-side-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.25rem;
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
    font-size: 1.75rem;
  }

  .hero-logo {
    width: min(100%, 210px);
  }

  .stat-card,
  .action-card,
  .module-card,
  .activity-panel {
    border-radius: 20px;
  }
}
</style>