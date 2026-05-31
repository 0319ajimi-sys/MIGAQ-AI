import Link from 'next/link'

export default function CompletePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-migaq-primary/20 to-migaq-bg-light">
      <div className="w-full max-w-md animate-scale-in">
        <div className="card text-center py-10">
          {/* Checkmark icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-migaq-primary mb-6 shadow-lg mx-auto">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-migaq-text mb-4">
            ありがとうございました！
          </h1>
          <p className="text-migaq-text-secondary leading-relaxed mb-2">
            印象改善にご協力いただきありがとうございます(^^)
          </p>
          <p className="text-sm text-migaq-text-secondary leading-relaxed mb-8">
            いただいたご意見は、より良いサービスのために活用させていただきます。
            引き続きMIGAQをよろしくお願いいたします。
          </p>

          <div className="pt-4 border-t border-migaq-border">
            <Link href="/" className="btn-secondary inline-block">
              トップページへ戻る
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-migaq-primary shadow">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <p className="text-xs text-migaq-text-secondary mt-2">MIGAQ 第一印象改善サロン</p>
        </div>
      </div>
    </main>
  )
}
