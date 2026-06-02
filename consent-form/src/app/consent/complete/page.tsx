'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function CompleteContent() {
  const params = useSearchParams();
  const name = params.get('name') ?? 'お客様';
  const id = params.get('id') ?? '';
  const gdrive = params.get('gdrive') ?? '';
  const pdf = params.get('pdf') ?? '';

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="text-[9px] tracking-[4px] text-muted">MIGAQ IMPRESSION SALON</div>
          <div className="text-base font-serif font-semibold tracking-wide">施術同意書</div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-12 flex flex-col items-center text-center gap-8">
        {/* Checkmark */}
        <div className="w-20 h-20 bg-ink rounded-full flex items-center justify-center flex-shrink-0">
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <path
              d="M3 14L12.5 23.5L33 3"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <p className="text-xs tracking-[3px] text-muted mb-2">CONSENT COMPLETED</p>
          <h1 className="font-serif text-2xl font-semibold mb-3">
            {name} 様<br />ありがとうございます
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            同意書への署名が完了しました。<br />
            PDFはお手元にダウンロードされています。
          </p>
        </div>

        {/* Status */}
        <div className="w-full space-y-3">
          {id && (
            <div className="flex items-center gap-3 text-sm border border-border bg-white px-4 py-3">
              <div className="w-5 h-5 bg-ink flex items-center justify-center flex-shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-zinc-600">Supabaseに保存完了</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm border border-border bg-white px-4 py-3">
            <div className="w-5 h-5 bg-ink flex items-center justify-center flex-shrink-0">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-zinc-600">PDFをダウンロード済み</span>
          </div>

          {gdrive ? (
            <div className="flex items-center gap-3 text-sm border border-border bg-white px-4 py-3">
              <div className="w-5 h-5 bg-ink flex items-center justify-center flex-shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-zinc-600">Google Driveに保存完了</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm border border-border bg-white px-4 py-3 opacity-40">
              <div className="w-5 h-5 border border-border flex items-center justify-center flex-shrink-0" />
              <span className="text-zinc-400">Google Drive（未設定）</span>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="w-full space-y-3">
          {pdf && (
            <a
              href={pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full block text-center"
            >
              PDFを再確認する
            </a>
          )}
          {gdrive && (
            <a
              href={gdrive}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full block text-center"
            >
              Google Driveで開く
            </a>
          )}
          <Link href="/consent" className="btn-primary block text-center">
            新しい同意書を作成
          </Link>
        </div>

        {id && (
          <p className="text-[10px] text-muted">
            記録ID: {id}
          </p>
        )}
      </main>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense>
      <CompleteContent />
    </Suspense>
  );
}
