import { createError, readBody } from 'h3'
import {
  normalizeClassCode,
  normalizeOptionalText,
  normalizeRequiredText,
  requireInstructor
} from '#server/utils/class-auth'

export default defineEventHandler(async (event) => {
  const { supabase, authUser } = await requireInstructor(event)
  const body = await readBody(event)

  const class_name = normalizeRequiredText(body.class_name, 'class_name', 150)
  const class_code = normalizeClassCode(body.class_code)
  const description = normalizeOptionalText(body.description, 1000)

  const { data, error } = await supabase
    .from('classes')
    .insert({
      instructor_id: authUser.id,
      class_name,
      class_code,
      description,
      status: 'ACTIVE'
    })
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