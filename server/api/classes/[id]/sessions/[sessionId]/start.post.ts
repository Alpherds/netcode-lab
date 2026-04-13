 import { createError, getRouterParam } from 'h3'
import { getOwnedClassOrThrow, requireInstructor } from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)

  const classId = getRouterParam(event, 'id')
  const sessionId = getRouterParam(event, 'sessionId')

  if (!classId || !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing route parameters'
    })
  }

  await getOwnedClassOrThrow(supabase, classId, authUser.id)

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, class_id, instructor_id, status, meeting_room_name')
    .eq('id', sessionId)
    .eq('class_id', classId)
    .eq('instructor_id', authUser.id)
    .single()

  if (sessionError || !session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found'
    })
  }

  if (session.status === 'ENDED') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ended sessions cannot be restarted'
    })
  }

  const roomName =
    session.meeting_room_name ||
    `netcode-${classId.replace(/[^a-zA-Z0-9]/g, '')}-${sessionId.replace(/[^a-zA-Z0-9]/g, '')}`

  const meetingUrl = `https://meet.jit.si/${roomName}`
  const now = new Date().toISOString()

  const { data: updated, error: updateError } = await supabase
    .from('sessions')
    .update({
      status: 'ACTIVE',
      started_at: now,
      meeting_provider: 'JITSI',
      meeting_room_name: roomName,
      meeting_url: meetingUrl
    })
    .eq('id', sessionId)
    .select(`
      id,
      class_id,
      instructor_id,
      title,
      description,
      session_code,
      status,
      scheduled_at,
      started_at,
      ended_at,
      meeting_provider,
      meeting_room_name,
      meeting_url,
      created_at,
      updated_at
    `)
    .single()

  if (updateError || !updated) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError?.message || 'Unable to start session'
    })
  }

  return {
    success: true,
    session: updated
  }
})