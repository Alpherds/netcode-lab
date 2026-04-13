import { createError } from 'h3'
import { requireStudent } from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, profile } = await requireStudent(event)

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
      meeting_url,
      class:classes!sessions_class_id_fkey (
        id,
        class_name,
        class_code,
        description
      ),
      instructor:users!sessions_instructor_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .in(
      'class_id',
      (
        await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', profile.id)
          .eq('status', 'ACTIVE')
      ).data?.map((row) => row.class_id) || []
    )
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