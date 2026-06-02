import type { TreatmentHistoryData, RiskLevel } from '@/types/consent';

export interface RiskResult {
  level: RiskLevel;
  items: string[];
  score: number;
}

export function generateRisk(
  history: TreatmentHistoryData,
  requestedTreatment: string
): RiskResult {
  const items: string[] = [];
  let score = 0;

  const t = requestedTreatment.toLowerCase();
  const isBleachTx = t.includes('ブリーチ');
  const isColorTx = t.includes('カラー') || t.includes('バレイヤージュ') || t.includes('ポイント');
  const isPermTx = t.includes('パーマ');
  const isStraightTx = t.includes('縮毛');

  // ─── 黒染め履歴 ───────────────────────────────────────────
  if (history.hasBlackDye) {
    const months = parseInt(history.blackDyeMonthsAgo) || 12;
    if (months <= 3) {
      score += 5;
      items.push(
        '【要注意】直近3ヶ月以内の黒染め履歴があります。黒染め染料が毛髪内部に強く残留しており、カラー・ブリーチを施術しても希望の明るさに仕上がらず、緑・オレンジ・黄色系に発色する可能性が非常に高いです。複数回の施術が必要になる場合や、希望色への到達が困難な場合があります。'
      );
    } else if (months <= 6) {
      score += 3;
      items.push(
        '6ヶ月以内の黒染め履歴があります。施術部位により色ムラが生じる可能性があります。希望の明るさや色味に仕上がらない場合があります。'
      );
    } else {
      score += 1;
      items.push(
        '黒染め履歴があります。時間が経過していますが、施術結果に若干影響する可能性があります。'
      );
    }

    if (isBleachTx) {
      score += 3;
      items.push(
        '黒染め後のブリーチ施術は、均一に脱色されず、まだら・オレンジ・黄色が残るリスクが高いです。1回の施術で希望の明るさに到達できない場合があることを予めご了承ください。'
      );
    }
    if (isColorTx && !isBleachTx) {
      score += 1;
      items.push(
        '黒染め後のカラー施術は、発色が通常と異なる場合があります。担当スタイリストと期待する仕上がりを十分にご確認ください。'
      );
    }
  }

  // ─── ブリーチ履歴 ────────────────────────────────────────
  if (history.hasBleach) {
    const months = parseInt(history.bleachMonthsAgo) || 12;
    score += 2;
    if (months <= 3) {
      score += 2;
      items.push(
        '直近3ヶ月以内のブリーチ履歴があります。毛髪が既に相当のダメージを受けている状態です。追加の薬剤施術により断毛・切れ毛・チリつきが生じるリスクがあります。'
      );
    } else {
      items.push(
        'ブリーチ施術履歴があります。毛髪がダメージを受けており、さらなるダメージのリスクがあります。担当スタイリストの施術可否判断に従っていただく場合があります。'
      );
    }
  }

  // ─── 縮毛矯正履歴 ───────────────────────────────────────
  if (history.hasStraightening) {
    const months = parseInt(history.straighteningMonthsAgo) || 12;
    score += 2;
    if (months <= 6) {
      score += 2;
      items.push(
        '縮毛矯正の施術履歴があります。薬剤の化学的相互作用により、パーマ・カラーの発色・定着が予測と異なる場合があります。'
      );
    } else {
      items.push(
        '縮毛矯正の履歴があります。薬剤反応が通常と異なる場合があります。'
      );
    }
    if (isPermTx) {
      score += 3;
      items.push(
        '【要注意】縮毛矯正後のパーマ施術は、薬剤の相性により十分にかからない・または過剰にダメージを受けるリスクがあります。施術後の仕上がりが想定と大きく異なる可能性があります。'
      );
    }
    if (isStraightTx) {
      score += 1;
      items.push(
        '縮毛矯正の重ね施術は、既施術部分へのダメージ蓄積に注意が必要です。'
      );
    }
  }

  // ─── その他の薬剤履歴 ───────────────────────────────────
  if (history.hasOtherChemical) {
    score += 1;
    items.push(
      'その他の薬剤施術履歴があります。使用薬剤の相互作用により予期しない結果が生じる可能性があります。施術前に担当スタイリストへ詳細をお伝えください。'
    );
  }

  // ─── 複合リスク ──────────────────────────────────────────
  const chemCount = [
    history.hasBlackDye,
    history.hasBleach,
    history.hasStraightening,
  ].filter(Boolean).length;
  if (chemCount >= 2) {
    score += 2;
    items.push(
      '複数の薬剤施術履歴があります。化学的な複合リスクにより施術結果の予測精度が低下します。担当スタイリストと十分にカウンセリングを行ってください。'
    );
  }

  // ─── 共通事項（常に表示） ────────────────────────────────
  items.push(
    'かぶれ・アレルギー反応（かゆみ・赤み・腫れ等）が現れた場合は直ちに施術を中断し、医療機関を受診してください。'
  );
  items.push(
    '施術後のホームケア（シャンプー・トリートメント・日々のお手入れ）が仕上がりの持ちに大きく影響します。担当スタイリストの指示に従ってください。'
  );
  items.push(
    '施術の仕上がりは毛髪の状態・施術履歴・個人差により、カウンセリング時の説明と若干異なる場合があります。'
  );

  let level: RiskLevel;
  if (score >= 7) {
    level = 'high';
  } else if (score >= 3) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { level, items, score };
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: '低リスク',
  medium: '中リスク',
  high: '高リスク',
};

export const RISK_COLOR: Record<RiskLevel, string> = {
  low: 'text-risk-low border-risk-low',
  medium: 'text-risk-medium border-risk-medium',
  high: 'text-risk-high border-risk-high',
};
