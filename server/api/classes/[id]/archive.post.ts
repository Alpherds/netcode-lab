import { createError, getRouterParam } from 'h3'
import { getOwnedClassOrThrow, requireInstructor } from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)
  const classId = getRouterParam(event, 'id')

  if (!classId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing class id'
    })
  }

  const klass = await getOwnedClassOrThrow(supabase, classId, authUser.id)

  const { count: activeSessionCount, error: activeSessionError } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .in('status', ['CREATED', 'ACTIVE', 'LOCKED'])

  if (activeSessionError) {
    throw createError({
      statusCode: 500,
      statusMessage: activeSessionError.message
    })
  }

  if ((activeSessionCount ?? 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cannot archive a class with active sessions'
    })
  }

  const { data, error } = await supabase
    .from('classes')
    .update({ status: 'ARCHIVED' })
    .eq('id', klass.id)
    .eq('instructor_id', authUser.id)
    .select('*')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    class: data
  }
})