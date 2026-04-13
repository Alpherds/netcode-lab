import { createError, getRouterParam } from 'h3'
import { requireStudent } from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, profile } = await requireStudent(event)
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing session id'
    })
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id,
      class_id,
      instructor_id,
      title,
      description,
      session_code,
      scheduled_at,
      status,
      created_at,
      started_at,
      ended_at,
      updated_at,
      meeting_provider,
      meeting_room_name,
      meeting_url,
      class:classes!sessions_class_id_fkey (
        id,
        class_name,
        class_code,
        description
      ),
      instructor:users!sessions_instructor_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found'
    })
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('class_enrollments')
    .select('id')
    .eq('class_id', session.class_id)
    .eq('student_id', profile.id)
    .eq('status', 'ACTIVE')
    .single()

  if (enrollmentError || !enrollment) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not enrolled in this class'
    })
  }

  return {
    success: true,
    session
  }
})