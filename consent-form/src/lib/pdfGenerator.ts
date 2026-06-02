export interface PDFInput {
  customerName: string;
  customerPhone: string;
  hasBlackDye: boolean;
  hasBleach: boolean;
  hasStraightening: boolean;
  hasSelfColor: boolean;
  desiredColor: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  riskItems: string[];
  understood: boolean;
  signatureDataUrl: string;
}

const RISK_LABEL: Record<string, string> = {
  none:   '',
  low:    '低リスク',
  medium: '中リスク',
  high:   '高リスク',
};

const RISK_COLOR: Record<string, string> = {
  none:   '#555',
  low:    '#2E7D32',
  medium: '#E65100',
  high:   '#B71C1C',
};

export async function generatePDF(d: PDFInput): Promise<Blob> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const today     = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const riskColor = RISK_COLOR[d.riskLevel] ?? RISK_COLOR.none;

  const historyRows = [
    { label: '黒染め',       has: d.hasBlackDye },
    { label: 'ブリーチ',     has: d.hasBleach },
    { label: '縮毛矯正',     has: d.hasStraightening },
    { label: 'セルフカラー', has: d.hasSelfColor },
  ];

  // ── HTML テンプレート ─────────────────────────────────────────────────────
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'left:-9999px', 'top:0',
    'width:740px', 'padding:52px',
    'background:#fff',
    "font-family:'Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif",
    'font-size:13px', 'color:#111', 'line-height:1.7',
    'box-sizing:border-box',
  ].join(';');

  el.innerHTML = `
    <!-- ヘッダー -->
    <div style="border-bottom:2px solid #111;padding-bottom:18px;margin-bottom:26px;
      display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div style="font-size:8px;letter-spacing:5px;color:#AAA;margin-bottom:5px;
          text-transform:uppercase;">Migaq Impression Salon</div>
        <div style="font-size:26px;font-weight:700;letter-spacing:2px;">施術同意書</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#777;">${today}</div>
    </div>

    <!-- お客様情報 -->
    <div style="border:1px solid #E8E8E8;padding:16px;margin-bottom:24px;">
      <div style="font-size:8px;letter-spacing:3px;color:#AAA;margin-bottom:10px;
        text-transform:uppercase;">お客様情報</div>
      <div style="margin-bottom:6px;">
        <span style="color:#AAA;display:inline-block;width:76px;">氏名</span>
        <strong style="font-size:16px;">${d.customerName} 様</strong>
      </div>
      <div>
        <span style="color:#AAA;display:inline-block;width:76px;">電話番号</span>
        ${d.customerPhone || '—'}
      </div>
    </div>

    <!-- 希望カラー -->
    ${d.desiredColor ? `
    <div style="margin-bottom:24px;">
      <div style="font-size:8px;letter-spacing:3px;color:#AAA;border-bottom:1px solid #EBEBEB;
        padding-bottom:6px;margin-bottom:10px;text-transform:uppercase;">希望カラー</div>
      <div style="font-size:15px;font-weight:500;">${d.desiredColor}</div>
    </div>` : ''}

    <!-- 施術履歴 -->
    <div style="margin-bottom:24px;">
      <div style="font-size:8px;letter-spacing:3px;color:#AAA;border-bottom:1px solid #EBEBEB;
        padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;">施術履歴</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${historyRows.map(r => `
          <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;
            border:1px solid ${r.has ? '#111' : '#EBEBEB'};
            background:${r.has ? '#FAFAFA' : '#FFF'};">
            <span style="font-size:11px;color:${r.has ? '#111' : '#CCC'};">
              ${r.has ? '■' : '□'}
            </span>
            <span style="font-size:12px;color:${r.has ? '#111' : '#BBB'};">
              ${r.label}
            </span>
          </div>`).join('')}
      </div>
    </div>

    <!-- リスク説明 -->
    <div style="margin-bottom:24px;border-left:3px solid ${riskColor};padding-left:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="font-size:8px;letter-spacing:3px;color:#AAA;text-transform:uppercase;">
          リスク説明
        </div>
        ${d.riskLevel !== 'none' ? `
          <span style="border:1px solid ${riskColor};color:${riskColor};
            font-size:8px;font-weight:700;padding:2px 10px;letter-spacing:2px;">
            ${RISK_LABEL[d.riskLevel]}
          </span>` : ''}
      </div>
      ${d.riskItems.map(item => `
        <div style="display:flex;gap:8px;font-size:11px;color:#444;line-height:1.8;margin-bottom:5px;">
          <span style="color:#AAA;flex-shrink:0;">—</span>
          <span>${item}</span>
        </div>`).join('')}
    </div>

    <!-- 同意 -->
    <div style="margin-bottom:24px;">
      <div style="font-size:8px;letter-spacing:3px;color:#AAA;border-bottom:1px solid #EBEBEB;
        padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;">同意</div>
      <div style="display:flex;align-items:flex-start;gap:10px;padding:12px;
        border:1px solid ${d.understood ? '#111' : '#EBEBEB'};
        background:${d.understood ? '#FAFAFA' : '#FFF'};">
        <div style="width:16px;height:16px;border:1.5px solid ${d.understood ? '#111' : '#CCC'};
          background:${d.understood ? '#111' : '#FFF'};display:flex;align-items:center;
          justify-content:center;flex-shrink:0;margin-top:2px;">
          ${d.understood ? '<span style="color:#FFF;font-size:10px;">✓</span>' : ''}
        </div>
        <span style="font-size:12px;line-height:1.8;">
          上記リスク説明の内容を理解しました。施術履歴を正確に申告し、
          施術後の返金・過剰なやり直し要求は行いません。
        </span>
      </div>
    </div>

    <!-- 電子署名 -->
    <div style="margin-bottom:28px;">
      <div style="font-size:8px;letter-spacing:3px;color:#AAA;border-bottom:1px solid #EBEBEB;
        padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;">電子署名</div>
      <div style="border:1px solid #D8D8D8;padding:8px;background:#FAFAFA;display:inline-block;">
        <img src="${d.signatureDataUrl}" style="height:80px;max-width:280px;display:block;" />
      </div>
      <div style="font-size:9px;color:#AAA;margin-top:6px;">
        署名日時：${new Date().toLocaleString('ja-JP')}
      </div>
    </div>

    <!-- フッター -->
    <div style="border-top:1px solid #EBEBEB;padding-top:14px;
      font-size:9px;color:#AAA;text-align:center;">
      本書面は電子的に作成されました。MIGAQ Impression Salon
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
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW   = pdf.internal.pageSize.getWidth();
    const pageH   = pdf.internal.pageSize.getHeight();
    const imgH    = (canvas.height * pageW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
    } else {
      let y = 0;
      while (y < imgH) {
        pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH);
        y += pageH;
        if (y < imgH) pdf.addPage();
      }
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(el);
  }
}
