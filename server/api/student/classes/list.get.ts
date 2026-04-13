import { createError } from 'h3'
import { requireStudent } from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, profile } = await requireStudent(event)

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
      class:classes!class_enrollments_class_id_fkey (
        id,
        class_name,
        class_code,
        description,
        status,
        created_at,
        updated_at,
        instructor_id,
        instructor:users!classes_instructor_id_fkey (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('student_id', profile.id)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })

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