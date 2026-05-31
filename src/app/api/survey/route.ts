import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import type { SurveyFormData } from '@/types'

export async function POST(request: Request) {
  try {
    const body: SurveyFormData = await request.json()

    if (!body.q1_purposes?.length) {
      return NextResponse.json({ error: 'Q1は必須です' }, { status: 400 })
    }
    if (!body.q2_satisfaction || body.q2_satisfaction < 1 || body.q2_satisfaction > 5) {
      return NextResponse.json({ error: 'Q2は必須です' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('survey_responses').insert({
      q1_purposes: body.q1_purposes,
      q1_other: body.q1_other ?? '',
      q2_satisfaction: body.q2_satisfaction,
      q2_reason: body.q2_reason ?? '',
      q3_desired_services: body.q3_desired_services ?? [],
      q3_other: body.q3_other ?? '',
      q4_zoom_participation: body.q4_zoom_participation ?? '',
      q5_zoom_themes: body.q5_zoom_themes ?? [],
      q5_other: body.q5_other ?? '',
      q6_cancellation_reasons: body.q6_cancellation_reasons ?? [],
      q6_other: body.q6_other ?? '',
      q7_retention_services: body.q7_retention_services ?? '',
      q8_feedback: body.q8_feedback ?? '',
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'データの保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Survey API error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
