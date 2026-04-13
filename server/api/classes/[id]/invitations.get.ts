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
    .from('class_invitations')
    .select('id, class_id, email, student_user_id, status, expires_at, created_at, accepted_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    invitations: data ?? []
  }
})