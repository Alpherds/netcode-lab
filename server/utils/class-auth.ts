import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { createError, getHeader, type H3Event } from 'h3'

type AppRole = 'INSTRUCTOR' | 'STUDENT'

interface AppProfile {
  id: string
  full_name: string
  role: AppRole
}

interface InstructorContext {
  supabase: SupabaseClient
  authUser: User
  profile: AppProfile
}

export function getSupabaseAdmin(): SupabaseClient {
  const config = useRuntimeConfig()

  if (!config.SUPABASE_URL) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing SUPABASE_URL'
    })
  }

  if (!config.SUPABASE_SERVICE_ROLE_KEY) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing SUPABASE_SERVICE_ROLE_KEY'
    })
  }

  return createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
}

export async function requireInstructor(event: H3Event): Promise<InstructorContext> {
  const supabase = getSupabaseAdmin()

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid Authorization header'
    })
  }

  const token = authHeader.replace('Bearer ', '').trim()

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    throw createError({
      statusCode: 403,
      statusMessage: 'User profile not found'
    })
  }

  if (profile.role !== 'INSTRUCTOR') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Instructor access required'
    })
  }

  return {
    supabase,
    authUser: authData.user,
    profile
  }
}

export async function getOwnedClassOrThrow(
  supabase: SupabaseClient,
  classId: string,
  instructorId: string
) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .eq('instructor_id', instructorId)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Class not found'
    })
  }

  return data
}

export function normalizeRequiredText(
  value: unknown,
  fieldName: string,
  maxLength = 150
): string {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} is required`
    })
  }

  const normalized = value.trim()

  if (!normalized) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} is required`
    })
  }

  if (normalized.length > maxLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} must be at most ${maxLength} characters`
    })
  }

  return normalized
}

export function normalizeOptionalText(
  value: unknown,
  maxLength = 1000
): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid text value'
    })
  }

  const normalized = value.trim()

  if (!normalized) return null

  if (normalized.length > maxLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `Text must be at most ${maxLength} characters`
    })
  }

  return normalized
}

export function normalizeClassCode(value: unknown): string {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'class_code is required'
    })
  }

  const normalized = value.trim().toUpperCase()

  if (!normalized) {
    throw createError({
      statusCode: 400,
      statusMessage: 'class_code is required'
    })
  }

  if (normalized.length > 30) {
    throw createError({
      statusCode: 400,
      statusMessage: 'class_code must be at most 30 characters'
    })
  }

  return normalized
}