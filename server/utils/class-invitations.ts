import { createHash, randomBytes } from 'node:crypto'
import { createError, type H3Event } from 'h3'
import { getOwnedClassOrThrow, getSupabaseAdmin, type AppProfile } from '#server/utils/class-auth'

export function hashInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateInvitationToken() {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashInvitationToken(rawToken)

  return {
    rawToken,
    tokenHash
  }
}

export function buildInvitationUrl(token: string) {
  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  return `${siteUrl}/student/invitations/accept?token=${encodeURIComponent(token)}`
}

export function buildInvitationExpiry(days = 7) {
  const expires = new Date()
  expires.setDate(expires.getDate() + days)
  return expires.toISOString()
}

export function isExpired(value: string | Date) {
  return new Date(value).getTime() < Date.now()
}

export async function getInvitationByIdOrThrow(invitationId: string) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('class_invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invitation not found'
    })
  }

  return data
}

export async function getInvitationByTokenOrThrow(token: string) {
  const supabase = getSupabaseAdmin()
  const tokenHash = hashInvitationToken(token)

  const { data, error } = await supabase
    .from('class_invitations')
    .select('*')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid invitation link'
    })
  }

  return data
}

export async function assertInvitationOwnedByInstructor(
  invitationId: string,
  instructorId: string
) {
  const supabase = getSupabaseAdmin()
  const invitation = await getInvitationByIdOrThrow(invitationId)

  await getOwnedClassOrThrow(supabase, invitation.class_id, instructorId)

  return {
    supabase,
    invitation
  }
}

export async function expireInvitationIfNeeded(invitationId: string, expiresAt: string) {
  if (!isExpired(expiresAt)) return

  const supabase = getSupabaseAdmin()

  await supabase
    .from('class_invitations')
    .update({ status: 'EXPIRED' })
    .eq('id', invitationId)
    .eq('status', 'PENDING')
}

export function assertInvitationEmailMatchesStudent(
  invitationEmail: string,
  profile: AppProfile
) {
  const studentEmail = String(profile.email || '').trim().toLowerCase()

  if (!studentEmail || studentEmail !== invitationEmail.trim().toLowerCase()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'This invitation is not assigned to your student account'
    })
  }
}