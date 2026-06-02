import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('consent_forms')
      .insert({
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        treatment_date: body.treatmentDate,
        stylist_name: body.stylistName,
        requested_treatment: body.requestedTreatment,
        reference_image_url: body.referenceImageUrl ?? null,

        has_black_dye: body.history.hasBlackDye,
        black_dye_months_ago: body.history.hasBlackDye
          ? parseInt(body.history.blackDyeMonthsAgo) || null
          : null,
        black_dye_times: body.history.hasBlackDye
          ? parseInt(body.history.blackDyeTimes) || null
          : null,
        black_dye_details: body.history.blackDyeDetails || null,

        has_bleach: body.history.hasBleach,
        bleach_months_ago: body.history.hasBleach
          ? parseInt(body.history.bleachMonthsAgo) || null
          : null,
        bleach_times: body.history.hasBleach
          ? parseInt(body.history.bleachTimes) || null
          : null,
        bleach_details: body.history.bleachDetails || null,

        has_straightening: body.history.hasStraightening,
        straightening_months_ago: body.history.hasStraightening
          ? parseInt(body.history.straighteningMonthsAgo) || null
          : null,
        straightening_times: body.history.hasStraightening
          ? parseInt(body.history.straighteningTimes) || null
          : null,
        straightening_details: body.history.straighteningDetails || null,

        has_other_chemical: body.history.hasOtherChemical,
        other_chemical_details: body.history.otherChemicalDetails || null,

        risk_level: body.riskLevel,
        risk_items: body.riskItems,

        consent_understood_risk: body.consents.understoodRisk,
        consent_no_claim: body.consents.noClaim,
        consent_accurate_history: body.consents.accurateHistory,
        consent_photo: body.consents.photoConsent,
        consent_contact: body.consents.contactPermission,

        signature_url: body.signatureUrl ?? null,
        signed_at: new Date().toISOString(),

        pdf_url: body.pdfUrl ?? null,
        gdrive_url: body.gdriveUrl ?? null,
        status: 'completed',
      })
      .select('id, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id, createdAt: data.created_at });
  } catch (err) {
    console.error('Save consent error:', err);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
