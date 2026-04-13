import { createError, getRouterParam } from 'h3'
import { getOwnedClassOrThrow, requireInstructor } from '#server/utils/class-auth'

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

  if (existing.status === 'ACTIVE') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Active session must be ended before deletion'
    })
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true
  }
})