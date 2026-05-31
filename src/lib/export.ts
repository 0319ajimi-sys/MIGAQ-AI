import * as XLSX from 'xlsx'
import type { SurveyResponse } from '@/types'

const HEADERS = [
  'ID',
  '回答日時',
  '通う目的',
  '通う目的（その他）',
  '満足度（1-5）',
  '満足度理由',
  '希望サービス',
  '希望サービス（その他）',
  'Zoom参加意向',
  'Zoomテーマ',
  'Zoomテーマ（その他）',
  '解約理由',
  '解約理由（その他）',
  '継続のための希望サービス',
  'ご意見・ご要望',
]

function responseToRow(r: SurveyResponse): string[] {
  return [
    r.id,
    new Date(r.created_at).toLocaleString('ja-JP'),
    r.q1_purposes.join('、'),
    r.q1_other ?? '',
    String(r.q2_satisfaction ?? ''),
    r.q2_reason ?? '',
    r.q3_desired_services.join('、'),
    r.q3_other ?? '',
    r.q4_zoom_participation ?? '',
    r.q5_zoom_themes.join('、'),
    r.q5_other ?? '',
    r.q6_cancellation_reasons.join('、'),
    r.q6_other ?? '',
    r.q7_retention_services ?? '',
    r.q8_feedback ?? '',
  ]
}

export function generateCSV(responses: SurveyResponse[]): string {
  const rows = [HEADERS, ...responses.map(responseToRow)]
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n')
}

export function generateExcel(responses: SurveyResponse[]): Buffer {
  const wb = XLSX.utils.book_new()
  const wsData = [HEADERS, ...responses.map(responseToRow)]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws['!cols'] = [
    { wch: 38 }, { wch: 20 }, { wch: 40 }, { wch: 20 },
    { wch: 12 }, { wch: 40 }, { wch: 40 }, { wch: 20 },
    { wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 40 },
    { wch: 20 }, { wch: 40 }, { wch: 40 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, '回答一覧')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
