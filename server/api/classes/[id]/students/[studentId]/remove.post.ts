import { createError, getRouterParam } from 'h3'
import { getOwnedClassOrThrow, requireInstructor } from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)

  const classId = getRouterParam(event, 'id')
  const studentId = getRouterParam(event, 'studentId')

  if (!classId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing class id'
    })
  }

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing student id'
    })
  }

  await getOwnedClassOrThrow(supabase, classId, authUser.id)

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('class_enrollments')
    .select('*')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .single()

  if (enrollmentError || !enrollment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Enrollment not found'
    })
  }

  if (enrollment.status !== 'ACTIVE') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Student is not currently active in this class'
    })
  }

  const { data, error } = await supabase
    .from('class_enrollments')
    .update({
      status: 'REMOVED'
    })
    .eq('id', enrollment.id)
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
    enrollment: data
  }
})