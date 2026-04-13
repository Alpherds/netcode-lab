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
    .select('id, class_id')
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

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('session_participants')
    .update({
      left_at: now
    })
    .eq('session_id', sessionId)
    .eq('user_id', profile.id)
    .is('left_at', null)
    .select('id, session_id, user_id, joined_at, left_at')
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    participant: data
  }
})