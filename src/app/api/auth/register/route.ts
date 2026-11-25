import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  let admin: ReturnType<typeof createSupabaseAdmin<any>> | null = null;
  let rollbackUserId: string | null = null;

  const rollback = async () => {
    if (admin && rollbackUserId) {
      const { error } = await admin.auth.admin.deleteUser(rollbackUserId);
      if (error) console.error('Could not roll back pending auth user:', error.message);
    }
  };

  try {
    const body = await request.json();
    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim() || null;
    const userId = String(body.user_id || '').trim();
    const invitationCode = String(body.invitation_code || '').trim();
    const childNis = String(body.child_nis || '').trim() || null;
    const role = String(body.role || 'wali_murid');

    if (role !== 'wali_murid') {
      return NextResponse.json({ error: 'Akun Guru dan Kepala Sekolah diterbitkan oleh pengelola sekolah.' }, { status: 403 });
    }
    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !userId || !invitationCode) {
      return NextResponse.json({ error: 'Data pendaftaran belum lengkap atau formatnya tidak valid.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secretKey) {
      return NextResponse.json({ error: 'Konfigurasi server belum lengkap. Periksa SUPABASE_SECRET_KEY.' }, { status: 503 });
    }

    admin = createSupabaseAdmin<any>(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    // Confirm that the UUID really belongs to the email submitted by the signup flow.
    const { data: authRecord, error: authError } = await admin.auth.admin.getUserById(userId);
    if (authError || !authRecord.user || authRecord.user.email?.toLowerCase() !== email) {
      return NextResponse.json({ error: 'Sesi pendaftaran tidak valid. Ulangi proses pendaftaran.' }, { status: 400 });
    }

    // Mark the newly-created signup user for cleanup if any database step fails.
    rollbackUserId = userId;

    const { data: existingProfile, error: profileLookupError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (profileLookupError) throw profileLookupError;
    if (existingProfile) {
      // Never delete an account that already has a profile.
      rollbackUserId = null;
      return NextResponse.json({ error: 'Akun ini sudah memiliki profil. Silakan masuk.' }, { status: 409 });
    }

    const tokenHash = createHash('sha256').update(invitationCode).digest('hex');
    const { error: registrationError } = await admin.rpc('register_parent_account', {
      p_user_id: userId,
      p_full_name: fullName,
      p_email: email,
      p_phone: phone,
      p_invitation_token_hash: tokenHash,
      p_child_nis: childNis,
    });

    if (registrationError) {
      const message = registrationError.message || '';
      await rollback();
      rollbackUserId = null;

      if (message.includes('INVITATION_INVALID')) {
        return NextResponse.json({ error: 'Kode undangan tidak valid, sudah digunakan, atau telah kedaluwarsa.' }, { status: 400 });
      }
      if (message.includes('CHILD_NIS_MISMATCH')) {
        return NextResponse.json({ error: 'NIS anak tidak sesuai dengan kode undangan.' }, { status: 400 });
      }
      if (message.includes('PROFILE_EXISTS')) {
        return NextResponse.json({ error: 'Profil untuk akun ini sudah tersedia. Silakan masuk.' }, { status: 409 });
      }
      console.error('Parent account registration RPC failed:', message);
      return NextResponse.json({ error: 'Profil belum berhasil disimpan. Periksa migrasi database lalu coba lagi.' }, { status: 500 });
    }

    rollbackUserId = null;
    return NextResponse.json({
      ok: true,
      message: 'Pendaftaran berhasil. Periksa email untuk verifikasi akun sebelum masuk.',
      verificationRequired: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration request failed:', error);
    await rollback();
    return NextResponse.json({ error: 'Pendaftaran belum berhasil disimpan. Periksa koneksi dan migrasi Supabase, lalu coba kembali.' }, { status: 500 });
  }
}
