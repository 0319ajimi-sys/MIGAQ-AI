'use client'

import { useState } from 'react'
import type { SurveyResponse } from '@/types'

interface ResponseTableProps {
  responses: SurveyResponse[]
}

const SATISFACTION_LABELS: Record<number, string> = {
  5: '非常に満足',
  4: '満足',
  3: '普通',
  2: 'やや不満',
  1: '不満',
}

export default function ResponseTable({ responses }: ResponseTableProps) {
  const [selected, setSelected] = useState<SurveyResponse | null>(null)

  if (responses.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-migaq-text-secondary">まだ回答がありません</p>
      </div>
    )
  }

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-migaq-bg-light border-b border-migaq-border">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-migaq-text-secondary whitespace-nowrap">回答日時</th>
                <th className="text-left p-3 text-xs font-semibold text-migaq-text-secondary whitespace-nowrap">満足度</th>
                <th className="text-left p-3 text-xs font-semibold text-migaq-text-secondary whitespace-nowrap">Zoom参加</th>
                <th className="text-left p-3 text-xs font-semibold text-migaq-text-secondary whitespace-nowrap">詳細</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-migaq-border last:border-0 hover:bg-migaq-bg-light transition-colors">
                  <td className="p-3 text-migaq-text-secondary whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.q2_satisfaction >= 4 ? 'bg-green-100 text-green-700' :
                      r.q2_satisfaction === 3 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {r.q2_satisfaction} {SATISFACTION_LABELS[r.q2_satisfaction]}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-migaq-text max-w-xs truncate">
                    {r.q4_zoom_participation || '-'}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelected(r)}
                      className="text-xs text-migaq-primary font-semibold hover:underline"
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-migaq-text">回答詳細</h3>
              <button onClick={() => setSelected(null)} className="text-migaq-text-secondary text-xl leading-none">×</button>
            </div>
            <div className="space-y-4 text-sm">
              <DetailRow label="回答日時" value={new Date(selected.created_at).toLocaleString('ja-JP')} />
              <DetailRow label="Q1 通う目的" value={[...selected.q1_purposes, selected.q1_other].filter(Boolean).join('、')} />
              <DetailRow label="Q2 満足度" value={`${selected.q2_satisfaction} - ${SATISFACTION_LABELS[selected.q2_satisfaction]}`} />
              {selected.q2_reason && <DetailRow label="Q2 理由" value={selected.q2_reason} />}
              <DetailRow label="Q3 希望サービス" value={[...selected.q3_desired_services, selected.q3_other].filter(Boolean).join('、')} />
              <DetailRow label="Q4 Zoom参加" value={selected.q4_zoom_participation || '-'} />
              <DetailRow label="Q5 Zoomテーマ" value={[...selected.q5_zoom_themes, selected.q5_other].filter(Boolean).join('、')} />
              <DetailRow label="Q6 解約理由" value={[...selected.q6_cancellation_reasons, selected.q6_other].filter(Boolean).join('、')} />
              {selected.q7_retention_services && <DetailRow label="Q7 継続のための希望" value={selected.q7_retention_services} />}
              {selected.q8_feedback && <DetailRow label="Q8 ご意見・ご要望" value={selected.q8_feedback} />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-migaq-text-secondary mb-1">{label}</p>
      <p className="text-migaq-text leading-relaxed">{value || '-'}</p>
    </div>
  )
}
