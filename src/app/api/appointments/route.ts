import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ehtugrfasxlybuxtbgyc.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_qzC1SYMTmcFrMB58OBm12Q_ONI_Aik8';

const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = serverSupabase
      .from('appointments')
      .select('*, patients(*), doctors(*)')
      .order('created_at', { ascending: false });

    if (date && date !== 'undefined') query = query.eq('appointment_date', date);
    if (doctorId && doctorId !== 'ALL' && doctorId !== 'loading' && doctorId !== 'undefined') {
      query = query.eq('doctor_id', doctorId);
    }
    if (patientId && patientId !== 'undefined') query = query.eq('patient_id', patientId);
    if (from) query = query.gte('appointment_date', from);
    if (to) query = query.lte('appointment_date', to);

    const { data, error } = await query;
    if (error) {
      console.error('Server API error fetching appointments:', error.message);
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error('API /api/appointments error:', err);
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
  }
}
