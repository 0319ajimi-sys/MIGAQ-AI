'use client';

import { useState, useRef, ChangeEvent } from 'react';
import SignaturePad, { type SignaturePadRef } from '@/components/SignaturePad';

// ─── 型 ───────────────────────────────────────────────────────────────────────

interface History {
  blackDye: boolean;
  bleach: boolean;
  straightening: boolean;
  selfColor: boolean;
}

// ─── リスク自動生成 ───────────────────────────────────────────────────────────

function calcRisk(
  h: History,
  desiredColor: string,
): { level: 'none' | 'low' | 'medium' | 'high'; specific: string[] } {
  const specific: string[] = [];
  let score = 0;

  const c = desiredColor.toLowerCase();
  const wantsBleach =
    c.includes('ブリーチ') || c.includes('明るい') ||
    c.includes('ハイトーン') || c.includes('金') || c.includes('白');

  if (h.blackDye) {
    score += 3;
    specific.push(
      '黒染め履歴があります。明るいカラー・ブリーチ施術では色が均一に入らず、オレンジや緑がかった色が残る可能性があります。'
    );
    if (wantsBleach) {
      score += 2;
      specific.push(
        '希望カラーに対して黒染め履歴のリスクが高い状態です。1回の施術で到達できない場合があり、複数回の施術が必要になることがあります。'
      );
    }
  }
  if (h.bleach) {
    score += 2;
    specific.push(
      'ブリーチ履歴があります。毛髪がダメージを受けており、断毛・切れ毛・チリつきのリスクがあります。'
    );
  }
  if (h.straightening) {
    score += 2;
    specific.push(
      '縮毛矯正の履歴があります。薬剤の化学的相互作用により、パーマ・カラーの仕上がりが予想と異なる場合があります。'
    );
  }
  if (h.selfColor) {
    score += 1;
    specific.push(
      'セルフカラーの履歴があります。使用した染料の残留により、サロンカラーの発色が不均一になる場合があります。'
    );
  }
  if (h.blackDye && h.bleach) {
    score += 2;
    specific.push(
      '【複合リスク】黒染め × ブリーチの組み合わせは、1回の施術で希望色に到達できない可能性が高いです。'
    );
  }

  const level =
    score === 0  ? 'none'   :
    score <= 2   ? 'low'    :
    score <= 5   ? 'medium' : 'high';

  return { level, specific };
}

const COMMON_RISK = [
  'アレルギー・かぶれ（かゆみ・赤み・腫れ）が現れた場合は直ちにお申し出ください。',
  '施術後のホームケアが仕上がりの維持に大きく影響します。担当スタイリストの指示に従ってください。',
];

const RISK_BADGE = {
  low:    { label: '低リスク', cls: 'border-[#555] text-[#555]' },
  medium: { label: '中リスク', cls: 'border-[#6B3A00] text-[#6B3A00]' },
  high:   { label: '高リスク', cls: 'border-[#7B0000] text-[#7B0000]' },
} as const;

// ─── UIパーツ ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[9px] tracking-[4px] text-[#B0B0B0] font-medium uppercase whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-[#EBEBEB]" />
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] tracking-[3px] text-[#A0A0A0] mb-2.5">
      {children}
      {required && <span className="text-[#9B1C1C] ml-1">*</span>}
    </label>
  );
}

function LineInput({
  type = 'text', placeholder, value, onChange, inputMode,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
      className="
        w-full bg-transparent border-0 border-b border-[#D8D8D8]
        py-3 text-[15px] text-[#0A0A0A] placeholder-[#D0D0D0]
        focus:outline-none focus:border-[#0A0A0A] transition-colors duration-200
      "
    />
  );
}

function HistoryRow({
  label, sub, checked, onToggle,
}: {
  label: string; sub: string; checked: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="
        w-full flex items-center gap-4 py-4 text-left
        border-b border-[#F2F2F2] last:border-0
        active:bg-[#FAFAFA] transition-colors
      "
    >
      <span className={`
        w-[18px] h-[18px] border flex items-center justify-center
        flex-shrink-0 transition-all duration-150
        ${checked ? 'bg-[#0A0A0A] border-[#0A0A0A]' : 'border-[#C8C8C8] bg-white'}
      `}>
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="text-[14px] font-medium text-[#1A1A1A] block leading-snug">{label}</span>
        <span className="text-[11px] text-[#B0B0B0] block mt-0.5">{sub}</span>
      </span>
    </button>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function ConsentPage() {
  const sigRef  = useRef<SignaturePadRef>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name,         setName]         = useState('');
  const [phone,        setPhone]        = useState('');
  const [history,      setHistory]      = useState<History>({
    blackDye: false, bleach: false, straightening: false, selfColor: false,
  });
  const [imgPreview,   setImgPreview]   = useState<string | null>(null);
  const [desiredColor, setDesiredColor] = useState('');
  const [understood,   setUnderstood]   = useState(false);
  const [signed,       setSigned]       = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [done,         setDone]         = useState(false);
  const [error,        setError]        = useState('');

  // リスクをリアルタイム計算
  const { level, specific } = calcRisk(history, desiredColor);
  const hasHistory = Object.values(history).some(Boolean);

  const canSubmit = name.trim() !== '' && understood && signed && !submitting;

  const blockReason =
    !name.trim()  ? '氏名を入力してください' :
    !understood   ? 'リスク説明への同意が必要です' :
    !signed       ? '署名を記入してください' : '';

  const riskBorderColor =
    level === 'high'   ? 'border-l-[#7B0000]' :
    level === 'medium' ? 'border-l-[#6B3A00]' :
                         'border-l-[#0A0A0A]';

  // ── イベントハンドラ ─────────────────────────────────────────────────────

  function toggleHistory(key: keyof History) {
    setHistory(h => ({ ...h, [key]: !h[key] }));
    setUnderstood(false); // 履歴変更時は再確認を促す
  }

  function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImgPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function resetForm() {
    setName(''); setPhone('');
    setHistory({ blackDye: false, bleach: false, straightening: false, selfColor: false });
    setImgPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    setDesiredColor('');
    setUnderstood(false);
    setSigned(false);
    setError('');
    setDone(false);
    sigRef.current?.clear();
  }

  async function handleSubmit() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('署名を記入してください');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const sigDataUrl   = sigRef.current.getDataUrl();
      const allRiskItems = [...specific, ...COMMON_RISK];

      // PDF生成（動的インポートでブラウザのみで実行）
      const { generatePDF } = await import('@/lib/pdfGenerator');
      const blob = await generatePDF({
        customerName:     name,
        customerPhone:    phone,
        hasBlackDye:      history.blackDye,
        hasBleach:        history.bleach,
        hasStraightening: history.straightening,
        hasSelfColor:     history.selfColor,
        desiredColor,
        riskLevel:        level,
        riskItems:        allRiskItems,
        understood,
        signatureDataUrl: sigDataUrl,
      });

      // PDFをダウンロード
      const today = new Date()
        .toLocaleDateString('ja-JP')
        .replace(/\//g, '-');
      const a = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `同意書_${name}_${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDone(true);
    } catch (err) {
      console.error(err);
      setError('PDFの生成に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 完了画面
  // ════════════════════════════════════════════════════════════════════════════
  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-[#EBEBEB]">
          <div className="px-6 pt-5 pb-4">
            <p className="text-[8px] tracking-[6px] text-[#C0C0C0] mb-1 uppercase">
              Migaq Impression Salon
            </p>
            <h1 className="font-serif text-[18px] font-semibold tracking-widest text-[#0A0A0A]">
              施術同意書
            </h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-8 text-center">
          {/* チェックアイコン */}
          <div className="w-20 h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center">
            <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
              <path
                d="M2 12L10.5 20.5L30 2"
                stroke="white" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <p className="text-[10px] tracking-[4px] text-[#B0B0B0] mb-3 uppercase">
              Completed
            </p>
            <h2 className="font-serif text-[22px] font-semibold text-[#0A0A0A] mb-3 leading-snug">
              {name} 様<br />ありがとうございます
            </h2>
            <p className="text-[13px] text-[#A0A0A0] leading-relaxed">
              同意書への署名が完了しました。<br />
              PDFはデバイスに保存されています。
            </p>
          </div>

          {/* iPhoneへの案内 */}
          <div className="w-full bg-[#F8F8F8] border border-[#E8E8E8] p-4 text-left">
            <p className="text-[11px] text-[#888] leading-relaxed">
              <strong>📱 iPhoneをご利用の方へ</strong><br />
              PDFが画面に表示された場合は、<br />
              右上の共有ボタン →「ファイルに保存」でご保存ください。
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="w-full bg-[#0A0A0A] text-white py-4 text-[13px] font-medium tracking-[5px]"
          >
            新しい同意書を作成
          </button>
        </main>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 入力フォーム
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white">

      {/* ヘッダー（スクロールしても固定） */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#EBEBEB]">
        <div className="px-6 pt-5 pb-4">
          <p className="text-[8px] tracking-[6px] text-[#C0C0C0] mb-1 uppercase">
            Migaq Impression Salon
          </p>
          <h1 className="font-serif text-[18px] font-semibold tracking-widest text-[#0A0A0A]">
            施術同意書
          </h1>
        </div>
      </header>

      <main className="px-6 pt-8 pb-36 space-y-12">

        {/* ── 01. お客様情報 ────────────────────────────────────────── */}
        <section>
          <SectionLabel>01 — お客様情報</SectionLabel>
          <div className="space-y-7">
            <div>
              <FieldLabel required>氏名</FieldLabel>
              <LineInput
                placeholder="山田 花子"
                value={name}
                onChange={setName}
              />
            </div>
            <div>
              <FieldLabel>電話番号</FieldLabel>
              <LineInput
                type="tel" inputMode="tel"
                placeholder="090-0000-0000"
                value={phone}
                onChange={setPhone}
              />
            </div>
          </div>
        </section>

        {/* ── 02. 施術履歴 ──────────────────────────────────────────── */}
        <section>
          <SectionLabel>02 — 施術履歴</SectionLabel>
          <p className="text-[11px] text-[#B0B0B0] leading-relaxed mb-5">
            安全な施術のため、過去の薬剤施術をお知らせください。
          </p>
          <div className="border-t border-[#F2F2F2]">
            <HistoryRow
              label="黒染め履歴あり" sub="市販・サロン問わず"
              checked={history.blackDye}
              onToggle={() => toggleHistory('blackDye')}
            />
            <HistoryRow
              label="ブリーチ履歴あり" sub="全体・ハイライト・バレイヤージュ含む"
              checked={history.bleach}
              onToggle={() => toggleHistory('bleach')}
            />
            <HistoryRow
              label="縮毛矯正履歴あり" sub="酸性ストレート含む"
              checked={history.straightening}
              onToggle={() => toggleHistory('straightening')}
            />
            <HistoryRow
              label="セルフカラー履歴あり" sub="市販染料・白髪染め含む"
              checked={history.selfColor}
              onToggle={() => toggleHistory('selfColor')}
            />
          </div>
        </section>

        {/* ── 03. 参考画像 ──────────────────────────────────────────── */}
        <section>
          <SectionLabel>03 — 参考画像</SectionLabel>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />
          {imgPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgPreview}
                alt="参考画像"
                className="w-full max-h-72 object-contain bg-[#F5F5F5]"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 w-8 h-8 bg-[#0A0A0A]/75 text-white
                  flex items-center justify-center text-xs"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 w-full text-[11px] text-[#A0A0A0] tracking-wider
                  border border-[#EBEBEB] py-2.5 active:bg-[#F5F5F5] transition-colors"
              >
                画像を変更する
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-[#D0D0D0] py-12
                flex flex-col items-center gap-3 text-[#C0C0C0]
                active:bg-[#FAFAFA] transition-colors"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.3">
                <rect x="3" y="3" width="18" height="18" rx="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-[11px] tracking-widest">タップして画像を選択</span>
              <span className="text-[10px] text-[#D0D0D0]">カメラロールから選択できます</span>
            </button>
          )}
        </section>

        {/* ── 04. 希望カラー ────────────────────────────────────────── */}
        <section>
          <SectionLabel>04 — 希望カラー</SectionLabel>
          <LineInput
            placeholder="例：明るめのミルクティーベージュ"
            value={desiredColor}
            onChange={v => { setDesiredColor(v); setUnderstood(false); }}
          />
          <p className="text-[10px] text-[#C0C0C0] mt-2 leading-relaxed">
            ご希望のイメージをできるだけ具体的にご記入ください
          </p>
        </section>

        {/* ── 05. リスク説明（自動生成） ───────────────────────────── */}
        <section>
          <SectionLabel>05 — リスク説明</SectionLabel>
          <div className={`border-l-[3px] pl-5 space-y-4 transition-all duration-300 ${riskBorderColor}`}>

            {/* リスクバッジ（履歴ありの場合のみ） */}
            {hasHistory && level !== 'none' && (
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-bold tracking-[3px] px-3 py-1.5 border
                  ${RISK_BADGE[level as keyof typeof RISK_BADGE]?.cls}`}>
                  {RISK_BADGE[level as keyof typeof RISK_BADGE]?.label}
                </span>
              </div>
            )}

            {/* 固有リスク */}
            {specific.length > 0 && (
              <div className="space-y-3">
                {specific.map((item, i) => (
                  <div key={i} className="flex gap-2.5 text-[12px] text-[#3A3A3A] leading-relaxed">
                    <span className="text-[#A0A0A0] flex-shrink-0 mt-0.5">—</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {specific.length > 0 && <div className="border-t border-[#F0F0F0]" />}

            {/* 共通事項（常に表示） */}
            <div className="space-y-3">
              {COMMON_RISK.map((item, i) => (
                <div key={i} className="flex gap-2.5 text-[12px] text-[#888] leading-relaxed">
                  <span className="text-[#C0C0C0] flex-shrink-0 mt-0.5">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 06. 同意 ──────────────────────────────────────────────── */}
        <section>
          <SectionLabel>06 — 同意</SectionLabel>
          <button
            type="button"
            onClick={() => setUnderstood(u => !u)}
            className="w-full flex items-start gap-4 text-left active:bg-[#FAFAFA] transition-colors py-1"
          >
            <span className={`
              w-[18px] h-[18px] border flex items-center justify-center
              flex-shrink-0 mt-0.5 transition-all duration-150
              ${understood ? 'bg-[#0A0A0A] border-[#0A0A0A]' : 'border-[#C8C8C8] bg-white'}
            `}>
              {understood && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="flex-1">
              <span className="text-[14px] font-medium text-[#0A0A0A] block leading-snug">
                上記リスク説明の内容を理解しました
              </span>
              <span className="text-[11px] text-[#A8A8A8] block mt-1.5 leading-relaxed">
                施術履歴・リスク説明を確認した上で施術を依頼します。
                施術後の返金・過剰なやり直し要求は行いません。
              </span>
            </span>
          </button>
        </section>

        {/* ── 07. 電子署名 ─────────────────────────────────────────── */}
        <section>
          <SectionLabel>07 — 電子署名</SectionLabel>
          <p className="text-[11px] text-[#B0B0B0] mb-4 leading-relaxed">
            指またはスタイラスで枠内にサインしてください。
          </p>
          <div className="border border-[#D8D8D8] relative bg-[#F8F8F8]">
            <SignaturePad ref={sigRef} onSign={() => setSigned(true)} />
            {!signed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[12px] text-[#CCCCCC] tracking-wider font-serif">
                  ここに署名
                </span>
              </div>
            )}
          </div>
          {signed && (
            <button
              type="button"
              onClick={() => { sigRef.current?.clear(); setSigned(false); }}
              className="mt-2.5 text-[11px] text-[#ABABAB] tracking-wider underline underline-offset-2"
            >
              クリアして書き直す
            </button>
          )}
        </section>

      </main>

      {/* ── 固定送信ボタン ────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="px-6 py-4">
          {/* バリデーション・エラーメッセージ */}
          {(blockReason || error) && (
            <p className={`text-[10px] tracking-wider text-center mb-3
              ${error ? 'text-[#9B1C1C]' : 'text-[#A0A0A0]'}`}>
              {error || blockReason}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="
              w-full py-4 text-[13px] font-medium tracking-[5px]
              transition-all duration-200 disabled:cursor-not-allowed
              bg-[#0A0A0A] text-white
              disabled:bg-[#D8D8D8] disabled:text-[#F0F0F0]
            "
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor"
                    strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                </svg>
                PDF生成中...
              </span>
            ) : '同意して送信'}
          </button>
        </div>
      </div>

    </div>
  );
}
