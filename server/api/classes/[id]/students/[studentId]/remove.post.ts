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
    .select('id, class_id, student_id, invitation_id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .single()

  if (enrollmentError || !enrollment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Enrollment not found'
    })
  }

  const { data: studentProfile } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', studentId)
    .single()

  const studentEmail = studentProfile?.email?.trim().toLowerCase() || null

  const { error: deleteEnrollmentError } = await supabase
    .from('class_enrollments')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId)

  if (deleteEnrollmentError) {
    throw createError({
      statusCode: 500,
      statusMessage: deleteEnrollmentError.message
    })
  }

  if (enrollment.invitation_id) {
    const { error: deleteInvitationByIdError } = await supabase
      .from('class_invitations')
      .delete()
      .eq('id', enrollment.invitation_id)

    if (deleteInvitationByIdError) {
      throw createError({
        statusCode: 500,
        statusMessage: deleteInvitationByIdError.message
      })
    }
  }

  if (studentEmail) {
    const { error: deleteInvitationByStudentError } = await supabase
      .from('class_invitations')
      .delete()
      .eq('class_id', classId)
      .or(`student_user_id.eq.${studentId},email.eq.${studentEmail}`)

    if (deleteInvitationByStudentError) {
      throw createError({
        statusCode: 500,
        statusMessage: deleteInvitationByStudentError.message
      })
    }
  } else {
    const { error: deleteInvitationByUserError } = await supabase
      .from('class_invitations')
      .delete()
      .eq('class_id', classId)
      .eq('student_user_id', studentId)

    if (deleteInvitationByUserError) {
      throw createError({
        statusCode: 500,
        statusMessage: deleteInvitationByUserError.message
      })
    }
  }

  return {
    success: true,
    removed_student_id: studentId,
    removed_from_class_id: classId
  }
})