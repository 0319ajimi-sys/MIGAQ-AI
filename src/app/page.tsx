import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-migaq-primary/20 to-migaq-bg-light">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-migaq-primary mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">M</span>
          </div>
          <h1 className="text-2xl font-bold text-migaq-text tracking-wide">MIGAQ</h1>
          <p className="text-sm text-migaq-text-secondary mt-1">第一印象改善サロン</p>
        </div>

        {/* Card */}
        <div className="card text-center">
          <h2 className="text-xl font-bold text-migaq-text mb-3">会員アンケート</h2>
          <p className="text-sm text-migaq-text-secondary mb-2 leading-relaxed">
            いつもMIGAQをご利用いただきありがとうございます。
          </p>
          <p className="text-sm text-migaq-text-secondary mb-6 leading-relaxed">
            より良いサービスのため、ぜひご意見をお聞かせください。
            所要時間は約3分です。
          </p>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-migaq-text-secondary mb-2">
              <span className="w-2 h-2 rounded-full bg-migaq-primary inline-block"></span>
              <span>全8問・約3分</span>
              <span className="w-2 h-2 rounded-full bg-migaq-primary inline-block ml-2"></span>
              <span>個人情報不要</span>
            </div>
            <Link href="/survey" className="btn-primary w-full text-center block">
              アンケートに回答する
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-migaq-text-secondary mt-6">
          回答内容はサービス改善のみに使用します
        </p>
      </div>
    </main>
  )
}
