export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskResult {
  level: RiskLevel;
  items: string[];
}

export function generateRisk(
  hasBlackDye: boolean,
  blackDyeMonths: number,
  hasBleach: boolean,
  bleachMonths: number,
  hasStraightening: boolean,
  straighteningMonths: number,
  treatment: string
): RiskResult {
  const items: string[] = [];
  let score = 0;

  const isBleachTx = treatment.includes('ブリーチ');
  const isColorTx  = treatment.includes('カラー') || treatment.includes('ポイント');
  const isPermTx   = treatment.includes('パーマ');
  const isStraightTx = treatment.includes('縮毛');

  // ─── 黒染め ──────────────────────────────────────────────────
  if (hasBlackDye) {
    if (blackDyeMonths <= 3) {
      score += 5;
      items.push(
        '【要注意】3ヶ月以内の黒染め履歴があります。ブリーチ・カラーを施術しても希望の明るさにならず、オレンジ・黄緑が残る可能性が非常に高いです。'
      );
    } else if (blackDyeMonths <= 6) {
      score += 3;
      items.push(
        '6ヶ月以内の黒染め履歴があります。カラーの発色が部分的にムラになる場合があります。'
      );
    } else {
      score += 1;
      items.push('黒染め履歴があります。カラーの発色に影響する場合があります。');
    }
    if (isBleachTx) {
      score += 3;
      items.push(
        '黒染め後のブリーチは均一に脱色されにくく、1回の施術で希望の明るさに到達できない場合があります。複数回の施術が必要になる可能性があります。'
      );
    }
    if (isColorTx && !isBleachTx) {
      score += 1;
      items.push('黒染め後のカラーは通常より発色が抑えられる場合があります。');
    }
  }

  // ─── ブリーチ ─────────────────────────────────────────────────
  if (hasBleach) {
    if (bleachMonths <= 3) {
      score += 4;
      items.push(
        `直近3ヶ月以内のブリーチ履歴があります。毛髪ダメージが高い状態のため、断毛・切れ毛が生じるリスクがあります。`
      );
    } else {
      score += 2;
      items.push(
        `ブリーチ履歴（${bleachMonths}ヶ月前）があります。毛髪がダメージを受けており、追加施術でさらに傷む可能性があります。`
      );
    }
  }

  // ─── 縮毛矯正 ─────────────────────────────────────────────────
  if (hasStraightening) {
    score += 2;
    items.push(
      '縮毛矯正の履歴があります。薬剤の相互作用により、意図しない仕上がりになる場合があります。'
    );
    if (isPermTx) {
      score += 3;
      items.push(
        '【要注意】縮毛矯正後のパーマ施術は、パーマがかかりにくい・または過剰ダメージのリスクがあります。'
      );
    }
    if (isStraightTx && straighteningMonths <= 6) {
      score += 1;
      items.push('縮毛矯正の重ね施術は、既施術部分へのダメージ蓄積に注意が必要です。');
    }
  }

  // ─── 複合リスク ───────────────────────────────────────────────
  const chemCount = [hasBlackDye, hasBleach, hasStraightening].filter(Boolean).length;
  if (chemCount >= 2) {
    score += 2;
    items.push(
      '複数の薬剤施術履歴があります。化学的な複合リスクにより、施術結果の予測が困難になります。担当スタイリストと十分にご相談ください。'
    );
  }

  // ─── 共通事項 ─────────────────────────────────────────────────
  items.push(
    'アレルギー反応（かゆみ・赤み・腫れ等）が現れた場合は直ちに施術を中断し、医療機関を受診してください。'
  );
  items.push(
    '施術後のホームケアが仕上がりの持ちに大きく影響します。担当スタイリストの指示に従ってください。'
  );

  const level: RiskLevel = score >= 6 ? 'high' : score >= 2 ? 'medium' : 'low';
  return { level, items };
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  low:    '低リスク',
  medium: '中リスク',
  high:   '高リスク',
};
