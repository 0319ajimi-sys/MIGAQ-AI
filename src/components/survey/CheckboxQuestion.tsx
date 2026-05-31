'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxQuestionProps {
  options: string[]
  hasOtherOption?: boolean
  selected: string[]
  otherValue: string
  onChange: (selected: string[], other: string) => void
}

export default function CheckboxQuestion({
  options,
  hasOtherOption,
  selected,
  otherValue,
  onChange,
}: CheckboxQuestionProps) {
  const [showOtherInput, setShowOtherInput] = useState(selected.includes('その他'))

  const toggle = (option: string) => {
    if (option === 'その他') {
      const newShowOther = !showOtherInput
      setShowOtherInput(newShowOther)
      if (newShowOther) {
        onChange([...selected, 'その他'], otherValue)
      } else {
        onChange(selected.filter((s) => s !== 'その他'), '')
      }
      return
    }
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option), otherValue)
    } else {
      onChange([...selected, option], otherValue)
    }
  }

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn('checkbox-item w-full text-left', isSelected && 'selected')}
          >
            <span
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150',
                isSelected
                  ? 'bg-migaq-primary border-migaq-primary'
                  : 'border-migaq-border bg-white'
              )}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm font-medium text-migaq-text">{option}</span>
          </button>
        )
      })}

      {hasOtherOption && (
        <>
          <button
            type="button"
            onClick={() => toggle('その他')}
            className={cn('checkbox-item w-full text-left', showOtherInput && 'selected')}
          >
            <span
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150',
                showOtherInput
                  ? 'bg-migaq-primary border-migaq-primary'
                  : 'border-migaq-border bg-white'
              )}
            >
              {showOtherInput && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm font-medium text-migaq-text">その他</span>
          </button>

          {showOtherInput && (
            <input
              type="text"
              value={otherValue}
              onChange={(e) => onChange(selected, e.target.value)}
              placeholder="その他の内容を入力してください"
              className="w-full p-3 rounded-xl border-2 border-migaq-primary bg-migaq-bg-light text-sm text-migaq-text placeholder-migaq-text-secondary focus:outline-none focus:ring-2 focus:ring-migaq-primary/30"
            />
          )}
        </>
      )}
    </div>
  )
}
