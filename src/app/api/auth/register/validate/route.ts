import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invitationCode = String(body.invitation_code || '').trim();
    const childNis = String(body.child_nis || '').trim();

    if (!invitationCode) {
      return NextResponse.json({ error: 'Masukkan kode undangan dari sekolah.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secretKey) {
      return NextResponse.json({ error: 'Server belum terhubung ke Supabase. Periksa konfigurasi environment.' }, { status: 503 });
    }

    const admin = createSupabaseAdmin(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    const tokenHash = createHash('sha256').update(invitationCode).digest('hex');
    const { data: invitation, error: invitationError } = await admin
      .from('parent_link_invitations')
      .select('id, student_id, expires_at')
      .eq('invitation_token_hash', tokenHash)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (invitationError) {
      console.error('Invitation validation query failed:', invitationError.message);
      return NextResponse.json({ error: 'Undangan belum dapat diperiksa. Coba lagi beberapa saat.' }, { status: 503 });
    }
    if (!invitation) {
      return NextResponse.json({ error: 'Kode undangan tidak valid, sudah digunakan, atau telah kedaluwarsa.' }, { status: 400 });
    }

    const { data: student, error: studentError } = await admin
      .from('students')
      .select('nis, is_active')
      .eq('id', invitation.student_id)
      .maybeSingle();

    if (studentError || !student || !student.is_active) {
      console.error('Invitation student lookup failed:', studentError?.message || 'Student not found or inactive');
      return NextResponse.json({ error: 'Data siswa pada undangan tidak dapat diverifikasi. Hubungi sekolah.' }, { status: 400 });
    }

    if (childNis && student.nis !== childNis) {
      return NextResponse.json({ error: 'NIS anak tidak sesuai dengan kode undangan.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: 'Kode undangan valid.' });
  } catch (error) {
    console.error('Invitation validation failed:', error);
    return NextResponse.json({ error: 'Terjadi kendala saat memeriksa kode undangan.' }, { status: 500 });
  }
}
