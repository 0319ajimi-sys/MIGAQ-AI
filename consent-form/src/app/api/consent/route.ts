import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const d = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('consent_forms')
      .insert({
        customer_name:       d.customerName,
        customer_phone:      d.customerPhone || null,
        treatment_date:      d.treatmentDate,
        stylist_name:        d.stylistName,
        requested_treatment: d.requestedTreatment,
        has_black_dye:       d.hasBlackDye,
        black_dye_months:    d.hasBlackDye ? (parseInt(d.blackDyeMonths) || null) : null,
        has_bleach:          d.hasBleach,
        bleach_months:       d.hasBleach ? (parseInt(d.bleachMonths) || null) : null,
        has_straightening:   d.hasStraightening,
        straightening_months: d.hasStraightening ? (parseInt(d.straighteningMonths) || null) : null,
        risk_level:          d.riskLevel,
        risk_items:          d.riskItems,
        consent_risk:        d.consentRisk,
        consent_no_claim:    d.consentNoClaim,
        consent_history:     d.consentHistory,
        signature_data:      d.signatureDataUrl,
      })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
