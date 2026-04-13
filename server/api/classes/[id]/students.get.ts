import { createError, getQuery, getRouterParam } from 'h3'
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

  const query = getQuery(event)
  const status =
    typeof query.status === 'string' && ['ACTIVE', 'REMOVED'].includes(query.status.toUpperCase())
      ? query.status.toUpperCase()
      : 'ACTIVE'

  const { data, error } = await supabase
    .from('class_enrollments')
    .select(`
      id,
      class_id,
      student_id,
      invitation_id,
      status,
      joined_at,
      created_at,
      updated_at,
      student:users!class_enrollments_student_id_fkey (
        id,
        full_name,
        email,
        role
      )
    `)
    .eq('class_id', classId)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    students: data ?? []
  }
})