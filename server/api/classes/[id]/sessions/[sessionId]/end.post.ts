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
    .select('*')
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
    return {
      success: true,
      session
    }
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'ENDED',
      ended_at: now
    })
    .eq('id', sessionId)
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
      updated_at
    `)
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    session: data
  }
})