import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ehtugrfasxlybuxtbgyc.supabase.co';

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, name, role = 'patient' } = body || {};

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (action === 'signup') {
      const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

      // Auto-confirm user immediately on signup using Admin API
      let userId: string;
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: cleanName, role },
      });

      if (createErr) {
        // If user already registered, force confirm and update password
        if (createErr.message.toLowerCase().includes('already') || createErr.status === 422) {
          const { data: list } = await supabaseAdmin.auth.admin.listUsers();
          const existing = list?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
          if (existing) {
            userId = existing.id;
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              email_confirm: true,
              password,
              user_metadata: { full_name: cleanName, role },
            });
          } else {
            return NextResponse.json({ success: false, error: createErr.message }, { status: 400 });
          }
        } else {
          return NextResponse.json({ success: false, error: createErr.message }, { status: 400 });
        }
      } else {
        userId = created.user.id;
      }

      // Upsert into profiles table
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          role,
        });
      } catch (pErr) {
        console.warn('Profile upsert note:', pErr);
      }

      // If doctor role, check if doctor profile exists
      let doctorId: string | undefined;
      let department: string | undefined;
      if (role === 'doctor') {
        const { data: doc } = await supabaseAdmin
          .from('doctors')
          .select('id, department')
          .ilike('name', `%${cleanName}%`)
          .limit(1)
          .maybeSingle();
        if (doc) {
          doctorId = doc.id;
          department = doc.department;
        }
      }

      // Immediately sign in so client gets a valid Supabase auth session
      const { data: signinData } = await supabasePublic.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      return NextResponse.json({
        success: true,
        session: signinData?.session || null,
        user: {
          id: userId,
          email: cleanEmail,
          name: cleanName,
          role,
          doctorId,
          department,
          roleDesc: role === 'doctor' ? (department || 'Physician') : role === 'admin' ? 'Clinic Operations' : 'Patient Account',
        },
      });
    }

    if (action === 'login') {
      // First attempt standard client login
      let { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // If Supabase reports 'Email not confirmed', auto-confirm right away and re-authenticate!
      if (authError && authError.message.toLowerCase().includes('email not confirmed')) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const existing = list?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
        if (existing) {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, { email_confirm: true });
          const retry = await supabasePublic.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          authData = retry.data;
          authError = retry.error;
        }
      }

      if (authError || !authData?.user) {
        return NextResponse.json(
          { success: false, error: authError?.message || 'Invalid login credentials' },
          { status: 401 }
        );
      }

      // Load profile info
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      const userRole = profile?.role || authData.user.user_metadata?.role || role;
      const userName = profile?.full_name || authData.user.user_metadata?.full_name || cleanEmail.split('@')[0];

      // Ensure profile table is synced
      if (!profile) {
        try {
          await supabaseAdmin.from('profiles').upsert({
            id: authData.user.id,
            email: cleanEmail,
            full_name: userName,
            role: userRole,
          });
        } catch (pErr) {
          console.warn('Profile sync note:', pErr);
        }
      }

      let doctorId: string | undefined;
      let department: string | undefined;
      if (userRole === 'doctor') {
        const { data: doc } = await supabaseAdmin
          .from('doctors')
          .select('id, department')
          .ilike('name', `%${userName}%`)
          .limit(1)
          .maybeSingle();
        if (doc) {
          doctorId = doc.id;
          department = doc.department;
        }
      }

      return NextResponse.json({
        success: true,
        session: authData.session || null,
        user: {
          id: authData.user.id,
          email: cleanEmail,
          name: userName,
          role: userRole,
          doctorId,
          department,
          roleDesc: userRole === 'doctor' ? (department || 'Physician') : userRole === 'admin' ? 'Clinic Operations' : 'Patient Account',
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('API /api/auth unhandled error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Authentication error' }, { status: 500 });
  }
}
