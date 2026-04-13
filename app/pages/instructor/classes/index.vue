<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'
import { useSupabase } from '~/composables/useSupabase'

definePageMeta({
  middleware: 'role',
  roles: ['INSTRUCTOR']
})

type ClassStatus = 'ACTIVE' | 'ARCHIVED'

interface ClassRow {
  id: string
  instructor_id: string
  class_name: string
  class_code: string
  description: string | null
  status: ClassStatus
  created_at: string
  updated_at: string
}

const auth = useAuthStore()
const supabase = useSupabase()

const loading = ref(false)
const saving = ref(false)
const archiving = ref(false)

const search = ref('')
const statusFilter = ref<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE')

const classes = ref<ClassRow[]>([])

const dialog = ref(false)
const archiveDialog = ref(false)
const unarchiveDialog = ref(false)

const editingClassId = ref<string | null>(null)
const classToArchive = ref<ClassRow | null>(null)
const classToUnarchive = ref<ClassRow | null>(null)

const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  class_name: '',
  class_code: '',
  description: ''
})

const isEditMode = computed(() => !!editingClassId.value)

const filteredClasses = computed(() => {
  const term = search.value.trim().toLowerCase()

  return classes.value.filter((item) => {
    const matchesSearch =
      !term ||
      item.class_name.toLowerCase().includes(term) ||
      item.class_code.toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term)

    return matchesSearch
  })
})

const formValid = computed(() => {
  return form.class_name.trim() !== '' && form.class_code.trim() !== ''
})

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function resetForm() {
  form.class_name = ''
  form.class_code = ''
  form.description = ''
  editingClassId.value = null
}

function openCreateDialog() {
  clearMessages()
  resetForm()
  dialog.value = true
}

function openEditDialog(item: ClassRow) {
  clearMessages()
  editingClassId.value = item.id
  form.class_name = item.class_name
  form.class_code = item.class_code
  form.description = item.description || ''
  dialog.value = true
}

function openArchiveDialog(item: ClassRow) {
  clearMessages()
  classToArchive.value = item
  archiveDialog.value = true
}

function openUnarchiveDialog(item: ClassRow) {
  clearMessages()
  classToUnarchive.value = item
  unarchiveDialog.value = true
}

function closeDialog() {
  dialog.value = false
  resetForm()
}

function closeArchiveDialog() {
  archiveDialog.value = false
  classToArchive.value = null
}

function closeUnarchiveDialog() {
  unarchiveDialog.value = false
  classToUnarchive.value = null
}

function formatDate(value: string) {
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

function statusColor(status: ClassStatus) {
  return status === 'ACTIVE' ? 'success' : 'grey'
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Unable to get access token')
  }

  return data.session.access_token
}

async function fetchClasses() {
  loading.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    const query =
      statusFilter.value === 'ALL'
        ? '/api/classes/list'
        : `/api/classes/list?status=${statusFilter.value}`

    const response = await $fetch<{
      success: boolean
      classes: ClassRow[]
    }>(query, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    classes.value = response.classes || []
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to load classes.'
  } finally {
    loading.value = false
  }
}

async function submitClass() {
  if (!formValid.value) return

  saving.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    const payload = {
      class_name: form.class_name,
      class_code: form.class_code,
      description: form.description
    }

    if (isEditMode.value && editingClassId.value) {
      await $fetch(`/api/classes/${editingClassId.value}/update`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      })

      successMessage.value = 'Class updated successfully.'
    } else {
      await $fetch('/api/classes/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      })

      successMessage.value = 'Class created successfully.'
    }

    closeDialog()
    await fetchClasses()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to save class.'
  } finally {
    saving.value = false
  }
}

async function archiveClass() {
  if (!classToArchive.value) return

  archiving.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    await $fetch(`/api/classes/${classToArchive.value.id}/archive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    successMessage.value = 'Class archived successfully.'
    closeArchiveDialog()
    await fetchClasses()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to archive class.'
  } finally {
    archiving.value = false
  }
}

async function unarchiveClass() {
  if (!classToUnarchive.value) return

  archiving.value = true
  clearMessages()

  try {
    const token = await getAccessToken()

    await $fetch(`/api/classes/${classToUnarchive.value.id}/unarchive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    successMessage.value = 'Class restored successfully.'
    closeUnarchiveDialog()
    await fetchClasses()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to restore class.'
  } finally {
    archiving.value = false
  }
}

watch(statusFilter, fetchClasses)

onMounted(fetchClasses)
</script>

<template>
  <v-container fluid class="classes-page px-3 px-sm-5 px-md-6 px-lg-8 py-5 py-md-8">
    <section class="hero-card">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />

      <v-row class="ma-0" align="center">
        <v-col cols="12" lg="8">
          <div class="hero-chip mb-4">
            Instructor Classes • NetCode Virtual Laboratory
          </div>

          <h1 class="hero-title">
            Manage your
            <span>classes</span>
          </h1>

          <p class="hero-subtitle">
            Create and organize your classes before inviting students and launching class-based online sessions.
          </p>

          <div class="hero-actions">
            <v-btn color="primary" size="large" class="hero-btn" @click="openCreateDialog">
              Create Class
            </v-btn>

            <v-btn variant="outlined" size="large" class="hero-btn-outline" @click="navigateTo('/instructor/dashboard')">
              Back to Dashboard
            </v-btn>
          </div>
        </v-col>

        <v-col cols="12" lg="4">
          <div class="hero-side-card">
            <div class="hero-side-label">Class Management</div>
            <div class="hero-side-value">{{ classes.length }}</div>
            <div class="hero-side-text">
              Total classes currently visible under your instructor account.
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
            <div class="section-title">Your Classes</div>
            <div class="section-subtitle">
              Create, update, and archive the classes you own.
            </div>
          </div>

          <v-btn color="primary" class="toolbar-btn" @click="openCreateDialog">
            <v-icon start size="18">mdi-plus</v-icon>
            New Class
          </v-btn>
        </div>

        <v-row class="mt-2">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="search"
              label="Search classes"
              variant="outlined"
              density="comfortable"
              hide-details
              prepend-inner-icon="mdi-magnify"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="statusFilter"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
              :items="[
                { title: 'All Classes', value: 'ALL' },
                { title: 'Active', value: 'ACTIVE' },
                { title: 'Archived', value: 'ARCHIVED' }
              ]"
            />
          </v-col>
        </v-row>
      </div>
    </section>

    <section class="section-space">
      <div v-if="loading" class="loading-wrap">
        <v-progress-circular indeterminate color="primary" size="42" />
        <div class="loading-text">Loading classes...</div>
      </div>

      <template v-else>
        <div v-if="!filteredClasses.length" class="empty-state">
          <div class="empty-icon">
            <v-icon size="34">mdi-google-classroom</v-icon>
          </div>

          <div class="empty-title">No classes found</div>
          <div class="empty-text">
            Create your first class to start inviting students and organizing sessions.
          </div>

        </div>

        <v-row v-else>
          <v-col
            v-for="item in filteredClasses"
            :key="item.id"
            cols="12"
            md="6"
            xl="4"
          >
          <v-card
                class="class-card"
                rounded="xl"
                elevation="0"
              >
              <div class="class-card-top">
                <v-chip
                  size="small"
                  :color="statusColor(item.status)"
                  variant="tonal"
                >
                  {{ item.status }}
                </v-chip>

                <div class="class-code">
                  {{ item.class_code }}
                </div>
              </div>

              <div class="class-name">
                {{ item.class_name }}
              </div>

              <div class="class-description">
                {{ item.description || 'No class description provided yet.' }}
              </div>

              <div class="class-meta">
                Created {{ formatDate(item.created_at) }}
              </div>

             <div class="class-actions">
               <v-btn
                  variant="text"
                  color="primary"
                  class="px-0"
                  :to="`/instructor/classes/${item.id}`"
                >
                  Open
                </v-btn>

                <v-btn variant="text" color="primary" class="px-0" @click="openEditDialog(item)">
                    Edit
                  </v-btn>

                  <v-btn
                    v-if="item.status === 'ACTIVE'"
                    variant="text"
                    color="error"
                    class="px-0"
                    @click="openArchiveDialog(item)"
                  >
                    Archive
                  </v-btn>

                  <v-btn
                    v-else
                    variant="text"
                    color="success"
                    class="px-0"
                    @click="openUnarchiveDialog(item)"
                  >
                    Unarchive
                  </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </section>

    <!-- CREATE / EDIT DIALOG -->
    <v-dialog v-model="dialog" max-width="640">
      <v-card rounded="xl">
        <v-card-title class="dialog-title">
          {{ isEditMode ? 'Edit Class' : 'Create Class' }}
        </v-card-title>

        <v-card-text class="pt-2">
          <v-text-field
            v-model="form.class_name"
            label="Class Name"
            variant="outlined"
            class="mb-3"
          />

          <v-text-field
            v-model="form.class_code"
            label="Class Code"
            variant="outlined"
            class="mb-3"
          />

          <v-textarea
            v-model="form.description"
            label="Description"
            variant="outlined"
            rows="4"
            auto-grow
          />
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!formValid"
            @click="submitClass"
          >
            {{ isEditMode ? 'Save Changes' : 'Create Class' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ARCHIVE DIALOG -->
    <v-dialog v-model="archiveDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="dialog-title">
          Archive Class
        </v-card-title>

        <v-card-text class="pt-2">
          Are you sure you want to archive
          <strong>{{ classToArchive?.class_name }}</strong>?
          Students and existing records remain, but the class will be marked as archived.
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeArchiveDialog">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="archiving"
            @click="archiveClass"
          >
            Archive
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="unarchiveDialog" max-width="520">
  <v-card rounded="xl">
    <v-card-title class="dialog-title">
      Restore Class
    </v-card-title>

    <v-card-text class="pt-2">
      Are you sure you want to restore
      <strong>{{ classToUnarchive?.class_name }}</strong>?
      This class will become active again and can be used for invitations and sessions.
    </v-card-text>

    <v-card-actions class="dialog-actions">
      <v-spacer />
      <v-btn variant="text" @click="closeUnarchiveDialog">
        Cancel
      </v-btn>
      <v-btn
        color="success"
        :loading="archiving"
        @click="unarchiveClass"
      >
        Restore
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
  </v-container>
</template>

<style scoped>
.classes-page {
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
  font-size: clamp(2rem, 4vw, 3.2rem);
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

.toolbar-card {
  border-radius: 24px;
  padding: 1.25rem;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.toolbar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.toolbar-btn {
  height: 46px;
  border-radius: 14px;
  font-weight: 800;
  text-transform: none;
}

.class-card {
  height: 100%;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
  padding: 1.25rem;
}

.class-card-clickable {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.class-card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 52px rgba(15, 23, 42, 0.08);
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
  margin-bottom: 1rem;
}

.class-meta {
  font-size: 0.82rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.class-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.loading-wrap,
.empty-state {
  min-height: 280px;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
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
  .classes-page {
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
  .toolbar-btn {
    width: 100%;
  }

  .toolbar-head {
    flex-direction: column;
    align-items: stretch;
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