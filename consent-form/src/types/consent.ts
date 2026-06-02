export type RiskLevel = 'low' | 'medium' | 'high';

export interface TreatmentHistoryData {
  hasBlackDye: boolean;
  blackDyeMonthsAgo: string;
  blackDyeTimes: string;
  blackDyeDetails: string;

  hasBleach: boolean;
  bleachMonthsAgo: string;
  bleachTimes: string;
  bleachDetails: string;

  hasStraightening: boolean;
  straighteningMonthsAgo: string;
  straighteningTimes: string;
  straighteningDetails: string;

  hasOtherChemical: boolean;
  otherChemicalDetails: string;
}

export interface ConsentChecks {
  understoodRisk: boolean;
  noClaim: boolean;
  accurateHistory: boolean;
  photoConsent: boolean;
  contactPermission: boolean;
}

export interface ConsentFormData {
  // Step 1
  customerName: string;
  customerPhone: string;
  treatmentDate: string;
  stylistName: string;

  // Step 2
  requestedTreatment: string;
  referenceImageFile?: File;
  referenceImagePreview?: string;
  referenceImageUrl?: string;

  // Step 3
  history: TreatmentHistoryData;

  // Step 4 (computed + user checks)
  riskLevel: RiskLevel;
  riskItems: string[];
  consents: ConsentChecks;

  // Step 5
  signatureDataUrl?: string;
}

export interface SavedConsentForm {
  id: string;
  createdAt: string;
  customerName: string;
  treatmentDate: string;
  pdfUrl?: string;
  gdriveUrl?: string;
}

export const TREATMENT_OPTIONS = [
  'カット',
  'カラー（全体）',
  'カラー（リタッチ）',
  'ブリーチ（全体）',
  'ブリーチ（ハイライト）',
  'パーマ',
  '縮毛矯正',
  'トリートメント',
  'ヘアセット',
  'ポイントカラー',
  'バレイヤージュ',
  'その他',
] as const;
