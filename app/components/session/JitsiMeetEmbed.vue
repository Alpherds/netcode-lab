<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  roomName: string
  displayName?: string
  email?: string
  subject?: string
  parentHeight?: string
  muted?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
let api: any = null

function loadJitsiScript() {
  return new Promise<void>((resolve) => {
    if ((window as any).JitsiMeetExternalAPI) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => resolve()
    document.body.appendChild(script)
  })
}

function initJitsi() {
  if (!containerRef.value) return

  // cleanup old instance
  if (api) {
    api.dispose()
    api = null
  }

  const domain = 'meet.jit.si'

  api = new (window as any).JitsiMeetExternalAPI(domain, {
    roomName: props.roomName,
    parentNode: containerRef.value,

    width: '100%',
    height: '100%',

    userInfo: {
      displayName: props.displayName || 'Participant',
      email: props.email || ''
    },

    configOverwrite: {
      startWithAudioMuted: props.muted ?? false,
      startWithVideoMuted: false,
      prejoinPageEnabled: false,
      disableModeratorIndicator: false,
      enableEmailInStats: false
    },

    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_POWERED_BY: false,
      SHOW_PROMOTIONAL_CLOSE_PAGE: false,
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
      MOBILE_APP_PROMO: false
    }
  })

  // Optional: set subject/title
  if (props.subject) {
    api.executeCommand('subject', props.subject)
  }

  // 🔥 EVENTS (you can extend later)
  api.addListener('participantJoined', () => {
    console.log('Participant joined')
  })

  api.addListener('participantLeft', () => {
    console.log('Participant left')
  })

  api.addListener('videoConferenceJoined', () => {
    console.log('You joined meeting')
  })

  api.addListener('readyToClose', () => {
    console.log('Meeting closed')
  })
}

onMounted(async () => {
  await loadJitsiScript()
  initJitsi()
})

onBeforeUnmount(() => {
  if (api) {
    api.dispose()
    api = null
  }
})

// 🔁 re-init if room changes
watch(() => props.roomName, () => {
  initJitsi()
})
</script>

<template>
  <div
    ref="containerRef"
    class="jitsi-container"
    :style="{ height: parentHeight || '700px' }"
  />
</template>

<style scoped>
.jitsi-container {
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.15);
}
</style>