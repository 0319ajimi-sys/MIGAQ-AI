import type { SurveyResponse, AdminStats, RankingItem } from '@/types'

function countItems(arrays: string[][]): RankingItem[] {
  const counts: Record<string, number> = {}
  for (const arr of arrays) {
    for (const item of arr) {
      if (item) counts[item] = (counts[item] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count)
}

export function computeStats(responses: SurveyResponse[]): AdminStats {
  const total = responses.length

  const satisfactionAverage =
    total === 0
      ? 0
      : responses.reduce((sum, r) => sum + (r.q2_satisfaction ?? 0), 0) / total

  const zoomCounts: Record<string, number> = {}
  for (const r of responses) {
    const opt = r.q4_zoom_participation
    if (opt) zoomCounts[opt] = (zoomCounts[opt] ?? 0) + 1
  }
  const zoomParticipation = Object.entries(zoomCounts).map(([option, count]) => ({
    option,
    count,
    percentage: total === 0 ? 0 : Math.round((count / total) * 100),
  }))

  return {
    totalResponses: total,
    satisfactionAverage: Math.round(satisfactionAverage * 10) / 10,
    zoomParticipation,
    desiredServicesRanking: countItems(responses.map((r) => r.q3_desired_services)),
    cancellationReasonsRanking: countItems(responses.map((r) => r.q6_cancellation_reasons)),
    purposesRanking: countItems(responses.map((r) => r.q1_purposes)),
  }
}
