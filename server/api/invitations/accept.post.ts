import { createError, readBody } from 'h3'
import { requireStudent } from '#server/utils/class-auth'
import {
  assertInvitationEmailMatchesStudent,
  getInvitationByTokenOrThrow,
  isExpired
} from '#server/utils/class-invitations'

export default defineEventHandler(async (event) => {
  const { supabase, profile } = await requireStudent(event)
  const body = await readBody(event)
  const token = typeof body.token === 'string' ? body.token.trim() : ''

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing invitation token'
    })
  }

  const invitation = await getInvitationByTokenOrThrow(token)

  if (isExpired(invitation.expires_at)) {
    await supabase
      .from('class_invitations')
      .update({ status: 'EXPIRED' })
      .eq('id', invitation.id)
      .eq('status', 'PENDING')

    throw createError({
      statusCode: 409,
      statusMessage: 'This invitation has expired'
    })
  }

  if (invitation.status !== 'PENDING') {
    throw createError({
      statusCode: 409,
      statusMessage: `This invitation is already ${invitation.status.toLowerCase()}`
    })
  }

  assertInvitationEmailMatchesStudent(invitation.email, profile)

  const { data: klass, error: classError } = await supabase
    .from('classes')
    .select('id, class_name, status')
    .eq('id', invitation.class_id)
    .single()

  if (classError || !klass) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Class not found'
    })
  }

  if (klass.status !== 'ACTIVE') {
    throw createError({
      statusCode: 409,
      statusMessage: 'This class is not currently accepting enrollments'
    })
  }

  const now = new Date().toISOString()

  const { error: enrollmentError } = await supabase
    .from('class_enrollments')
    .upsert(
      {
        class_id: invitation.class_id,
        student_id: profile.id,
        invitation_id: invitation.id,
        status: 'ACTIVE',
        joined_at: now
      },
      {
        onConflict: 'class_id,student_id'
      }
    )

  if (enrollmentError) {
    throw createError({
      statusCode: 500,
      statusMessage: enrollmentError.message
    })
  }

  const { error: invitationError } = await supabase
    .from('class_invitations')
    .update({
      status: 'ACCEPTED',
      accepted_at: now,
      student_user_id: profile.id
    })
    .eq('id', invitation.id)

  if (invitationError) {
    throw createError({
      statusCode: 500,
      statusMessage: invitationError.message
    })
  }

  return {
    success: true,
    class: {
      id: klass.id,
      class_name: klass.class_name
    }
  }
})