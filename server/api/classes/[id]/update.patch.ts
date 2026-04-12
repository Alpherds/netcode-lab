 import { createError, getRouterParam, readBody } from 'h3'
import {
  getOwnedClassOrThrow,
  normalizeClassCode,
  normalizeOptionalText,
  normalizeRequiredText,
  requireInstructor
} from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)
  const classId = getRouterParam(event, 'id')

  if (!classId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing class id'
    })
  }

  const existing = await getOwnedClassOrThrow(supabase, classId, authUser.id)
  const body = await readBody(event)

  const updates: Record<string, unknown> = {}

  if (body.class_name !== undefined) {
    updates.class_name = normalizeRequiredText(body.class_name, 'class_name', 150)
  }

  if (body.class_code !== undefined) {
    updates.class_code = normalizeClassCode(body.class_code)
  }

  if (body.description !== undefined) {
    updates.description = normalizeOptionalText(body.description, 1000)
  }

  if (!Object.keys(updates).length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No fields to update'
    })
  }

  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', existing.id)
    .eq('instructor_id', authUser.id)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Class code already exists'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return {
    success: true,
    class: data
  }
})