'use client'

interface TextQuestionProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function TextQuestion({ value, onChange, placeholder }: TextQuestionProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? '自由にお書きください'}
      rows={5}
      className="w-full p-4 rounded-xl border-2 border-migaq-border bg-white text-sm text-migaq-text placeholder-migaq-text-secondary focus:outline-none focus:border-migaq-primary focus:ring-2 focus:ring-migaq-primary/20 resize-none transition-colors leading-relaxed"
    />
  )
}
