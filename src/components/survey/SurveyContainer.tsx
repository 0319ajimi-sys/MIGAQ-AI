'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { questions, TOTAL_QUESTIONS } from '@/lib/questions'
import type { SurveyFormData } from '@/types'
import ProgressBar from './ProgressBar'
import CheckboxQuestion from './CheckboxQuestion'
import RadioQuestion from './RadioQuestion'
import RatingWithTextQuestion from './RatingWithTextQuestion'
import TextQuestion from './TextQuestion'
import { cn } from '@/lib/utils'

const INITIAL_DATA: SurveyFormData = {
  q1_purposes: [],
  q1_other: '',
  q2_satisfaction: 0,
  q2_reason: '',
  q3_desired_services: [],
  q3_other: '',
  q4_zoom_participation: '',
  q5_zoom_themes: [],
  q5_other: '',
  q6_cancellation_reasons: [],
  q6_other: '',
  q7_retention_services: '',
  q8_feedback: '',
}

function isStepValid(step: number, data: SurveyFormData): boolean {
  switch (step) {
    case 0: return data.q1_purposes.length > 0
    case 1: return data.q2_satisfaction > 0
    case 2: return data.q3_desired_services.length > 0
    case 3: return data.q4_zoom_participation !== ''
    case 4: return data.q5_zoom_themes.length > 0
    case 5: return data.q6_cancellation_reasons.length > 0
    case 6: return true
    case 7: return true
    default: return false
  }
}

export default function SurveyContainer() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [entering, setEntering] = useState(true)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [data, setData] = useState<SurveyFormData>(INITIAL_DATA)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const question = questions[currentStep]

  const navigate = useCallback((dir: 'forward' | 'backward', newStep: number) => {
    setDirection(dir)
    setEntering(false)
    setTimeout(() => {
      setCurrentStep(newStep)
      setDirection(dir)
      setEntering(true)
    }, 200)
  }, [])

  const handleNext = useCallback(async () => {
    if (currentStep < TOTAL_QUESTIONS - 1) {
      navigate('forward', currentStep + 1)
    } else {
      setSubmitting(true)
      setError('')
      try {
        const res = await fetch('/api/survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? '送信に失敗しました')
        }
        router.push('/complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
        setSubmitting(false)
      }
    }
  }, [currentStep, data, navigate, router])

  const handleBack = useCallback(() => {
    if (currentStep > 0) navigate('backward', currentStep - 1)
  }, [currentStep, navigate])

  const isLast = currentStep === TOTAL_QUESTIONS - 1
  const canProceed = isStepValid(currentStep, data)

  const renderQuestion = () => {
    switch (question.id) {
      case 'q1':
        return (
          <CheckboxQuestion
            options={question.options!}
            hasOtherOption={question.hasOtherOption}
            selected={data.q1_purposes}
            otherValue={data.q1_other}
            onChange={(selected, other) =>
              setData((p) => ({ ...p, q1_purposes: selected, q1_other: other }))
            }
          />
        )
      case 'q2':
        return (
          <RatingWithTextQuestion
            options={question.options!}
            ratingValue={data.q2_satisfaction}
            textValue={data.q2_reason}
            onRatingChange={(v) => setData((p) => ({ ...p, q2_satisfaction: v }))}
            onTextChange={(v) => setData((p) => ({ ...p, q2_reason: v }))}
          />
        )
      case 'q3':
        return (
          <CheckboxQuestion
            options={question.options!}
            hasOtherOption={question.hasOtherOption}
            selected={data.q3_desired_services}
            otherValue={data.q3_other}
            onChange={(selected, other) =>
              setData((p) => ({ ...p, q3_desired_services: selected, q3_other: other }))
            }
          />
        )
      case 'q4':
        return (
          <RadioQuestion
            options={question.options!}
            selected={data.q4_zoom_participation}
            onChange={(v) => setData((p) => ({ ...p, q4_zoom_participation: v }))}
          />
        )
      case 'q5':
        return (
          <CheckboxQuestion
            options={question.options!}
            hasOtherOption={question.hasOtherOption}
            selected={data.q5_zoom_themes}
            otherValue={data.q5_other}
            onChange={(selected, other) =>
              setData((p) => ({ ...p, q5_zoom_themes: selected, q5_other: other }))
            }
          />
        )
      case 'q6':
        return (
          <CheckboxQuestion
            options={question.options!}
            hasOtherOption={question.hasOtherOption}
            selected={data.q6_cancellation_reasons}
            otherValue={data.q6_other}
            onChange={(selected, other) =>
              setData((p) => ({ ...p, q6_cancellation_reasons: selected, q6_other: other }))
            }
          />
        )
      case 'q7':
        return (
          <TextQuestion
            value={data.q7_retention_services}
            onChange={(v) => setData((p) => ({ ...p, q7_retention_services: v }))}
          />
        )
      case 'q8':
        return (
          <TextQuestion
            value={data.q8_feedback}
            onChange={(v) => setData((p) => ({ ...p, q8_feedback: v }))}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-migaq-primary/10 to-migaq-bg-light">
      <header className="bg-white border-b border-migaq-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-migaq-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">M</span>
        </div>
        <div className="flex-1">
          <ProgressBar current={currentStep + 1} total={TOTAL_QUESTIONS} />
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 pb-28 max-w-lg mx-auto w-full">
        <div
          className={cn(
            'flex-1 mt-4 transition-all duration-200',
            entering && direction === 'forward' && 'animate-slide-in-right',
            entering && direction === 'backward' && 'animate-slide-in-left',
            !entering && 'opacity-0'
          )}
          key={currentStep}
        >
          <div className="mb-6">
            <span className="inline-block bg-migaq-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              Q{question.number}
            </span>
            <h2 className="text-lg font-bold text-migaq-text leading-snug">{question.text}</h2>
            {question.subtext && (
              <p className="text-sm text-migaq-text-secondary mt-1">{question.subtext}</p>
            )}
          </div>

          <div className="card">{renderQuestion()}</div>

          {error && (
            <p className="mt-4 text-sm text-red-500 text-center bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-migaq-border p-4 shadow-lg">
        <div className={cn('flex gap-3 max-w-lg mx-auto', currentStep === 0 && 'justify-center')}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              ← 戻る
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className={cn('btn-primary', currentStep === 0 ? 'w-full max-w-xs' : 'flex-1')}
          >
            {submitting ? '送信中...' : isLast ? '回答を送信する' : '次へ →'}
          </button>
        </div>
      </footer>
    </div>
  )
}
