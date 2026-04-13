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

  await getOwnedClassOrThrow(supabase, classId, authUser.id)

  const { data, error } = await supabase
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
      meeting_url
    `)
    .eq('class_id', classId)
    .eq('instructor_id', authUser.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    sessions: data ?? []
  }
})