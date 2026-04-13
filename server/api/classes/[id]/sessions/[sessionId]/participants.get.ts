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
    .select('id, class_id, instructor_id')
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

  const { data, error } = await supabase
    .from('session_participants')
    .select(`
      id,
      session_id,
      user_id,
      joined_at,
      left_at,
      user:users!session_participants_user_id_fkey (
        id,
        full_name,
        email,
        role
      )
    `)
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    participants: data ?? []
  }
})