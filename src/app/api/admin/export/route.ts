import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { createAdminClient } from '@/lib/supabase'
import { generateCSV, generateExcel } from '@/lib/export'

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'csv'

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const responses = data ?? []

  if (format === 'excel') {
    const buffer = generateExcel(responses)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="migaq_responses_${Date.now()}.xlsx"`,
      },
    })
  }

  const csv = generateCSV(responses)
  const bom = '﻿' // BOM for Excel compatibility
  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="migaq_responses_${Date.now()}.csv"`,
    },
  })
}
