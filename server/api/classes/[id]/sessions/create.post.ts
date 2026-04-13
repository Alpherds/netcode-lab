import { createError, getRouterParam, readBody } from 'h3'
import {
  getOwnedClassOrThrow,
  normalizeOptionalText,
  normalizeRequiredText,
  requireInstructor
} from '#server/utils/class-auth'

function normalizeScheduledAt(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid scheduled_at value'
    })
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'scheduled_at must be a valid date'
    })
  }

  return parsed.toISOString()
}

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)
  const classId = getRouterParam(event, 'id')

  if (!classId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing class id'
    })
  }

  const klass = await getOwnedClassOrThrow(supabase, classId, authUser.id)

  if (klass.status !== 'ACTIVE') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cannot create sessions for an archived class'
    })
  }

  const body = await readBody(event)

  const title = normalizeRequiredText(body.title, 'title', 150)
  const description = normalizeOptionalText(body.description, 1000)
  const scheduledAt = normalizeScheduledAt(body.scheduled_at)

  const sessionCode = crypto.randomUUID().slice(0, 8).toUpperCase()

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      class_id: classId,
      instructor_id: authUser.id,
      title,
      description,
      session_code: sessionCode,
      scheduled_at: scheduledAt,
      status: 'CREATED'
    })
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
      updated_at
    `)
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    session: data
  }
})