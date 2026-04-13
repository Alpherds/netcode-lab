<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any
  }
}

const props = withDefaults(defineProps<{
  roomName: string
  displayName?: string
  email?: string
  subject?: string
  muted?: boolean
  parentHeight?: string
}>(), {
  displayName: '',
  email: '',
  subject: '',
  muted: false,
  parentHeight: '620px'
})

const containerRef = ref<HTMLElement | null>(null)
let api: any = null
let scriptPromise: Promise<void> | null = null

function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-jitsi-external-api="true"]'
    )

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Jitsi script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.dataset.jitsiExternalApi = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Jitsi script'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

async function mountMeeting() {
  if (!props.roomName || !containerRef.value) return

  await loadJitsiScript()

  if (!window.JitsiMeetExternalAPI) {
    throw new Error('Jitsi API unavailable')
  }

  if (api) {
    api.dispose()
    api = null
  }

  api = new window.JitsiMeetExternalAPI('meet.jit.si', {
    roomName: props.roomName,
    parentNode: containerRef.value,
    width: '100%',
    height: '100%',
    userInfo: {
      displayName: props.displayName,
      email: props.email
    },
    configOverwrite: {
      startWithAudioMuted: props.muted,
      prejoinPageEnabled: false,
      disableDeepLinking: true
    },
    interfaceConfigOverwrite: {
      MOBILE_APP_PROMO: false
    }
  })

  if (props.subject) {
    try {
      api.executeCommand('subject', props.subject)
    } catch {}
  }
}

function disposeMeeting() {
  if (api) {
    api.dispose()
    api = null
  }
}

watch(
  () => props.roomName,
  async () => {
    disposeMeeting()
    await mountMeeting()
  }
)

onMounted(async () => {
  await mountMeeting()
})

onBeforeUnmount(() => {
  disposeMeeting()
})
</script>

<template>
  <div class="jitsi-shell" :style="{ height: parentHeight }">
    <div ref="containerRef" class="jitsi-container" />
  </div>
</template>

<style scoped>
.jitsi-shell {
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.jitsi-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
}
</style>