import { createError, getRouterParam } from 'h3'
import { getOwnedClassOrThrow, requireInstructor } from '#server/utils/class-auth'

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

  const [
    activeStudentsRes,
    pendingInvitesRes,
    sessionCountRes
  ] = await Promise.all([
    supabase
      .from('class_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('status', 'ACTIVE'),

    supabase
      .from('class_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('status', 'PENDING'),

    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
  ])

  return {
    success: true,
    class: {
      ...klass,
      active_students_count: activeStudentsRes.count ?? 0,
      pending_invitations_count: pendingInvitesRes.count ?? 0,
      sessions_count: sessionCountRes.count ?? 0
    }
  }
})