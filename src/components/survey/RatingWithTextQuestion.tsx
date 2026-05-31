'use client'

import { cn } from '@/lib/utils'

interface RatingWithTextQuestionProps {
  options: string[] // labels for 5 down to 1
  ratingValue: number
  textValue: string
  onRatingChange: (value: number) => void
  onTextChange: (value: string) => void
}

const RATING_COLORS = [
  'bg-green-500 border-green-500',
  'bg-green-400 border-green-400',
  'bg-yellow-400 border-yellow-400',
  'bg-orange-400 border-orange-400',
  'bg-red-400 border-red-400',
]

export default function RatingWithTextQuestion({
  options,
  ratingValue,
  textValue,
  onRatingChange,
  onTextChange,
}: RatingWithTextQuestionProps) {
  return (
    <div className="space-y-6">
      {/* Rating buttons: 5 (index 0) = 非常に満足, 1 (index 4) = 不満 */}
      <div className="space-y-3">
        {options.map((label, index) => {
          const score = 5 - index
          const isSelected = ratingValue === score
          return (
            <button
              key={score}
              type="button"
              onClick={() => onRatingChange(score)}
              className={cn(
                'radio-item w-full text-left',
                isSelected && 'selected'
              )}
            >
              <span
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-150',
                  isSelected
                    ? cn(RATING_COLORS[index], 'text-white')
                    : 'border-migaq-border bg-white text-migaq-text-secondary'
                )}
              >
                {score}
              </span>
              <span className="text-sm font-medium text-migaq-text">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Free text for reason */}
      <div>
        <label className="block text-sm font-medium text-migaq-text-secondary mb-2">
          理由（任意）
        </label>
        <textarea
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="理由や詳しいご意見をお書きください"
          rows={3}
          className="w-full p-3 rounded-xl border-2 border-migaq-border bg-white text-sm text-migaq-text placeholder-migaq-text-secondary focus:outline-none focus:border-migaq-primary focus:ring-2 focus:ring-migaq-primary/20 resize-none transition-colors"
        />
      </div>
    </div>
  )
}
