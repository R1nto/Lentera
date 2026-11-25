import { rubricWarnings } from '@/lib/module-rubric';
import { cpSubjectMatches } from '@/lib/cp-catalog-match';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/services/ai/ai-provider';
import { getServerAISettings } from '@/lib/admin/ai-settings';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Show actionable, non-secret errors to the teacher. Full diagnostics stay server-side. */
function moduleErrorResponse(error: unknown, stage: 'authentication' | 'validation' | 'ai' | 'storage' | 'logging' | 'unknown' = 'unknown') {
  const details = error && typeof error === 'object' ? error as { code?: string; status?: number; message?: string; name?: string } : {};
  const code = details.code || '';
  const message = details.message || '';
  console.error('Module creation failed:', {
    stage,
    code: code || undefined,
    name: details.name || undefined,
    status: details.status || undefined,
    // Do not print API keys, AI request bodies, or student information.
    message: message.slice(0, 240),
  });

  if (message.startsWith('AI_AUTH:')) return NextResponse.json({ error: 'Akses Gemini ditolak. Periksa API key dan project Google AI Studio melalui Admin.', code: 'AI_AUTH' }, { status: 502 });
  if (message.startsWith('AI_LIMIT:')) return NextResponse.json({ error: 'Provider AI membatasi permintaan atau kuota. Periksa kuota Gemini dan billing proyek.', code: 'AI_LIMIT' }, { status: 429 });
  if (message.startsWith('AI_MODEL_NOT_FOUND:')) return NextResponse.json({ error: 'Model Gemini tidak ditemukan atau tidak tersedia untuk API key ini. Periksa GEMINI_MODEL pada environment server.', code: 'AI_MODEL_NOT_FOUND' }, { status: 502 });
  if (message.startsWith('AI_REQUEST_REJECTED:')) return NextResponse.json({ error: 'Gemini menolak permintaan. Periksa kesesuaian model, parameter, dan batas masukan; lihat kode respons pada log server.', code: 'AI_REQUEST_REJECTED' }, { status: 502 });
  if (message.startsWith('AI_UPSTREAM:')) return NextResponse.json({ error: 'Layanan Gemini sedang mengalami gangguan. Coba lagi setelah layanan pulih.', code: 'AI_UPSTREAM' }, { status: 502 });
  if (message.startsWith('AI_OUTPUT_TRUNCATED:')) return NextResponse.json({ error: 'Jawaban Gemini terpotong karena batas token. Coba topik yang lebih spesifik atau kurangi rincian masukan.', code: 'AI_OUTPUT_TRUNCATED' }, { status: 502 });
  if (message.startsWith('AI_OUTPUT_BLOCKED:')) return NextResponse.json({ error: 'Gemini tidak memberikan keluaran karena pembatasan konten. Periksa masukan dan coba ulang.', code: 'AI_OUTPUT_BLOCKED' }, { status: 422 });
  if (message.startsWith('AI_OUTPUT_EMPTY:')) return NextResponse.json({ error: 'Gemini tidak mengirimkan isi modul. Periksa model di Admin dan coba kembali.', code: 'AI_OUTPUT_EMPTY' }, { status: 502 });
  if (message.startsWith('AI_OUTPUT_INVALID:')) return NextResponse.json({ error: 'Respons AI tidak berupa JSON modul yang valid. Coba gunakan topik lebih singkat atau model lain.', code: 'AI_OUTPUT_INVALID' }, { status: 502 });
  if (message.startsWith('AI_TIMEOUT:')) return NextResponse.json({ error: 'Permintaan ke Gemini melewati batas waktu. Coba lagi.', code: 'AI_TIMEOUT' }, { status: 504 });
  if (message.startsWith('AI_DNS:')) return NextResponse.json({ error: 'DNS server gagal menemukan host Gemini. Periksa DNS/VPN/proxy server.', code: 'AI_DNS' }, { status: 502 });
  if (message.startsWith('AI_TLS:')) return NextResponse.json({ error: 'Koneksi sertifikat HTTPS Gemini gagal. Periksa jaringan/proxy server.', code: 'AI_TLS' }, { status: 502 });
  if (message.startsWith('AI_CONNECTION:')) return NextResponse.json({ error: 'Koneksi ke Gemini ditolak atau terputus. Periksa firewall/VPN/proxy.', code: 'AI_CONNECTION' }, { status: 502 });
  if (message.startsWith('AI_NETWORK:')) return NextResponse.json({ error: 'Server tidak dapat menjangkau Gemini. Periksa koneksi server dan coba lagi.', code: 'AI_NETWORK' }, { status: 502 });

  if (code === '42501') return NextResponse.json({ error: 'Database menolak akses modul ajar. Periksa GRANT service_role untuk tabel yang tercatat di terminal server.', code }, { status: 503 });
  if (code === '42P01') return NextResponse.json({ error: 'Tabel modul ajar belum tersedia. Periksa migrasi Supabase.', code }, { status: 503 });
  if (code === '42703') return NextResponse.json({ error: 'Struktur kolom database tidak cocok dengan source code. Periksa migrasi Supabase.', code }, { status: 503 });
  if (code === '23503') return NextResponse.json({ error: 'Referensi kelas, mata pelajaran, atau akun tidak ditemukan di database.', code }, { status: 409 });
  if (code === '23505') return NextResponse.json({ error: 'Data modul sudah terdaftar (duplikat).', code }, { status: 409 });

  if (message.includes('Mock AI is disabled in production')) {
    return NextResponse.json({ error: 'Mode AI Demo tidak dapat digunakan di production. Admin harus mengaktifkan provider AI dengan model dan API key yang valid.', code: 'AI_NOT_CONFIGURED' }, { status: 503 });
  }
  if (message.includes('Provider AI belum lengkap') || message.includes('Unsupported AI provider')) {
    return NextResponse.json({ error: 'Pengaturan AI belum lengkap. Periksa provider, model, dan API key pada panel Admin.', code: 'AI_NOT_CONFIGURED' }, { status: 503 });
  }
  if (message.includes('Supabase server secret belum dikonfigurasi')) {
    return NextResponse.json({ error: 'Konfigurasi koneksi database server belum lengkap. Hubungi Admin.', code: 'SERVER_CONFIG' }, { status: 503 });
  }
  if (message.includes('AI provider') && (message.includes('returned 401') || message.includes('returned 403'))) {
    return NextResponse.json({ error: 'Kredensial provider AI ditolak. Admin perlu memeriksa API key.', code: 'AI_AUTH' }, { status: 503 });
  }
  if (message.includes('AI provider') && message.includes('returned 429')) {
    return NextResponse.json({ error: 'Batas penggunaan atau kuota AI tercapai. Periksa billing dan coba lagi.', code: 'AI_LIMIT' }, { status: 503 });
  }
  if (message.includes('AI provider returned invalid JSON') || message.includes('AI provider returned an empty response')) {
    return NextResponse.json({ error: 'AI mengirim hasil yang tidak dapat diproses. Silakan coba lagi.', code: 'AI_OUTPUT' }, { status: 502 });
  }
  if (details.name === 'TimeoutError' || details.name === 'AbortError') {
    return NextResponse.json({ error: 'Permintaan AI melewati batas waktu. Silakan coba lagi.', code: 'AI_TIMEOUT' }, { status: 504 });
  }
  return NextResponse.json({ error: `Pembuatan modul ajar gagal pada tahap ${stage === 'ai' ? 'generasi AI' : stage === 'storage' ? 'penyimpanan database' : stage === 'authentication' ? 'autentikasi' : 'proses server'}. Periksa log terminal (Module creation failed) tanpa membagikan kredensial.`, code: code || 'MODULE_SERVER_ERROR', stage }, { status: 500 });
}

export async function POST(request: NextRequest) {
  let stage: 'authentication' | 'validation' | 'ai' | 'storage' | 'logging' | 'unknown' = 'authentication';
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await createServiceClient();
    const { data: profile, error: profileError } = await service.from('profiles').select('role, school_id').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== 'guru') {
      return NextResponse.json({ error: 'Fitur pembuatan modul hanya tersedia untuk Guru.' }, { status: 403 });
    }
    if (!profile.school_id) {
      return NextResponse.json({ error: 'Akun belum terhubung dengan sekolah. Hubungi pengelola sekolah.' }, { status: 409 });
    }

    stage = 'validation';
    const body = await request.json();
    const {
      grade,
      phase,
      subject_id,
      class_id,
      topic,
      duration,
      meetings_count,
      cp_ids,
      tp_ids,
      student_characteristics,
      learning_model,
      learning_methods,
      media,
      additional_instructions,
      detail_level, official_cp_text, official_cp_source, catalog_cp_id,
    } = body;

    // Validate required fields
    const expectedPhase = grade === '1' || grade === '2' ? 'A' : grade === '3' || grade === '4' ? 'B' : grade === '5' || grade === '6' ? 'C' : null;
    if (!uuid.test(String(class_id || '')) || !expectedPhase || phase !== expectedPhase || !uuid.test(String(subject_id || ''))) {
      return NextResponse.json({ error: 'Modul Ajar SD wajib memilih kelas 1–6, fase yang benar, dan mata pelajaran.' }, { status: 400 });
    }
    if (!duration || !meetings_count || !topic) {
      return NextResponse.json({ error: 'Isi topik, durasi, dan jumlah pertemuan.' }, { status: 400 });
    }

    const [{ data: assigned, error: assignmentError }, { data: selectedClass, error: classError }, { data: selectedSubject, error: subjectError }] = await Promise.all([
      service.from('teacher_classes').select('id,subject_id').eq('teacher_id', user.id).eq('class_id', class_id),
      service.from('classes').select('school_id,grade,phase').eq('id', class_id).maybeSingle(),
      service.from('subjects').select('id,name,code').eq('id', subject_id).maybeSingle(),
    ]);
    if (assignmentError || classError || subjectError) throw assignmentError || classError || subjectError;
    const classAllowed = (assigned || []).some((row) => row.subject_id === null || row.subject_id === subject_id);
    if (!classAllowed || selectedClass?.school_id !== profile.school_id || String(selectedClass?.grade) !== String(grade) || selectedClass?.phase !== phase) {
      return NextResponse.json({ error: 'Kelas/mata pelajaran tidak ditugaskan kepada Guru atau fase tidak sesuai.' }, { status: 403 });
    }
    if (!selectedSubject) return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan.' }, { status: 400 });
    if (typeof topic !== 'string' || topic.trim().length < 3 || !Number.isInteger(meetings_count) || meetings_count < 1 || meetings_count > 20) {
      return NextResponse.json({ error: 'Topik atau jumlah pertemuan tidak valid.' }, { status: 400 });
    }

    // Service client bypasses RLS; always verify curriculum IDs against this
    // teacher's school, subject and phase before forwarding them to an AI vendor.
    const cpIds = Array.isArray(cp_ids) ? cp_ids : [];
    const tpIds = Array.isArray(tp_ids) ? tp_ids : [];
    if (cpIds.length > 100 || tpIds.length > 100 ||
        !cpIds.every((id: unknown) => typeof id === 'string' && uuid.test(id)) ||
        !tpIds.every((id: unknown) => typeof id === 'string' && uuid.test(id))) {
      return NextResponse.json({ error: 'Daftar CP/TP tidak valid.' }, { status: 400 });
    }
    const { data: tpData, error: tpError } = tpIds.length
      ? await service.from('learning_objectives')
          .select('id,code,description,learning_outcome_id,learning_indicators(id,code,description,criteria)')
          .in('id', tpIds)
      : { data: [], error: null };
    if (tpError) throw tpError;
    if ((tpData || []).length !== new Set(tpIds).size)
      return NextResponse.json({ error: 'Salah satu TP tidak ditemukan.' }, { status: 400 });
    const allCpIds = Array.from(new Set([...cpIds, ...(tpData || []).map((tp) => tp.learning_outcome_id)]));
    const { data: cpRows, error: cpError } = allCpIds.length
      ? await service.from('learning_outcomes')
          .select('id,code,description,school_id,subject_id,phase').in('id', allCpIds)
      : { data: [], error: null };
    if (cpError) throw cpError;
    if ((cpRows || []).length !== allCpIds.length ||
        (cpRows || []).some((cp) => cp.school_id !== profile.school_id || cp.subject_id !== subject_id || cp.phase !== phase)) {
      return NextResponse.json({ error: 'CP/TP harus berasal dari sekolah, mapel, dan fase yang sesuai.' }, { status: 403 });
    }
    const cpData = (cpRows || []).filter((cp) => cpIds.includes(cp.id));

    if (detail_level !== undefined && !['ringkas', 'lengkap'].includes(detail_level)) return NextResponse.json({ error: 'Pilihan jenis modul tidak valid.' }, { status: 400 });
    if ((official_cp_text !== undefined && (typeof official_cp_text !== 'string' || official_cp_text.length > 3000)) || (official_cp_source !== undefined && (typeof official_cp_source !== 'string' || official_cp_source.length > 300))) return NextResponse.json({ error: 'Teks atau sumber CP terlalu panjang/tidak valid.' }, { status: 400 });
    let verifiedCatalogCp: null | {id:string;reference_code:string;subject_name:string;cp_excerpt:string;source_title:string;source_url:string;source_version:string;element:string} = null;
    if (catalog_cp_id) {
      if (typeof catalog_cp_id !== 'string' || !uuid.test(catalog_cp_id)) return NextResponse.json({ error:'ID katalog CP tidak valid.' }, { status: 400 });
      const { data: catalogRecord, error: catalogError } = await service.from('curriculum_cp_catalog')
        .select('id,reference_code,subject_name,phase,element,cp_excerpt,source_title,source_url,source_version,active')
        .eq('id',catalog_cp_id).maybeSingle();
      if (catalogError) throw catalogError;
      if (!catalogRecord?.active || !cpSubjectMatches(selectedSubject.name, selectedSubject.code || '', catalogRecord.subject_name) || catalogRecord.phase !== phase) {
        return NextResponse.json({ error:'CP katalog tidak sesuai mata pelajaran/fase atau sudah tidak aktif.' }, { status: 403 });
      }
      verifiedCatalogCp = catalogRecord;
    }
    // CP teks yang dimasukkan Guru tidak disimpan sebagai CP kurikulum resmi di DB.
    // Guru harus tetap meninjau sumber dan kesesuaian fase/mapel.
    const schoolDevelopment = verifiedCatalogCp?.source_version.startsWith("SEKOLAH-") === true;
    if (schoolDevelopment && allCpIds.length) return NextResponse.json({error: "Jangan gabungkan usulan pengembangan sekolah dengan CP/TP nasional dalam satu referensi."}, {status: 400});
    // Prepare AI input
    const aiInput = {
      grade,
      phase,
      subject: verifiedCatalogCp?.subject_name || selectedSubject.name,
      topic,
      duration,
      meetingsCount: meetings_count,
      cp: cpData.map((cp) => ({ code: cp.code, description: cp.description })),
      tp: tpData?.map((tp) => ({
        id: tp.id,
        code: tp.code,
        description: tp.description,
        indicators: (tp.learning_indicators || []).map((ind) => ({
          id: ind.id,
          code: ind.code,
          description: ind.description,
          criteria: ind.criteria,
        })),
      })) || [],
      studentCharacteristics: student_characteristics || '',
      learningModel: learning_model || '',
      learningMethods: learning_methods || [],
      media: media || [],
      additionalInstructions: additional_instructions || '',
      detailLevel: detail_level === 'ringkas' ? 'ringkas' : 'lengkap',
      curriculumReferenceKind: schoolDevelopment ? "school_development" : "curriculum_reference",
      officialCpText: verifiedCatalogCp?.cp_excerpt || String(official_cp_text || '').trim(),
      officialCpSource: verifiedCatalogCp ? `${verifiedCatalogCp.source_title} (${verifiedCatalogCp.source_version})` : String(official_cp_source || '').trim(),
    };

    // Call AI
    stage = 'ai';
    const aiProvider = await createAIProvider();
    const generated = await aiProvider.generateModule(aiInput);
    // Save the teacher's selections with the AI output itself, so old/new PDF readers
    // can display the model and methods without a separate database migration.
    // LENTERA never treats invented CP identifiers as official curriculum records.
    // When the teacher supplies a CP quotation, it is retained as a teacher-supplied
    // draft reference, not silently inserted into the curriculum catalog.
    const authoritativeOutcomes = cpData.length
      ? cpData.map(cp => ({ id: cp.id, code: cp.code, description: cp.description }))
      : aiInput.officialCpText
        ? [{ id: '', code: '', description: aiInput.officialCpText }]
        : [];
    const normalizedObjectives = Array.isArray(generated.learningObjectives)
      ? generated.learningObjectives.map(tp => ({
          ...tp,
          // Suggested objectives are not database learning_objectives IDs.
          ...(tpData?.length ? {} : { id: '', code: '' }),
          indicators: Array.isArray(tp.indicators)
            ? tp.indicators.map(ind => ({ ...ind, ...(tpData?.length ? {} : { id: '', code: '' }) }))
            : [],
        }))
      : [];
    const missingInComplete = aiInput.detailLevel === 'lengkap'
      ? [
          !Array.isArray(generated.worksheets) || !generated.worksheets.length ? 'LKPD' : '',
          !Array.isArray(generated.assessmentInstruments) || !generated.assessmentInstruments.length ? 'instrumen asesmen' : '',
          !Array.isArray(generated.scoringRubrics) || !generated.scoringRubrics.length ? 'rubrik' : '',
        ].filter(Boolean)
      : [];
    const result = {
      ...generated,
      learningOutcomes: authoritativeOutcomes,
      learningObjectives: normalizedObjectives,
      generationWarnings: [
        ...(missingInComplete.length ? [`AI belum menyertakan ${missingInComplete.join(', ')}; Guru perlu melengkapi sebelum digunakan.`] : []),
        ...(aiInput.detailLevel === 'lengkap' ? rubricWarnings(generated.scoringRubrics) : []),
      ],
      learningModel: aiInput.learningModel,
      learningMethods: aiInput.learningMethods,
      learningMedia: aiInput.media,
      detailLevel: aiInput.detailLevel,
      curriculumReference: {
        referenceKind: schoolDevelopment ? "Pengembangan sekolah (draf, bukan CP nasional)" : "Referensi CP kurikulum",
        cpText: aiInput.officialCpText,
        source: aiInput.officialCpSource,
        verifiedByTeacher: false,
        catalogCpId: verifiedCatalogCp?.id || null,
        referenceCode: verifiedCatalogCp?.reference_code || null,
        sourceUrl: verifiedCatalogCp?.source_url || null,
        excerptOnly: Boolean(verifiedCatalogCp) && !schoolDevelopment,
        summaryNotFullText: Boolean(verifiedCatalogCp) && !schoolDevelopment,
      },
      curriculumAlignmentNotes: [
        ...(schoolDevelopment ? ["Acuan ini merupakan usulan pengembangan sekolah, bukan CP nasional; perlu persetujuan sekolah."] : []),
        ...(Array.isArray(generated.curriculumAlignmentNotes) ? generated.curriculumAlignmentNotes : []),
        ...(cpData.length || aiInput.officialCpText ? [] : ['CP resmi belum dicantumkan: Guru perlu memverifikasi terhadap dokumen kurikulum sekolah sebelum modul digunakan.']),
      ],
    };

    // Create module record
    stage = 'storage';
    const { data: module, error: moduleError } = await service
      .from('teaching_modules')
      .insert({
        teacher_id: user.id,
        school_id: profile.school_id,
        class_id: class_id || null,
        subject_id,
        title: result.moduleTitle,
        grade,
        phase,
        duration,
        meetings_count,
        learning_outcome_ids: cpIds,
        learning_objective_ids: tpIds,
        status: 'draft',
        content: result,
      })
      .select()
      .single();

    if (moduleError) return moduleErrorResponse(moduleError, stage);

    // Log generation (non-blocking: a log permissions issue must not hide a saved module)
    stage = 'logging';
    const aiSettings = await getServerAISettings();
    const { error: logError } = await service.from('module_generation_logs').insert({
      module_id: module.id,
      provider: aiSettings.provider,
      model: aiSettings.model || 'unspecified',
      prompt_version: '1.0',
      generation_status: 'success',
    });
    if (logError) console.warn('Module generation log failed:', { code: logError.code, message: logError.message.slice(0, 160) });

    return NextResponse.json({ module });
  } catch (error) {
    return moduleErrorResponse(error, stage);
  }
}