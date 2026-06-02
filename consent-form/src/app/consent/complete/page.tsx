'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function Content() {
  const params = useSearchParams();
  const name = params.get('name') ?? 'お客様';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="bg-white border-b border-[#E8E8E8]">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="text-[9px] tracking-[5px] text-[#BBBBBB] mb-0.5">MIGAQ IMPRESSION SALON</div>
          <div className="font-serif text-[17px] font-semibold tracking-wider">施術同意書</div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-16 flex flex-col items-center gap-10">
        {/* アイコン */}
        <div className="w-20 h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center shrink-0">
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <path d="M3 14L12.5 23.5L33 3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* メッセージ */}
        <div className="text-center">
          <p className="text-[10px] tracking-[4px] text-[#9E9E9E] mb-3">CONSENT COMPLETED</p>
          <h1 className="font-serif text-2xl font-semibold mb-3">
            {name} 様<br />ありがとうございます
          </h1>
          <p className="text-sm text-[#9E9E9E] leading-relaxed">
            同意書への署名が完了しました。<br />
            PDFはお手元にダウンロードされています。
          </p>
        </div>

        {/* ステータス */}
        <div className="w-full space-y-2.5">
          {(['Supabaseに保存完了', 'PDFダウンロード完了'] as const).map(label => (
            <div key={label} className="flex items-center gap-3 bg-white border border-[#E0E0E0] px-4 py-3 text-sm">
              <span className="w-5 h-5 bg-[#0A0A0A] flex items-center justify-center shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[#555]">{label}</span>
            </div>
          ))}
        </div>

        <Link
          href="/consent"
          className="w-full bg-[#0A0A0A] text-white text-center py-4 text-sm font-medium tracking-widest hover:bg-[#333] transition-colors"
        >
          新しい同意書を作成
        </Link>
      </main>
    </div>
  );
}

export default function CompletePage() {
  return <Suspense><Content /></Suspense>;
}
