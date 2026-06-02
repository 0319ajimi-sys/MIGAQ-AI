import type { ConsentFormData } from '@/types/consent';
import { RISK_LABEL } from './riskGenerator';

export async function generateConsentPDF(data: ConsentFormData): Promise<Blob> {
  const [jsPDFModule, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const jsPDF = jsPDFModule.default;
  const html2canvas = html2canvasModule.default;

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 794px; background: white;
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif;
    font-size: 12px; color: #0A0A0A; padding: 48px;
    box-sizing: border-box;
  `;

  const riskBadgeColor =
    data.riskLevel === 'high' ? '#B71C1C' :
    data.riskLevel === 'medium' ? '#E65100' : '#1B5E20';

  container.innerHTML = `
    <div style="border-bottom: 2px solid #0A0A0A; padding-bottom: 20px; margin-bottom: 24px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div style="font-size:9px; letter-spacing:4px; color:#757575; margin-bottom:4px;">MIGAQ IMPRESSION SALON</div>
          <div style="font-size:22px; font-weight:700; letter-spacing:2px;">施術同意書</div>
        </div>
        <div style="text-align:right; font-size:11px; color:#757575;">
          <div>発行日：${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div>施術日：${data.treatmentDate}</div>
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
      <div style="border:1px solid #E0E0E0; padding:16px;">
        <div style="font-size:9px; letter-spacing:2px; color:#757575; margin-bottom:8px;">お客様情報</div>
        <div style="margin-bottom:6px;"><span style="color:#757575; width:80px; display:inline-block;">お名前</span><strong>${data.customerName} 様</strong></div>
        <div style="margin-bottom:6px;"><span style="color:#757575; width:80px; display:inline-block;">電話番号</span>${data.customerPhone || '—'}</div>
      </div>
      <div style="border:1px solid #E0E0E0; padding:16px;">
        <div style="font-size:9px; letter-spacing:2px; color:#757575; margin-bottom:8px;">施術情報</div>
        <div style="margin-bottom:6px;"><span style="color:#757575; width:80px; display:inline-block;">担当</span>${data.stylistName}</div>
        <div style="margin-bottom:6px;"><span style="color:#757575; width:80px; display:inline-block;">施術内容</span><strong>${data.requestedTreatment}</strong></div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="font-size:9px; letter-spacing:2px; color:#757575; border-bottom:1px solid #E0E0E0; padding-bottom:6px; margin-bottom:12px;">施術履歴</div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
        ${historyBlock('黒染め', data.history.hasBlackDye, data.history.blackDyeMonthsAgo, data.history.blackDyeTimes)}
        ${historyBlock('ブリーチ', data.history.hasBleach, data.history.bleachMonthsAgo, data.history.bleachTimes)}
        ${historyBlock('縮毛矯正', data.history.hasStraightening, data.history.straighteningMonthsAgo, data.history.straighteningTimes)}
      </div>
    </div>

    <div style="margin-bottom:24px; border-left:3px solid ${riskBadgeColor}; padding-left:16px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <div style="font-size:9px; letter-spacing:2px; color:#757575;">リスク評価</div>
        <span style="border:1px solid ${riskBadgeColor}; color:${riskBadgeColor}; font-size:10px; padding:2px 8px; font-weight:700;">${RISK_LABEL[data.riskLevel]}</span>
      </div>
      <div style="font-size:11px; line-height:1.8;">
        ${data.riskItems.map((item) => `<div style="margin-bottom:6px; padding-left:12px; position:relative;"><span style="position:absolute; left:0;">・</span>${item}</div>`).join('')}
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="font-size:9px; letter-spacing:2px; color:#757575; border-bottom:1px solid #E0E0E0; padding-bottom:6px; margin-bottom:12px;">同意確認事項</div>
      ${consentRow('上記リスク説明の内容を十分に理解しました', data.consents.understoodRisk)}
      ${consentRow('施術後の返金・やり直し要求は行いません', data.consents.noClaim)}
      ${consentRow('施術履歴は正確に申告しました', data.consents.accurateHistory)}
      ${consentRow('施術写真のSNS・販促素材への使用に同意します', data.consents.photoConsent)}
      ${consentRow('アフターフォローのご連絡に同意します', data.consents.contactPermission)}
    </div>

    <div style="margin-bottom:32px;">
      <div style="font-size:9px; letter-spacing:2px; color:#757575; border-bottom:1px solid #E0E0E0; padding-bottom:6px; margin-bottom:12px;">電子署名</div>
      <div style="border:1px solid #E0E0E0; padding:8px; display:inline-block;">
        ${data.signatureDataUrl
          ? `<img src="${data.signatureDataUrl}" style="height:80px; max-width:300px;" />`
          : '<div style="width:300px; height:80px; background:#f5f5f5;"></div>'
        }
      </div>
      <div style="font-size:10px; color:#757575; margin-top:6px;">署名日時：${new Date().toLocaleString('ja-JP')}</div>
    </div>

    <div style="border-top:1px solid #E0E0E0; padding-top:16px; font-size:9px; color:#757575; text-align:center;">
      本書面はデジタル署名により電子的に保存されます。MIGAQ Impression Salon
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    } else {
      let heightLeft = pdfHeight;
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        if (heightLeft > 0) pdf.addPage();
      }
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

function historyBlock(
  label: string,
  has: boolean,
  months?: string,
  times?: string
): string {
  if (!has) {
    return `<div style="border:1px solid #E0E0E0; padding:10px;">
      <div style="font-size:10px; font-weight:600; margin-bottom:4px;">${label}</div>
      <div style="color:#757575;">なし</div>
    </div>`;
  }
  return `<div style="border:1px solid #0A0A0A; padding:10px; background:#fafafa;">
    <div style="font-size:10px; font-weight:600; margin-bottom:4px;">${label}</div>
    <div style="font-weight:700; margin-bottom:2px;">あり</div>
    ${months ? `<div style="font-size:10px; color:#555;">${months}ヶ月前 / ${times || '?'}回</div>` : ''}
  </div>`;
}

function consentRow(label: string, checked: boolean): string {
  return `<div style="display:flex; align-items:flex-start; gap:10px; padding:8px 0; border-bottom:1px solid #f0f0f0;">
    <div style="width:16px; height:16px; border:1px solid ${checked ? '#0A0A0A' : '#E0E0E0'}; background:${checked ? '#0A0A0A' : '#fff'}; flex-shrink:0; margin-top:2px; display:flex; align-items:center; justify-content:center;">
      ${checked ? '<span style="color:white; font-size:10px;">✓</span>' : ''}
    </div>
    <div style="font-size:11px;">${label}</div>
  </div>`;
}
