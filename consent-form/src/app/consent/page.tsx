'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad, { type SignaturePadRef } from '@/components/SignaturePad';
import { generateRisk, RISK_LABEL, type RiskLevel } from '@/lib/riskGenerator';

// ─── フォームの型 ─────────────────────────────────────────────────────────────

interface Form {
  customerName: string;
  customerPhone: string;
  treatmentDate: string;
  stylistName: string;
  requestedTreatment: string;
  hasBlackDye: boolean;
  blackDyeMonths: string;
  hasBleach: boolean;
  bleachMonths: string;
  hasStraightening: boolean;
  straighteningMonths: string;
  riskLevel: RiskLevel;
  riskItems: string[];
  consentRisk: boolean;
  consentNoClaim: boolean;
  consentHistory: boolean;
}

const INIT: Form = {
  customerName: '', customerPhone: '',
  treatmentDate: new Date().toISOString().split('T')[0],
  stylistName: '', requestedTreatment: '',
  hasBlackDye: false, blackDyeMonths: '',
  hasBleach: false, bleachMonths: '',
  hasStraightening: false, straighteningMonths: '',
  riskLevel: 'low', riskItems: [],
  consentRisk: false, consentNoClaim: false, consentHistory: false,
};

const TREATMENTS = [
  'カット', 'カラー（全体）', 'カラー（リタッチ）',
  'ブリーチ（全体）', 'ブリーチ（ハイライト）',
  'パーマ', '縮毛矯正', 'トリートメント', 'その他',
];

// ─── 小コンポーネント ─────────────────────────────────────────────────────────

/** あり / なし トグル */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex border border-[#E0E0E0] overflow-hidden shrink-0">
      {(['あり', 'なし'] as const).map((label, i) => {
        const active = i === 0 ? value : !value;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(i === 0)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              active ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#9E9E9E] hover:bg-[#F5F5F5]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** チェックボックス行 */
function Check({
  checked, label, sub, onChange, required,
}: {
  checked: boolean; label: string; sub?: string;
  onChange: (v: boolean) => void; required?: boolean;
}) {
  return (
    <label
      className="flex items-start gap-3 py-4 border-b border-[#F0F0F0] last:border-0 cursor-pointer active:bg-[#FAFAFA]"
      onClick={() => onChange(!checked)}
    >
      <span
        className={`mt-0.5 w-5 h-5 shrink-0 border flex items-center justify-center transition-colors ${
          checked ? 'bg-[#0A0A0A] border-[#0A0A0A]' : 'bg-white border-[#D0D0D0]'
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="text-sm leading-snug block">
          {required && <span className="text-[#B71C1C] mr-1">*</span>}
          {label}
        </span>
        {sub && <span className="text-xs text-[#9E9E9E] mt-0.5 block leading-relaxed">{sub}</span>}
      </span>
    </label>
  );
}

/** 入力ラベル */
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <div className="text-[10px] tracking-[3px] text-[#9E9E9E] mb-1.5 uppercase">
      {text}{required && <span className="text-[#B71C1C] ml-1">*</span>}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function ConsentPage() {
  const router    = useRouter();
  const sigRef    = useRef<SignaturePadRef>(null);
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState<Form>(INIT);
  const [signed, setSigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (p: Partial<Form>) => setForm(f => ({ ...f, ...p }));

  // step2 → step3 でリスク自動計算
  function enterStep3() {
    const { level, items } = generateRisk(
      form.hasBlackDye,    parseInt(form.blackDyeMonths)    || 99,
      form.hasBleach,      parseInt(form.bleachMonths)      || 99,
      form.hasStraightening, parseInt(form.straighteningMonths) || 99,
      form.requestedTreatment
    );
    set({ riskLevel: level, riskItems: items });
    setStep(3);
  }

  // バリデーション
  const step1OK = form.customerName.trim() && form.treatmentDate && form.stylistName.trim() && form.requestedTreatment;
  const step3OK = form.consentRisk && form.consentNoClaim && form.consentHistory;

  // 送信
  async function handleSubmit() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('署名を記入してください');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const sigDataUrl = sigRef.current.getDataUrl();

      // 1. Supabase保存
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, signatureDataUrl: sigDataUrl }),
      });
      if (!res.ok) throw new Error('save failed');

      // 2. PDF生成（動的インポートでバンドルサイズ最適化）
      const { generatePDF } = await import('@/lib/pdfGenerator');
      const blob = await generatePDF({ ...form, signatureDataUrl: sigDataUrl });

      // 3. PDFダウンロード
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${form.treatmentDate}_${form.customerName}_同意書.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      router.push(`/consent/complete?name=${encodeURIComponent(form.customerName)}`);
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  }

  // リスクバッジの色
  const riskStyle: Record<RiskLevel, string> = {
    low:    'border-[#2E7D32] text-[#2E7D32]',
    medium: 'border-[#E65100] text-[#E65100]',
    high:   'border-[#B71C1C] text-[#B71C1C] bg-red-50',
  };
  const riskBorder: Record<RiskLevel, string> = {
    low:    'border-l-[#2E7D32]',
    medium: 'border-l-[#E65100]',
    high:   'border-l-[#B71C1C]',
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* ── ヘッダー ── */}
      <header className="bg-white border-b border-[#E8E8E8] sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-5 pt-4 pb-3">
          <div className="text-[9px] tracking-[5px] text-[#BBBBBB] mb-0.5">MIGAQ IMPRESSION SALON</div>
          <div className="font-serif text-[17px] font-semibold tracking-wider">施術同意書</div>
        </div>

        {/* ステップバー */}
        <div className="max-w-lg mx-auto px-5 pb-3">
          <div className="flex gap-1 mb-1.5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-[#0A0A0A]' : 'bg-[#E8E8E8]'}`} />
            ))}
          </div>
          <div className="flex justify-between">
            {['お客様情報', '施術履歴', 'リスク確認', '電子署名'].map((t, i) => (
              <span key={t} className={`text-[9px] tracking-wide ${i + 1 === step ? 'text-[#0A0A0A] font-semibold' : 'text-[#D0D0D0]'}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── メインコンテンツ ── */}
      <main className="max-w-lg mx-auto px-5 pt-6 pb-32">

        {/* ══ STEP 1: お客様情報 ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5 animate-[fadeIn_.25s_ease-out]">
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-wide mb-1">お客様情報</h2>
              <p className="text-xs text-[#9E9E9E]">担当スタイリストが入力します。</p>
            </div>

            <div>
              <Label text="お名前" required />
              <input
                type="text" autoComplete="off" placeholder="山田 花子"
                value={form.customerName}
                onChange={e => set({ customerName: e.target.value })}
                className="w-full border border-[#E0E0E0] bg-white px-4 py-3.5 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
              />
            </div>

            <div>
              <Label text="電話番号" />
              <input
                type="tel" autoComplete="tel" placeholder="090-0000-0000"
                value={form.customerPhone}
                onChange={e => set({ customerPhone: e.target.value })}
                className="w-full border border-[#E0E0E0] bg-white px-4 py-3.5 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
              />
            </div>

            <div>
              <Label text="施術日" required />
              <input
                type="date"
                value={form.treatmentDate}
                onChange={e => set({ treatmentDate: e.target.value })}
                className="w-full border border-[#E0E0E0] bg-white px-4 py-3.5 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
              />
            </div>

            <div>
              <Label text="担当スタイリスト" required />
              <input
                type="text" autoComplete="off" placeholder="担当者名"
                value={form.stylistName}
                onChange={e => set({ stylistName: e.target.value })}
                className="w-full border border-[#E0E0E0] bg-white px-4 py-3.5 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
              />
            </div>

            <div>
              <Label text="施術メニュー" required />
              <select
                value={form.requestedTreatment}
                onChange={e => set({ requestedTreatment: e.target.value })}
                className="w-full border border-[#E0E0E0] bg-white px-4 py-3.5 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors appearance-none"
              >
                <option value="">選択してください</option>
                {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ══ STEP 2: 施術履歴 ══════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4 animate-[fadeIn_.25s_ease-out]">
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-wide mb-1">施術履歴</h2>
              <p className="text-xs text-[#9E9E9E]">安全な施術のため、正確にお答えください。</p>
            </div>

            {/* 黒染め */}
            <div className="bg-white border border-[#E0E0E0] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">黒染め（ブラックカラー）</div>
                  <div className="text-xs text-[#9E9E9E] mt-0.5">市販・サロン問わず</div>
                </div>
                <Toggle value={form.hasBlackDye} onChange={v => set({ hasBlackDye: v })} />
              </div>
              {form.hasBlackDye && (
                <div className="mt-4 pt-4 border-t border-[#F0F0F0] animate-[fadeIn_.2s_ease-out]">
                  <Label text="何ヶ月前" />
                  <div className="flex items-center gap-2">
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      placeholder="例: 6"
                      value={form.blackDyeMonths}
                      onChange={e => set({ blackDyeMonths: e.target.value })}
                      className="border border-[#E0E0E0] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors w-24"
                    />
                    <span className="text-sm text-[#9E9E9E]">ヶ月前</span>
                  </div>
                </div>
              )}
            </div>

            {/* ブリーチ */}
            <div className="bg-white border border-[#E0E0E0] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">ブリーチ（脱色）</div>
                  <div className="text-xs text-[#9E9E9E] mt-0.5">全体・ハイライト含む</div>
                </div>
                <Toggle value={form.hasBleach} onChange={v => set({ hasBleach: v })} />
              </div>
              {form.hasBleach && (
                <div className="mt-4 pt-4 border-t border-[#F0F0F0] animate-[fadeIn_.2s_ease-out]">
                  <Label text="何ヶ月前" />
                  <div className="flex items-center gap-2">
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      placeholder="例: 3"
                      value={form.bleachMonths}
                      onChange={e => set({ bleachMonths: e.target.value })}
                      className="border border-[#E0E0E0] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors w-24"
                    />
                    <span className="text-sm text-[#9E9E9E]">ヶ月前</span>
                  </div>
                </div>
              )}
            </div>

            {/* 縮毛矯正 */}
            <div className="bg-white border border-[#E0E0E0] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">縮毛矯正・酸性ストレート</div>
                  <div className="text-xs text-[#9E9E9E] mt-0.5">デジタルパーマ以外</div>
                </div>
                <Toggle value={form.hasStraightening} onChange={v => set({ hasStraightening: v })} />
              </div>
              {form.hasStraightening && (
                <div className="mt-4 pt-4 border-t border-[#F0F0F0] animate-[fadeIn_.2s_ease-out]">
                  <Label text="何ヶ月前" />
                  <div className="flex items-center gap-2">
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      placeholder="例: 12"
                      value={form.straighteningMonths}
                      onChange={e => set({ straighteningMonths: e.target.value })}
                      className="border border-[#E0E0E0] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors w-24"
                    />
                    <span className="text-sm text-[#9E9E9E]">ヶ月前</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 3: リスク確認 + 同意 ══════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5 animate-[fadeIn_.25s_ease-out]">
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-wide mb-1">リスク確認</h2>
              <p className="text-xs text-[#9E9E9E]">施術前にリスクをご確認の上、同意してください。</p>
            </div>

            {/* リスク表示 */}
            <div className={`bg-white border-l-4 p-5 ${riskBorder[form.riskLevel]}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[9px] tracking-[3px] text-[#9E9E9E]">リスク評価</span>
                <span className={`border text-xs font-bold px-3 py-1 tracking-widest ${riskStyle[form.riskLevel]}`}>
                  {RISK_LABEL[form.riskLevel]}
                </span>
              </div>
              <div className="space-y-3">
                {form.riskItems.map((item, i) => (
                  <div key={i} className="flex gap-2 text-xs text-[#444] leading-relaxed">
                    <span className="text-[#9E9E9E] shrink-0 mt-0.5">—</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 同意チェックボックス */}
            <div className="bg-white border border-[#E0E0E0]">
              <div className="px-5 pt-4 pb-2 border-b border-[#F0F0F0]">
                <div className="text-[9px] tracking-[3px] text-[#9E9E9E]">同意事項</div>
              </div>
              <div className="px-5">
                <Check
                  checked={form.consentRisk} required
                  onChange={v => set({ consentRisk: v })}
                  label="上記リスク説明の内容を理解し、施術を依頼します"
                  sub="ダメージ・色ムラ等のリスクを理解した上で施術を希望します。"
                />
                <Check
                  checked={form.consentNoClaim} required
                  onChange={v => set({ consentNoClaim: v })}
                  label="施術後の返金・過剰なやり直し要求は行いません"
                  sub="リスクを承知の上での依頼のため、施術後の返金要求は行いません。"
                />
                <Check
                  checked={form.consentHistory} required
                  onChange={v => set({ consentHistory: v })}
                  label="施術履歴は正確に申告しました"
                  sub="虚偽申告により生じたトラブルはサロンの責任範囲外となります。"
                />
              </div>
            </div>

            {!step3OK && (
              <p className="text-xs text-[#B71C1C] text-center">
                ＊ 3項目すべてにチェックを入れてください
              </p>
            )}
          </div>
        )}

        {/* ══ STEP 4: 電子署名 ════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-5 animate-[fadeIn_.25s_ease-out]">
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-wide mb-1">電子署名</h2>
              <p className="text-xs text-[#9E9E9E]">
                同意いただけましたら、下枠に指でサインしてください。<br />
                署名後、PDFが自動でダウンロードされます。
              </p>
            </div>

            {/* 確認サマリー */}
            <div className="bg-white border border-[#E0E0E0] p-4 space-y-1.5 text-xs text-[#666]">
              <div><span className="font-semibold text-[#0A0A0A]">{form.customerName} 様</span></div>
              <div>施術日：{form.treatmentDate}　担当：{form.stylistName}</div>
              <div>施術内容：{form.requestedTreatment}</div>
            </div>

            {/* 署名キャンバス */}
            <div className="bg-white border border-[#E0E0E0]">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-[#F0F0F0]">
                <Label text="ご署名" required />
                <button
                  type="button"
                  onClick={() => { sigRef.current?.clear(); setSigned(false); }}
                  className="text-[10px] text-[#9E9E9E] underline"
                >
                  クリア
                </button>
              </div>
              <div className="relative">
                <SignaturePad ref={sigRef} onSign={() => setSigned(true)} />
                {!signed && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-[#CCCCCC] tracking-wider">ここに署名してください</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-[#F0F0F0]">
                <p className="text-[10px] text-[#BBBBBB]">タッチまたはマウスでサインしてください</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-[#B71C1C]/30 text-[#B71C1C] text-xs p-3 text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── ボトムナビ ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8E8] safe-area-bottom">
        <div className="max-w-lg mx-auto px-5 py-4 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              disabled={saving}
              onClick={() => setStep(s => (s - 1) as 1|2|3|4)}
              className="flex-1 border border-[#0A0A0A] text-[#0A0A0A] py-3.5 text-sm font-medium tracking-widest hover:bg-[#0A0A0A] hover:text-white transition-colors disabled:opacity-40"
            >
              戻る
            </button>
          )}

          {step < 4 && (
            <button
              type="button"
              disabled={
                (step === 1 && !step1OK) ||
                (step === 3 && !step3OK)
              }
              onClick={() => {
                if (step === 2) { enterStep3(); }
                else { setStep(s => (s + 1) as 1|2|3|4); }
              }}
              className="flex-1 bg-[#0A0A0A] text-white py-3.5 text-sm font-medium tracking-widest hover:bg-[#333] transition-colors disabled:bg-[#D0D0D0] disabled:cursor-not-allowed"
            >
              次へ
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="flex-1 bg-[#0A0A0A] text-white py-3.5 text-sm font-medium tracking-widest hover:bg-[#333] transition-colors disabled:bg-[#D0D0D0] disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                  </svg>
                  保存中...
                </span>
              ) : '同意して保存'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
