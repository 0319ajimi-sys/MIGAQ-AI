import type { RankingItem } from '@/types'

interface RankingCardProps {
  title: string
  items: RankingItem[]
  color?: string
}

export default function RankingCard({ title, items, color = 'bg-migaq-primary' }: RankingCardProps) {
  const max = items[0]?.count ?? 1

  return (
    <div className="card">
      <h3 className="font-bold text-migaq-text mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-migaq-text-secondary text-center py-4">データがありません</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 7).map((item, index) => (
            <div key={item.item} className="flex items-center gap-2">
              <span className="text-xs font-bold text-migaq-text-secondary w-5 text-right flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-migaq-text truncate">{item.item}</span>
                  <span className="text-xs font-semibold text-migaq-text-secondary ml-2 flex-shrink-0">
                    {item.count}件
                  </span>
                </div>
                <div className="h-1.5 bg-migaq-border rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.round((item.count / max) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
