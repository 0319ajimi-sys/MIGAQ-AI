'use client';

import {
  useState,
  useRef,
  useCallback,
  ChangeEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import type { ConsentFormData, RiskLevel } from '@/types/consent';
import { TREATMENT_OPTIONS } from '@/types/consent';
import { generateRisk, RISK_LABEL } from '@/lib/riskGenerator';
import { supabase, uploadFile, dataUrlToBlob } from '@/lib/supabase';
import SignaturePad, { type SignaturePadRef } from '@/components/SignaturePad';

const TOTAL_STEPS = 5;

const defaultForm: ConsentFormData = {
  customerName: '',
  customerPhone: '',
  treatmentDate: new Date().toISOString().split('T')[0],
  stylistName: '',
  requestedTreatment: '',
  history: {
    hasBlackDye: false,
    blackDyeMonthsAgo: '',
    blackDyeTimes: '',
    blackDyeDetails: '',
    hasBleach: false,
    bleachMonthsAgo: '',
    bleachTimes: '',
    bleachDetails: '',
    hasStraightening: false,
    straighteningMonthsAgo: '',
    straighteningTimes: '',
    straighteningDetails: '',
    hasOtherChemical: false,
    otherChemicalDetails: '',
  },
  riskLevel: 'low',
  riskItems: [],
  consents: {
    understoodRisk: false,
    noClaim: false,
    accurateHistory: false,
    photoConsent: false,
    contactPermission: false,
  },
};

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  const labels = ['お客様情報', '施術内容', '施術履歴', 'リスク確認', '電子署名'];
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-1 mb-2">
        {labels.map((_, i) => (
          <div
            key={i}
            className={`step-indicator ${
              i + 1 <= current ? 'bg-ink' : 'bg-border'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {labels.map((label, i) => (
          <span
            key={i}
            className={`text-[9px] tracking-wider ${
              i + 1 === current ? 'text-ink font-semibold' : 'text-zinc-300'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle Yes/No ───────────────────────────────────────────────────────────
function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="toggle-group w-32">
      <button
        type="button"
        className={`toggle-btn ${value ? 'active' : ''}`}
        onClick={() => onChange(true)}
      >
        あり
      </button>
      <button
        type="button"
        className={`toggle-btn ${!value ? 'active' : ''}`}
        onClick={() => onChange(false)}
      >
        なし
      </button>
    </div>
  );
}

// ─── History row ─────────────────────────────────────────────────────────────
function HistoryRow({
  label,
  has,
  monthsAgo,
  times,
  details,
  onToggle,
  onMonths,
  onTimes,
  onDetails,
  detailPlaceholder,
}: {
  label: string;
  has: boolean;
  monthsAgo: string;
  times: string;
  details: string;
  onToggle: (v: boolean) => void;
  onMonths: (v: string) => void;
  onTimes: (v: string) => void;
  onDetails: (v: string) => void;
  detailPlaceholder?: string;
}) {
  return (
    <div className="border border-border p-4 animate-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold tracking-wide">{label}</span>
        <YesNoToggle value={has} onChange={onToggle} />
      </div>
      {has && (
        <div className="space-y-3 mt-3 pt-3 border-t border-border animate-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="section-label">何ヶ月前</div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="例: 6"
                  value={monthsAgo}
                  onChange={(e) => onMonths(e.target.value)}
                  className="!py-2"
                />
                <span className="text-sm text-muted whitespace-nowrap ml-1">ヶ月前</span>
              </div>
            </div>
            <div>
              <div className="section-label">施術回数</div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="例: 2"
                  value={times}
                  onChange={(e) => onTimes(e.target.value)}
                  className="!py-2"
                />
                <span className="text-sm text-muted whitespace-nowrap ml-1">回</span>
              </div>
            </div>
          </div>
          <div>
            <div className="section-label">詳細・メモ（任意）</div>
            <input
              type="text"
              placeholder={detailPlaceholder || '詳細があればご記入ください'}
              value={details}
              onChange={(e) => onDetails(e.target.value)}
              className="!py-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Checkbox row ────────────────────────────────────────────────────────────
function ConsentCheck({
  checked,
  label,
  sub,
  onChange,
  required,
}: {
  checked: boolean;
  label: string;
  sub?: string;
  onChange: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-3.5 border-b border-border last:border-0 active:bg-zinc-50">
      <div
        className={`w-5 h-5 flex-shrink-0 border mt-0.5 flex items-center justify-center transition-colors ${
          checked ? 'bg-ink border-ink' : 'bg-white border-border'
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0" onClick={() => onChange(!checked)}>
        <div className="text-sm leading-snug">
          {required && <span className="text-risk-high mr-1">*</span>}
          {label}
        </div>
        {sub && <div className="text-xs text-muted mt-0.5 leading-relaxed">{sub}</div>}
      </div>
    </label>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ConsentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ConsentFormData>(defaultForm);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const sigRef = useRef<SignaturePadRef>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── helpers ────────────────────────────────────────────────────────────────
  const upd = useCallback((patch: Partial<ConsentFormData>) => {
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const updHistory = useCallback(
    (patch: Partial<ConsentFormData['history']>) => {
      setForm((f) => ({ ...f, history: { ...f.history, ...patch } }));
    },
    []
  );

  const updConsent = useCallback(
    (patch: Partial<ConsentFormData['consents']>) => {
      setForm((f) => ({ ...f, consents: { ...f.consents, ...patch } }));
    },
    []
  );

  // ── step validation ────────────────────────────────────────────────────────
  function canProceed(): boolean {
    if (step === 1) {
      return (
        form.customerName.trim() !== '' &&
        form.stylistName.trim() !== '' &&
        form.treatmentDate !== ''
      );
    }
    if (step === 2) {
      return form.requestedTreatment !== '';
    }
    if (step === 4) {
      const { understoodRisk, noClaim, accurateHistory } = form.consents;
      return understoodRisk && noClaim && accurateHistory;
    }
    return true;
  }

  // ── step 3 → 4 transition: compute risk ───────────────────────────────────
  function goToRisk() {
    const { level, items } = generateRisk(form.history, form.requestedTreatment);
    upd({ riskLevel: level, riskItems: items });
    setStep(4);
  }

  // ── image upload ───────────────────────────────────────────────────────────
  function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upd({ referenceImageFile: file });
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (sigRef.current?.isEmpty()) {
      setError('署名を記入してください。');
      return;
    }
    setError('');
    setIsSaving(true);

    try {
      const timestamp = Date.now();
      let referenceImageUrl: string | undefined;
      let signatureUrl: string | undefined;
      let pdfUrl: string | undefined;
      let gdriveUrl: string | undefined;

      // 1. Upload reference image
      if (form.referenceImageFile) {
        const ext = form.referenceImageFile.name.split('.').pop() ?? 'jpg';
        referenceImageUrl =
          (await uploadFile(
            'consent-images',
            `${timestamp}-ref.${ext}`,
            form.referenceImageFile,
            form.referenceImageFile.type
          )) ?? undefined;
      }

      // 2. Upload signature
      const sigDataUrl = sigRef.current!.getDataUrl();
      const sigBlob = await dataUrlToBlob(sigDataUrl);
      signatureUrl =
        (await uploadFile(
          'consent-signatures',
          `${timestamp}-sig.png`,
          sigBlob,
          'image/png'
        )) ?? undefined;

      const finalForm: ConsentFormData = {
        ...form,
        referenceImageUrl,
        signatureDataUrl: sigDataUrl,
      };

      // 3. Generate + upload PDF
      const { generateConsentPDF } = await import('@/lib/pdfGenerator');
      const pdfBlob = await generateConsentPDF(finalForm);
      pdfUrl =
        (await uploadFile(
          'consent-pdfs',
          `${timestamp}-consent.pdf`,
          pdfBlob,
          'application/pdf'
        )) ?? undefined;

      // 4. Save to Google Drive (optional — won't fail if unconfigured)
      try {
        const fd = new FormData();
        fd.append('file', pdfBlob, 'consent.pdf');
        fd.append(
          'filename',
          `${form.treatmentDate}_${form.customerName}_同意書.pdf`
        );
        const driveRes = await fetch('/api/gdrive', { method: 'POST', body: fd });
        if (driveRes.ok) {
          const driveData = await driveRes.json();
          gdriveUrl = driveData.url;
        }
      } catch {
        // Google Drive is optional — ignore errors
      }

      // 5. Save to Supabase DB
      const saveRes = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...finalForm,
          signatureUrl,
          pdfUrl,
          gdriveUrl,
        }),
      });

      if (!saveRes.ok) throw new Error('DB save failed');
      const saveData = await saveRes.json();

      // 6. Download PDF for stylist
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `${form.treatmentDate}_${form.customerName}_同意書.pdf`;
      link.click();

      router.push(
        `/consent/complete?name=${encodeURIComponent(form.customerName)}&id=${saveData.id}&gdrive=${encodeURIComponent(gdriveUrl ?? '')}&pdf=${encodeURIComponent(pdfUrl ?? '')}`
      );
    } catch (err) {
      console.error(err);
      setError('保存中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Risk badge ─────────────────────────────────────────────────────────────
  function RiskBadge({ level }: { level: RiskLevel }) {
    const cls: Record<RiskLevel, string> = {
      low: 'border-risk-low text-risk-low',
      medium: 'border-risk-medium text-risk-medium',
      high: 'border-risk-high text-risk-high bg-red-50',
    };
    return (
      <span
        className={`border text-xs px-3 py-1 font-bold tracking-widest ${cls[level]}`}
      >
        {RISK_LABEL[level]}
      </span>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[9px] tracking-[4px] text-muted">MIGAQ IMPRESSION SALON</div>
            <div className="text-base font-serif font-semibold tracking-wide">施術同意書</div>
          </div>
          <div className="text-xs text-muted">
            {step} / {TOTAL_STEPS}
          </div>
        </div>
        <StepBar current={step} />
      </header>

      <main className="max-w-lg mx-auto px-4 pb-32">

        {/* ── STEP 1: お客様情報 ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5 pt-6 animate-in">
            <div>
              <h2 className="font-serif text-xl font-semibold mb-1">お客様情報</h2>
              <p className="text-xs text-muted">施術日・担当スタイリスト・お客様の基本情報を入力してください。</p>
            </div>

            <div>
              <div className="section-label">お名前 <span className="text-risk-high">*</span></div>
              <input
                type="text"
                placeholder="山田 花子"
                value={form.customerName}
                onChange={(e) => upd({ customerName: e.target.value })}
                autoComplete="name"
              />
            </div>

            <div>
              <div className="section-label">電話番号</div>
              <input
                type="tel"
                placeholder="090-0000-0000"
                value={form.customerPhone}
                onChange={(e) => upd({ customerPhone: e.target.value })}
                autoComplete="tel"
              />
            </div>

            <div>
              <div className="section-label">施術日 <span className="text-risk-high">*</span></div>
              <input
                type="date"
                value={form.treatmentDate}
                onChange={(e) => upd({ treatmentDate: e.target.value })}
              />
            </div>

            <div>
              <div className="section-label">担当スタイリスト <span className="text-risk-high">*</span></div>
              <input
                type="text"
                placeholder="担当者名"
                value={form.stylistName}
                onChange={(e) => upd({ stylistName: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: 施術内容 ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5 pt-6 animate-in">
            <div>
              <h2 className="font-serif text-xl font-semibold mb-1">施術内容</h2>
              <p className="text-xs text-muted">ご希望の施術内容と参考画像をご確認ください。</p>
            </div>

            <div>
              <div className="section-label">施術メニュー <span className="text-risk-high">*</span></div>
              <select
                value={form.requestedTreatment}
                onChange={(e) => upd({ requestedTreatment: e.target.value })}
              >
                <option value="">施術を選択してください</option>
                {TREATMENT_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {form.requestedTreatment === 'その他' && (
              <div className="animate-in">
                <div className="section-label">施術内容（詳細）</div>
                <input
                  type="text"
                  placeholder="施術内容を詳しく入力してください"
                  value=""
                  onChange={(e) => upd({ requestedTreatment: e.target.value })}
                />
              </div>
            )}

            <div>
              <div className="section-label">参考画像（任意）</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imgPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgPreview}
                    alt="参考画像"
                    className="w-full max-h-64 object-contain border border-border bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImgPreview(null);
                      upd({ referenceImageFile: undefined });
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-ink text-white w-7 h-7 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border py-10 flex flex-col items-center gap-2 hover:border-ink transition-colors"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                    <rect x="3" y="3" width="18" height="18" rx="1" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-xs text-muted">タップして画像を選択</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: 施術履歴 ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4 pt-6 animate-in">
            <div>
              <h2 className="font-serif text-xl font-semibold mb-1">施術履歴</h2>
              <p className="text-xs text-muted">過去の薬剤施術履歴を正確にご申告ください。安全な施術のために重要な情報です。</p>
            </div>

            <HistoryRow
              label="黒染め（ブラックカラー）"
              has={form.history.hasBlackDye}
              monthsAgo={form.history.blackDyeMonthsAgo}
              times={form.history.blackDyeTimes}
              details={form.history.blackDyeDetails}
              onToggle={(v) => updHistory({ hasBlackDye: v })}
              onMonths={(v) => updHistory({ blackDyeMonthsAgo: v })}
              onTimes={(v) => updHistory({ blackDyeTimes: v })}
              onDetails={(v) => updHistory({ blackDyeDetails: v })}
              detailPlaceholder="使用した染料・施術店名など（任意）"
            />

            <HistoryRow
              label="ブリーチ（脱色）"
              has={form.history.hasBleach}
              monthsAgo={form.history.bleachMonthsAgo}
              times={form.history.bleachTimes}
              details={form.history.bleachDetails}
              onToggle={(v) => updHistory({ hasBleach: v })}
              onMonths={(v) => updHistory({ bleachMonthsAgo: v })}
              onTimes={(v) => updHistory({ bleachTimes: v })}
              onDetails={(v) => updHistory({ bleachDetails: v })}
              detailPlaceholder="ハイライト・全体など詳細（任意）"
            />

            <HistoryRow
              label="縮毛矯正・酸性ストレート"
              has={form.history.hasStraightening}
              monthsAgo={form.history.straighteningMonthsAgo}
              times={form.history.straighteningTimes}
              details={form.history.straighteningDetails}
              onToggle={(v) => updHistory({ hasStraightening: v })}
              onMonths={(v) => updHistory({ straighteningMonthsAgo: v })}
              onTimes={(v) => updHistory({ straighteningTimes: v })}
              onDetails={(v) => updHistory({ straighteningDetails: v })}
              detailPlaceholder="施術範囲・使用薬剤など（任意）"
            />

            <div className="border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold tracking-wide">その他の薬剤施術</span>
                <YesNoToggle
                  value={form.history.hasOtherChemical}
                  onChange={(v) => updHistory({ hasOtherChemical: v })}
                />
              </div>
              {form.history.hasOtherChemical && (
                <div className="mt-3 pt-3 border-t border-border animate-in">
                  <div className="section-label">詳細</div>
                  <input
                    type="text"
                    placeholder="例：デジタルパーマ、酸熱トリートメントなど"
                    value={form.history.otherChemicalDetails}
                    onChange={(e) => updHistory({ otherChemicalDetails: e.target.value })}
                    className="!py-2"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: リスク確認 ────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5 pt-6 animate-in">
            <div>
              <h2 className="font-serif text-xl font-semibold mb-1">リスク確認</h2>
              <p className="text-xs text-muted">施術前に以下のリスクをご確認の上、同意事項にチェックをお入れください。</p>
            </div>

            <div
              className={`border-l-4 p-4 bg-white ${
                form.riskLevel === 'high'
                  ? 'border-risk-high'
                  : form.riskLevel === 'medium'
                  ? 'border-risk-medium'
                  : 'border-risk-low'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-[10px] tracking-[3px] text-muted">リスク評価</div>
                <RiskBadge level={form.riskLevel} />
              </div>
              <div className="space-y-3">
                {form.riskItems.map((item, i) => (
                  <div key={i} className="text-xs leading-relaxed text-zinc-700 flex gap-2">
                    <span className="text-muted flex-shrink-0">—</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border">
              <div className="px-4 pt-4 pb-2 border-b border-border">
                <div className="text-[10px] tracking-[3px] text-muted">同意事項</div>
              </div>
              <div className="px-4">
                <ConsentCheck
                  checked={form.consents.understoodRisk}
                  onChange={(v) => updConsent({ understoodRisk: v })}
                  required
                  label="上記リスク説明の内容を十分に理解しました"
                  sub="施術結果・ダメージ等のリスクについて説明を受け、内容を理解しています。"
                />
                <ConsentCheck
                  checked={form.consents.noClaim}
                  onChange={(v) => updConsent({ noClaim: v })}
                  required
                  label="施術後の返金・やり直し要求は行いません"
                  sub="上記リスクを理解した上で施術を依頼しており、施術後の返金・過剰なやり直し請求は行いません。"
                />
                <ConsentCheck
                  checked={form.consents.accurateHistory}
                  onChange={(v) => updConsent({ accurateHistory: v })}
                  required
                  label="施術履歴は正確に申告しました"
                  sub="虚偽の申告により生じたトラブルについては責任を負いません。"
                />
                <ConsentCheck
                  checked={form.consents.photoConsent}
                  onChange={(v) => updConsent({ photoConsent: v })}
                  label="施術写真のSNS・販促素材への使用に同意します"
                  sub="顔が映らない範囲での使用となります。（任意）"
                />
                <ConsentCheck
                  checked={form.consents.contactPermission}
                  onChange={(v) => updConsent({ contactPermission: v })}
                  label="アフターフォローのご連絡に同意します"
                  sub="施術後1週間以内に状態確認のご連絡をする場合があります。（任意）"
                />
              </div>
            </div>

            {!canProceed() && (
              <p className="text-xs text-risk-high text-center">
                ＊ 必須の同意事項（赤いアスタリスク）にすべてチェックを入れてください
              </p>
            )}
          </div>
        )}

        {/* ── STEP 5: 電子署名 ──────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-5 pt-6 animate-in">
            <div>
              <h2 className="font-serif text-xl font-semibold mb-1">電子署名</h2>
              <p className="text-xs text-muted">
                上記の内容に同意の上、下枠内にご署名ください。<br />
                署名後、同意書のPDFが自動的にダウンロードされます。
              </p>
            </div>

            <div className="bg-white border border-border p-4 space-y-3">
              <div className="text-xs text-muted leading-relaxed">
                <span className="font-semibold text-ink">{form.customerName} 様</span> は、
                {form.treatmentDate} の施術（{form.requestedTreatment}）について、
                リスク説明を受け、内容に同意します。
              </div>
              <div className="section-label">ご署名 <span className="text-risk-high">*</span></div>
              <div className="border border-border relative bg-zinc-50">
                <SignaturePad
                  ref={sigRef}
                  onSign={() => setIsSigning(true)}
                />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() => {
                      sigRef.current?.clear();
                      setIsSigning(false);
                    }}
                    className="text-[10px] text-muted underline"
                  >
                    クリア
                  </button>
                </div>
                {!isSigning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-zinc-300 tracking-wider">ここに署名してください</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted">
                ※ タッチまたはマウスで署名をご記入ください
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-risk-high/30 text-risk-high text-xs p-3 text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setStep((s) => s - 1)}
              disabled={isSaving}
            >
              戻る
            </button>
          )}

          {step < TOTAL_STEPS && (
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!canProceed()}
              onClick={() => {
                if (step === 3) {
                  goToRisk();
                } else {
                  setStep((s) => s + 1);
                }
              }}
            >
              次へ
            </button>
          )}

          {step === TOTAL_STEPS && (
            <button
              type="button"
              className="btn-primary flex-1 relative"
              disabled={isSaving}
              onClick={handleSubmit}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  保存中...
                </span>
              ) : (
                '同意して保存'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
