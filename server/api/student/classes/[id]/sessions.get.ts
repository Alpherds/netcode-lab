import { createError, getRouterParam } from 'h3'
import { requireStudent } from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, profile } = await requireStudent(event)
  const classId = getRouterParam(event, 'id')

  if (!classId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing class id'
    })
  }

  // ✅ Ensure student is enrolled
  const { data: enrollment } = await supabase
    .from('class_enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('student_id', profile.id)
    .eq('status', 'ACTIVE')
    .single()

  if (!enrollment) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not enrolled in this class'
    })
  }

  // ✅ Fetch sessions
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
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
    sessions: sessions || []
  }
})