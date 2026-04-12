import { createError, getQuery } from 'h3'
import { requireInstructor } from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)
  const query = getQuery(event)

  const status =
    typeof query.status === 'string' && ['ACTIVE', 'ARCHIVED'].includes(query.status.toUpperCase())
      ? query.status.toUpperCase()
      : null

  let builder = supabase
    .from('classes')
    .select('id, instructor_id, class_name, class_code, description, status, created_at, updated_at')
    .eq('instructor_id', authUser.id)
    .order('created_at', { ascending: false })

  if (status) {
    builder = builder.eq('status', status)
  }

  const { data, error } = await builder

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    classes: data ?? []
  }
})