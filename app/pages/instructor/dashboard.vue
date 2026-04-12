<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore';

definePageMeta({
  middleware: 'role' as any,
  roles: ['INSTRUCTOR']
})

const auth = useAuthStore()
</script>

<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12">
        <v-card rounded="xl" class="pa-6">
          <div class="text-h4 font-weight-bold mb-2">
            Instructor Dashboard
          </div>
          <div class="text-body-1 text-medium-emphasis mb-6">
            Welcome, {{ auth.fullName }}. Your instructor authentication flow is working.
          </div>

          <v-row>
            <v-col cols="12" md="4">
              <v-card rounded="xl" variant="tonal" color="primary" class="pa-4">
                <div class="text-h6 font-weight-bold">Session Control</div>
                <div class="text-body-2 mt-2">
                  Create, start, lock, and end live class sessions from here.
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="xl" variant="tonal" color="success" class="pa-4">
                <div class="text-h6 font-weight-bold">Student Activity</div>
                <div class="text-body-2 mt-2">
                  Coding outputs, simulator attempts, and logs will appear here.
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="xl" variant="tonal" color="warning" class="pa-4">
                <div class="text-h6 font-weight-bold">Lab Modules</div>
                <div class="text-body-2 mt-2">
                  Coding and simulation controls will be connected here next.
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>