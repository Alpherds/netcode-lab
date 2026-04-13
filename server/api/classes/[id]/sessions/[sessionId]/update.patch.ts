import { createError, getRouterParam, readBody } from 'h3'
import {
  getOwnedClassOrThrow,
  normalizeOptionalText,
  normalizeRequiredText,
  requireInstructor
} from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)

  const classId = getRouterParam(event, 'id')
  const sessionId = getRouterParam(event, 'sessionId')

  if (!classId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing class id'
    })
  }

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing session id'
    })
  }

  await getOwnedClassOrThrow(supabase, classId, authUser.id)

  const { data: existing, error: existingError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('class_id', classId)
    .eq('instructor_id', authUser.id)
    .single()

  if (existingError || !existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found'
    })
  }

  if (existing.status === 'ENDED') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ended sessions can no longer be edited'
    })
  }

  const body = await readBody(event)

  const title = normalizeRequiredText(body.title, 'title', 150)
  const description = normalizeOptionalText(body.description, 2000)
  const scheduledAt =
    typeof body.scheduled_at === 'string' && body.scheduled_at.trim()
      ? body.scheduled_at
      : null

  const { data, error } = await supabase
    .from('sessions')
    .update({
      title,
      description,
      scheduled_at: scheduledAt
    })
    .eq('id', sessionId)
    .select(`
      id,
      class_id,
      instructor_id,
      session_code,
      title,
      description,
      status,
      created_at,
      started_at,
      scheduled_at,
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