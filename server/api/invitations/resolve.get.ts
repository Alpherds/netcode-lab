import { createError, getQuery } from 'h3'
import { requireStudent } from '#server/utils/class-auth'
import {
  assertInvitationEmailMatchesStudent,
  expireInvitationIfNeeded,
  getInvitationByTokenOrThrow
} from '#server/utils/class-invitations'

export default defineEventHandler(async (event) => {
  const { supabase, profile } = await requireStudent(event)
  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token.trim() : ''

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing invitation token'
    })
  }

  const invitation = await getInvitationByTokenOrThrow(token)
  await expireInvitationIfNeeded(invitation.id, invitation.expires_at)

  const { data: refreshedInvitation, error: invitationError } = await supabase
    .from('class_invitations')
    .select('*')
    .eq('id', invitation.id)
    .single()

  if (invitationError || !refreshedInvitation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invitation not found'
    })
  }

  assertInvitationEmailMatchesStudent(refreshedInvitation.email, profile)

  const { data: klass, error: classError } = await supabase
    .from('classes')
    .select('id, class_name, class_code, status, instructor_id')
    .eq('id', refreshedInvitation.class_id)
    .single()

  if (classError || !klass) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Class not found'
    })
  }

  const { data: instructor } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', klass.instructor_id)
    .single()

  return {
    success: true,
    invitation: {
      id: refreshedInvitation.id,
      email: refreshedInvitation.email,
      status: refreshedInvitation.status,
      expires_at: refreshedInvitation.expires_at,
      class_id: klass.id,
      class_name: klass.class_name,
      class_code: klass.class_code,
      class_status: klass.status,
      instructor_name: instructor?.full_name || 'Instructor'
    }
  }
})