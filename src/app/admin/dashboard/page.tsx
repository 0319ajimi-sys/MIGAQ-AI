import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase'
import { computeStats } from '@/lib/stats'
import AdminDashboard from '@/components/admin/AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin')
  }

  const supabase = createAdminClient()
  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching responses:', error)
  }

  const allResponses = responses ?? []
  const stats = computeStats(allResponses)

  return <AdminDashboard initialResponses={allResponses} initialStats={stats} />
}
