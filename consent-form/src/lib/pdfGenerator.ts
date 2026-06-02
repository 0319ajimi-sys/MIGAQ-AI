import type { RiskLevel } from './riskGenerator';
import { RISK_LABEL } from './riskGenerator';

interface PDFInput {
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
  signatureDataUrl: string;
}

export async function generatePDF(d: PDFInput): Promise<Blob> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const riskColor =
    d.riskLevel === 'high' ? '#B71C1C' :
    d.riskLevel === 'medium' ? '#E65100' : '#2E7D32';

  const histRow = (label: string, has: boolean, months: string) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ddd;font-weight:600;">${label}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;">${has ? `あり（${months || '?'}ヶ月前）` : 'なし'}</td>
    </tr>`;

  const checkRow = (label: string, checked: boolean) => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0;">
      <div style="width:14px;height:14px;border:1.5px solid ${checked ? '#0A0A0A' : '#ccc'};
        background:${checked ? '#0A0A0A' : '#fff'};flex-shrink:0;margin-top:2px;
        display:flex;align-items:center;justify-content:center;">
        ${checked ? '<span style="color:#fff;font-size:9px;line-height:1;">✓</span>' : ''}
      </div>
      <span style="font-size:11px;">${label}</span>
    </div>`;

  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'left:-9999px', 'top:0',
    'width:740px', 'padding:48px',
    'background:#fff',
    "font-family:'Hiragino Kaku Gothic ProN','Noto Sans JP',Meiryo,'Yu Gothic',sans-serif",
    'font-size:12px', 'color:#111', 'line-height:1.7',
    'box-sizing:border-box',
  ].join(';');

  el.innerHTML = `
    <!-- ヘッダー -->
    <div style="border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px;
      display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div style="font-size:9px;letter-spacing:4px;color:#999;margin-bottom:4px;">
          MIGAQ IMPRESSION SALON
        </div>
        <div style="font-size:22px;font-weight:700;letter-spacing:1px;">施術同意書</div>
      </div>
      <div style="text-align:right;font-size:10px;color:#666;">
        <div>施術日：${d.treatmentDate}</div>
        <div>発行：${new Date().toLocaleDateString('ja-JP')}</div>
      </div>
    </div>

    <!-- お客様情報 -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
      <div style="border:1px solid #ddd;padding:12px;">
        <div style="font-size:9px;letter-spacing:2px;color:#999;margin-bottom:6px;">お客様情報</div>
        <div style="margin-bottom:4px;"><span style="color:#777;width:70px;display:inline-block;">氏名</span><strong>${d.customerName} 様</strong></div>
        <div><span style="color:#777;width:70px;display:inline-block;">電話</span>${d.customerPhone || '—'}</div>
      </div>
      <div style="border:1px solid #ddd;padding:12px;">
        <div style="font-size:9px;letter-spacing:2px;color:#999;margin-bottom:6px;">施術情報</div>
        <div style="margin-bottom:4px;"><span style="color:#777;width:70px;display:inline-block;">担当</span>${d.stylistName}</div>
        <div><span style="color:#777;width:70px;display:inline-block;">施術内容</span><strong>${d.requestedTreatment}</strong></div>
      </div>
    </div>

    <!-- 施術履歴 -->
    <div style="margin-bottom:20px;">
      <div style="font-size:9px;letter-spacing:2px;color:#999;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">施術履歴</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tbody>
          ${histRow('黒染め', d.hasBlackDye, d.blackDyeMonths)}
          ${histRow('ブリーチ', d.hasBleach, d.bleachMonths)}
          ${histRow('縮毛矯正', d.hasStraightening, d.straighteningMonths)}
        </tbody>
      </table>
    </div>

    <!-- リスク -->
    <div style="margin-bottom:20px;border-left:3px solid ${riskColor};padding-left:14px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="font-size:9px;letter-spacing:2px;color:#999;">リスク評価</div>
        <span style="border:1px solid ${riskColor};color:${riskColor};
          font-size:10px;font-weight:700;padding:1px 8px;">
          ${RISK_LABEL[d.riskLevel]}
        </span>
      </div>
      ${d.riskItems.map(item => `
        <div style="font-size:10px;line-height:1.7;color:#444;margin-bottom:4px;
          padding-left:10px;position:relative;">
          <span style="position:absolute;left:0;">・</span>${item}
        </div>`).join('')}
    </div>

    <!-- 同意事項 -->
    <div style="margin-bottom:20px;">
      <div style="font-size:9px;letter-spacing:2px;color:#999;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">同意事項</div>
      ${checkRow('上記リスク説明を理解し、施術を依頼します', d.consentRisk)}
      ${checkRow('施術後の返金・過剰なやり直し要求は行いません', d.consentNoClaim)}
      ${checkRow('施術履歴は正確に申告しました', d.consentHistory)}
    </div>

    <!-- 署名 -->
    <div style="margin-bottom:24px;">
      <div style="font-size:9px;letter-spacing:2px;color:#999;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">電子署名</div>
      <div style="border:1px solid #ddd;display:inline-block;padding:4px;background:#fafafa;">
        <img src="${d.signatureDataUrl}" style="height:72px;max-width:260px;display:block;" />
      </div>
      <div style="font-size:9px;color:#999;margin-top:4px;">
        署名日時：${new Date().toLocaleString('ja-JP')}
      </div>
    </div>

    <div style="border-top:1px solid #ddd;padding-top:12px;font-size:9px;color:#999;text-align:center;">
      本書面は電子的に保存されます。MIGAQ Impression Salon
    </div>
  `;

  document.body.appendChild(el);

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
    } else {
      let yOffset = 0;
      while (yOffset < imgH) {
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, imgH);
        yOffset += pageH;
        if (yOffset < imgH) pdf.addPage();
      }
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(el);
  }
}
