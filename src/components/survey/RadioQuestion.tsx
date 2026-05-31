'use client'

import { cn } from '@/lib/utils'

interface RadioQuestionProps {
  options: string[]
  selected: string
  onChange: (value: string) => void
}

export default function RadioQuestion({ options, selected, onChange }: RadioQuestionProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selected === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn('radio-item w-full text-left', isSelected && 'selected')}
          >
            <span
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150',
                isSelected ? 'border-migaq-primary' : 'border-migaq-border bg-white'
              )}
            >
              {isSelected && (
                <span className="w-2.5 h-2.5 rounded-full bg-migaq-primary block" />
              )}
            </span>
            <span className="text-sm font-medium text-migaq-text">{option}</span>
          </button>
        )
      })}
    </div>
  )
}
