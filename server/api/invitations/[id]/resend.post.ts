import { createError, getRouterParam } from 'h3'
import { requireInstructor } from '#server/utils/class-auth'
import {
  assertInvitationOwnedByInstructor,
  buildInvitationExpiry,
  buildInvitationUrl,
  generateInvitationToken
} from '#server/utils/class-invitations'

export default defineEventHandler(async (event) => {
  const { authUser } = await requireInstructor(event)
  const invitationId = getRouterParam(event, 'id')

  if (!invitationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing invitation id'
    })
  }

  const { supabase, invitation } = await assertInvitationOwnedByInstructor(invitationId, authUser.id)

  if (invitation.status === 'ACCEPTED') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Accepted invitations cannot be resent'
    })
  }

  const { rawToken, tokenHash } = generateInvitationToken()
  const expiresAt = buildInvitationExpiry(7)

  const { data, error } = await supabase
    .from('class_invitations')
    .update({
      token_hash: tokenHash,
      expires_at: expiresAt,
      status: 'PENDING',
      accepted_at: null
    })
    .eq('id', invitation.id)
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