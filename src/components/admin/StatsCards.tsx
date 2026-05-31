import type { AdminStats } from '@/types'

interface StatsCardsProps {
  stats: AdminStats
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card text-center">
      <p className="text-xs text-migaq-text-secondary mb-1">{label}</p>
      <p className="text-3xl font-bold text-migaq-primary">{value}</p>
      {sub && <p className="text-xs text-migaq-text-secondary mt-1">{sub}</p>}
    </div>
  )
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const positiveZoom = stats.zoomParticipation
    .filter((z) => z.option === 'ぜひ参加したい' || z.option === '内容次第で参加したい')
    .reduce((sum, z) => sum + z.count, 0)
  const zoomRate = stats.totalResponses === 0 ? 0 : Math.round((positiveZoom / stats.totalResponses) * 100)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard label="総回答数" value={`${stats.totalResponses}件`} />
      <StatCard
        label="満足度平均"
        value={stats.totalResponses === 0 ? '-' : `${stats.satisfactionAverage}`}
        sub="/ 5.0"
      />
      <StatCard
        label="Zoom参加希望率"
        value={`${zoomRate}%`}
        sub="（参加したい＋内容次第）"
      />
    </div>
  )
}
