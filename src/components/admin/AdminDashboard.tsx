'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SurveyResponse, AdminStats } from '@/types'
import StatsCards from './StatsCards'
import RankingCard from './RankingCard'
import ResponseTable from './ResponseTable'

interface AdminDashboardProps {
  initialResponses: SurveyResponse[]
  initialStats: AdminStats
}

export default function AdminDashboard({ initialResponses, initialStats }: AdminDashboardProps) {
  const router = useRouter()
  const [exporting, setExporting] = useState<'csv' | 'excel' | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'responses'>('stats')

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin')
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    setExporting(format)
    try {
      const res = await fetch(`/api/admin/export?format=${format}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `migaq_responses_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('エクスポートに失敗しました')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="min-h-screen bg-migaq-bg-light">
      {/* Header */}
      <header className="bg-white border-b border-migaq-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-migaq-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-migaq-text">MIGAQ 管理画面</h1>
              <p className="text-xs text-migaq-text-secondary">アンケート集計</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="btn-secondary text-xs py-2 px-3"
            >
              {exporting === 'csv' ? '処理中...' : 'CSV出力'}
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting !== null}
              className="btn-primary text-xs py-2 px-3"
            >
              {exporting === 'excel' ? '処理中...' : 'Excel出力'}
            </button>
            <button onClick={handleLogout} className="btn-secondary text-xs py-2 px-3">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-migaq-primary text-white shadow-sm'
                : 'bg-white text-migaq-text-secondary border border-migaq-border'
            }`}
          >
            集計・分析
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'responses'
                ? 'bg-migaq-primary text-white shadow-sm'
                : 'bg-white text-migaq-text-secondary border border-migaq-border'
            }`}
          >
            回答一覧
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            <StatsCards stats={initialStats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RankingCard
                title="希望サービス ランキング"
                items={initialStats.desiredServicesRanking}
                color="bg-migaq-primary"
              />
              <RankingCard
                title="解約理由 ランキング"
                items={initialStats.cancellationReasonsRanking}
                color="bg-orange-400"
              />
              <RankingCard
                title="通う目的 ランキング"
                items={initialStats.purposesRanking}
                color="bg-blue-400"
              />
              <div className="card">
                <h3 className="font-bold text-migaq-text mb-4">Zoom参加意向</h3>
                <div className="space-y-3">
                  {initialStats.zoomParticipation.map((item) => (
                    <div key={item.option}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-migaq-text">{item.option}</span>
                        <span className="font-semibold text-migaq-primary">
                          {item.count}件 ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-migaq-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-migaq-primary rounded-full transition-all duration-700"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {initialStats.zoomParticipation.length === 0 && (
                    <p className="text-sm text-migaq-text-secondary text-center py-4">データがありません</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="animate-fade-in">
            <ResponseTable responses={initialResponses} />
          </div>
        )}
      </main>
    </div>
  )
}
