interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-migaq-text-secondary font-medium">
          質問 {current} / {total}
        </span>
        <span className="text-xs text-migaq-primary font-semibold">{percentage}%</span>
      </div>
      <div className="h-2 bg-migaq-border rounded-full overflow-hidden">
        <div
          className="h-full bg-migaq-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
