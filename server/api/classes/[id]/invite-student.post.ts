import { createError, getRouterParam, readBody } from 'h3'
import { getOwnedClassOrThrow, normalizeEmail, requireInstructor } from '#server/utils/class-auth'
import {
  buildInvitationExpiry,
  buildInvitationUrl,
  generateInvitationToken
} from '#server/utils/class-invitations'

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)
  const classId = getRouterParam(event, 'id')

  if (!classId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing class id'
    })
  }

  const body = await readBody(event)
  const email = normalizeEmail(body.email)

  const klass = await getOwnedClassOrThrow(supabase, classId, authUser.id)

  if (klass.status !== 'ACTIVE') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cannot invite students to an archived class'
    })
  }

  const { data: student, error: studentError } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('email', email)
    .single()

  if (studentError || !student) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No registered student account found for this email'
    })
  }

  if (student.role !== 'STUDENT') {
    throw createError({
      statusCode: 409,
      statusMessage: 'The email belongs to a non-student account'
    })
  }

  const { count: activeEnrollmentCount } = await supabase
    .from('class_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('student_id', student.id)
    .eq('status', 'ACTIVE')

  if ((activeEnrollmentCount ?? 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Student is already enrolled in this class'
    })
  }

  const { count: pendingInvitationCount } = await supabase
    .from('class_invitations')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('email', email)
    .eq('status', 'PENDING')

  if ((pendingInvitationCount ?? 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'There is already a pending invitation for this student'
    })
  }

  const { rawToken, tokenHash } = generateInvitationToken()
  const expiresAt = buildInvitationExpiry(7)

  const { data, error } = await supabase
    .from('class_invitations')
    .insert({
      class_id: classId,
      email,
      student_user_id: student.id,
      token_hash: tokenHash,
      status: 'PENDING',
      expires_at: expiresAt,
      invited_by: authUser.id
    })
    .select('id, class_id, email, student_user_id, status, expires_at, created_at, accepted_at')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    invitation: data,
    invitation_url: buildInvitationUrl(rawToken)
  }
})