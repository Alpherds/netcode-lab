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

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('class_enrollments')
    .select('id, joined_at, created_at')
    .eq('class_id', classId)
    .eq('student_id', profile.id)
    .eq('status', 'ACTIVE')
    .single()

  if (enrollmentError || !enrollment) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not enrolled in this class'
    })
  }

  const { data: klass, error: classError } = await supabase
    .from('classes')
    .select(`
      id,
      instructor_id,
      class_name,
      class_code,
      description,
      status,
      created_at,
      updated_at,
      instructor:users!classes_instructor_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('id', classId)
    .single()

  if (classError || !klass) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Class not found'
    })
  }

  return {
    success: true,
    class: {
      ...klass,
      joined_at: enrollment.joined_at || enrollment.created_at
    }
  }
})