import { classifyGeminiTransportError } from './gemini-network-error';
import { extractGeminiInteractionText } from './gemini-interactions';
import { postGeminiInteraction } from './gemini-https';
import { getServerAISettings } from '@/lib/admin/ai-settings';

export interface AIProvider {
  generateReflectionQuestions(input: ReflectionQuestionInput): Promise<ReflectionQuestionOutput>;
  analyzeLearning(input: LearningAnalysisInput): Promise<LearningAnalysisOutput>;
  generateModule(input: ModuleGenerationInput): Promise<ModuleGenerationOutput>;
}

export interface ReflectionQuestionInput {
  subject: string;
  grade: string;
  phase: string;
  topic: string;
  durationMinutes: number;
  cp: { code: string; description: string }[];
  tp: { code: string; description: string; indicators: { id?: string; code: string; description: string; criteria: string }[] }[];
  classInfo: { studentCount: number; characteristics?: string };
}

export interface ReflectionQuestionOutput {
  questions: {
    question: string;
    purpose: string;
    relatedIndicatorIds: string[];
    responseType: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'scale';
    options?: string[];
    required: boolean;
  }[];
}

export interface LearningAnalysisInput {
  session: {
    subject: string;
    grade: string;
    phase: string;
    topic: string;
    date: string;
    durationMinutes: number;
  };
  cp: { code: string; description: string }[];
  tp: {
    id: string;
    code: string;
    description: string;
    indicators: {
      id: string;
      code: string;
      description: string;
      criteria: string;
    }[];
  }[];
  assessmentData: {
    indicatorId: string;
    totalStudents: number;
    studentsWithValidEvidence: number;
    studentsMeetingCriteria: number;
    percentage: number | null;
    status: 'achieved' | 'needs_improvement' | 'insufficient_data';
    scoreDistribution: { score: number; count: number }[];
  }[];
  reflectionAnswers: { question: string; answer: string }[];
  dataCompleteness: {
    indicatorId: string;
    studentsWithData: number;
    studentsWithoutData: number;
  }[];
}

export interface LearningAnalysisOutput {
  summary: string;
  overallInterpretation: string;
  indicatorAnalysis: {
    indicatorId: string;
    status: 'achieved' | 'needs_improvement' | 'insufficient_data';
    evidenceSummary: string;
    learningGap: string;
    interpretation: string;
  }[];
  reflectionAnalysis: {
    strengths: string[];
    challenges: string[];
    alignmentWithAssessment: string;
  };
  studentSupportGroups: {
    studentRef: string;
    relatedIndicatorIds: string[];
    evidenceSummary: string;
    suggestedSupport: string;
  }[];
  recommendations: {
    category: 'remedial' | 'enrichment' | 'teaching_strategy' | 'media' | 'assessment';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    rationale: string;
    relatedIndicatorIds: string[];
  }[];
  limitations: string[];
}

export interface ModuleGenerationInput {
  grade: string;
  phase: string;
  subject: string;
  topic: string;
  duration: string;
  meetingsCount: number;
  cp: { code: string; description: string }[];
  tp: { id: string; code: string; description: string; indicators: { id: string; code: string; description: string; criteria: string }[] }[];
  studentCharacteristics: string;
  learningModel: string;
  learningMethods: string[];
  media: string[];
  additionalInstructions?: string;
  detailLevel?: 'ringkas' | 'lengkap';
  curriculumReferenceKind?: "school_development" | "curriculum_reference";
  officialCpText?: string;
  officialCpSource?: string;
}

export interface ModuleGenerationOutput {
  moduleTitle: string;
  detailLevel?: 'ringkas' | 'lengkap';
  curriculumReference?: { cpText?: string; source?: string; verifiedByTeacher: boolean };
  deepLearning?: { mindful: string[]; meaningful: string[]; joyful: string[]; understand: string[]; apply: string[]; reflect: string[] };
  lessonResources?: { title: string; description: string; source?: string }[];
  worksheets?: { title: string; instructions: string[]; tasks: { question: string; relatedIndicatorCodes: string[] }[]; teacherKey: { answer: string; explanation: string }[] }[];
  assessmentInstruments?: { category: 'diagnostik' | 'formatif' | 'sumatif'; title: string; instructions: string; questions: { number: number; question: string; relatedIndicatorCodes: string[]; answerKey: string; scoringGuide: string }[] }[];
  scoringRubrics?: { title: string; criterion: string; relatedIndicators?: string[]; assessmentTask?: string; evidence?: string; attainmentCriterion?: string; followUp?: string; levels: { label: string; description: string; score: number }[] }[];
  curriculumAlignmentNotes?: string[];
  learningModel?: string;
  learningMethods?: string[];
  learningMedia?: string[];
  identity: {
    grade: string;
    phase: string;
    subject: string;
    topic: string;
    duration: string;
    meetingsCount: number;
  };
  learningOutcomes: { id: string; code: string; description: string }[];
  learningObjectives: {
    id: string;
    code: string;
    description: string;
    indicators: { id: string; code: string; description: string; criteria: string }[];
  }[];
  initialCompetencies: string[];
  meaningfulUnderstanding: string[];
  triggerQuestions: string[];
  learningMaterials: string[];
  learningActivities: {
    introduction: {
      description: string;
      teacherActivity: string;
      studentActivity: string;
      durationMinutes: number;
      relatedObjectiveIds: string[];
    }[];
    main: {
      description: string;
      teacherActivity: string;
      studentActivity: string;
      durationMinutes: number;
      relatedObjectiveIds: string[];
    }[];
    closing: {
      description: string;
      teacherActivity: string;
      studentActivity: string;
      durationMinutes: number;
      relatedObjectiveIds: string[];
    }[];
  };
  assessments: {
    diagnostic: { name: string; type: string; technique: string; instrument: string; relatedIndicatorIds: string[]; rubric?: string }[];
    formative: { name: string; type: string; technique: string; instrument: string; relatedIndicatorIds: string[]; rubric?: string }[];
    summative: { name: string; type: string; technique: string; instrument: string; relatedIndicatorIds: string[]; rubric?: string }[];
  };
  differentiation: {
    content: string[];
    process: string[];
    product: string[];
  };
  remedial: string[];
  enrichment: string[];
  teacherReflection: string[];
  studentReflection: string[];
}

export class MockAIProvider implements AIProvider {
  async generateReflectionQuestions(input: ReflectionQuestionInput): Promise<ReflectionQuestionOutput> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const questions = [
      {
        question: 'Apakah tujuan pembelajaran yang ditetapkan telah tercapai oleh sebagian besar peserta didik?',
        purpose: 'Mengevaluasi ketercapaian TP secara keseluruhan',
        relatedIndicatorIds: input.tp.flatMap((t) => t.indicators.map((i) => i.code)),
        responseType: 'long_text' as const,
        required: true,
      },
      {
        question: 'Bagian materi atau konsep apa yang paling sulit dipahami oleh peserta didik?',
        purpose: 'Mengidentifikasi kesulitan belajar spesifik',
        relatedIndicatorIds: [],
        responseType: 'long_text' as const,
        required: true,
      },
      {
        question: 'Metode pembelajaran apa yang paling efektif dalam sesi ini?',
        purpose: 'Mengevaluasi efektivitas strategi pengajaran',
        relatedIndicatorIds: [],
        responseType: 'long_text' as const,
        required: true,
      },
      {
        question: 'Apakah media pembelajaran yang digunakan sudah sesuai dengan karakteristik peserta didik?',
        purpose: 'Mengevaluasi kesesuaian media pembelajaran',
        relatedIndicatorIds: [],
        responseType: 'long_text' as const,
        required: true,
      },
      {
        question: 'Apa kendala utama yang ditemukan selama proses pembelajaran berlangsung?',
        purpose: 'Mengidentifikasi hambatan pembelajaran',
        relatedIndicatorIds: [],
        responseType: 'long_text' as const,
        required: true,
      },
      {
        question: 'Strategi perbaikan apa yang akan Anda lakukan untuk pembelajaran berikutnya?',
        purpose: 'Merencanakan tindak lanjut pembelajaran',
        relatedIndicatorIds: [],
        responseType: 'long_text' as const,
        required: true,
      },
    ];

    return { questions };
  }

  async analyzeLearning(input: LearningAnalysisInput): Promise<LearningAnalysisOutput> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const achievedIndicators = input.assessmentData.filter((d) => d.status === 'achieved');
    const needsImprovementIndicators = input.assessmentData.filter((d) => d.status === 'needs_improvement');
    const insufficientDataIndicators = input.assessmentData.filter((d) => d.status === 'insufficient_data');

    return {
      summary: `Analisis pembelajaran ${input.session.topic} untuk kelas ${input.session.grade} menunjukkan ${achievedIndicators.length} indikator tercapai, ${needsImprovementIndicators.length} indikator perlu perbaikan, dan ${insufficientDataIndicators.length} indikator data tidak cukup.`,
      overallInterpretation: 'Secara keseluruhan, pembelajaran berjalan dengan baik namun terdapat beberapa indikator yang memerlukan perhatian khusus.',
      indicatorAnalysis: input.assessmentData.map((d) => ({
        indicatorId: d.indicatorId,
        status: d.status,
        evidenceSummary: `${d.studentsMeetingCriteria} dari ${d.studentsWithValidEvidence} peserta didik memenuhi kriteria (${d.percentage === null ? 'persentase belum dapat dihitung' : `${d.percentage}%`}).`,
        learningGap:
          d.status === 'needs_improvement'
            ? 'Peserta didik mengalami kesulitan dalam menguasai konsep ini.'
            : d.status === 'insufficient_data'
            ? 'Data asesmen belum tersedia untuk menilai ketercapaian indikator ini.'
            : 'Ketercapaian indikator sudah memenuhi standar.',
        interpretation:
          d.status === 'achieved'
            ? 'Indikator ini telah tercapai dengan baik.'
            : d.status === 'needs_improvement'
            ? 'Diperlukan kegiatan remedial atau penguatan konsep.'
            : 'Perlu mengumpulkan bukti asesmen lebih lanjut.',
      })),
      reflectionAnalysis: {
        strengths: ['Perencanaan pembelajaran terstruktur', 'Penggunaan media yang bervariasi'],
        challenges: ['Keterbatasan waktu untuk diskusi mendalam', 'Perbedaan kecepatan belajar siswa'],
        alignmentWithAssessment:
          'Refleksi guru selaras dengan hasil asesmen pada mayoritas indikator, namun terdapat perbedaan persepsi pada indikator yang memerlukan perbaikan.',
      },
      studentSupportGroups:
        input.assessmentData
          .filter((d) => d.status === 'needs_improvement')
          .flatMap((d) =>
            Array.from({ length: Math.min(3, d.totalStudents - d.studentsMeetingCriteria) }, (_, i) => ({
              studentRef: `anon-${d.indicatorId}-${i + 1}`,
              relatedIndicatorIds: [d.indicatorId],
              evidenceSummary: `Skor di bawah kriteria ketercapaian pada indikator ${d.indicatorId}`,
              suggestedSupport: 'Pendampingan kelompok kecil dengan latihan bertahap',
            }))
          ),
      recommendations: [
        {
          category: 'remedial',
          priority: 'high',
          title: 'Penguatan Konsep untuk Indikator Belum Tercapai',
          description: 'Lakukan kegiatan remedial terfokus pada indikator yang belum tercapai menggunakan pendekatan bertahap.',
          rationale: 'Berdasarkan data asesmen, terdapat peserta didik yang belum memenuhi kriteria ketercapaian.',
          relatedIndicatorIds: needsImprovementIndicators.map((d) => d.indicatorId),
        },
        {
          category: 'enrichment',
          priority: 'medium',
          title: 'Kegiatan Pengayaan untuk Peserta Didik yang Sudah Tercapai',
          description: 'Berikan tugas tingkat lanjut atau proyek mini untuk memperdalam pemahaman.',
          rationale: 'Sebagian peserta didik telah mencapai kriteria dan berpotensi untuk pengayaan.',
          relatedIndicatorIds: achievedIndicators.map((d) => d.indicatorId),
        },
        {
          category: 'teaching_strategy',
          priority: 'medium',
          title: 'Penerapan Differensiasi Pembelajaran',
          description: 'Sesuaikan kecepatan dan kedalaman materi sesuai kebutuhan individual peserta didik.',
          rationale: 'Terdapat perbedaan kecepatan belajar yang signifikan antar peserta didik.',
          relatedIndicatorIds: [],
        },
      ],
      limitations: [
        'Data asesmen sumatif belum tersedia untuk semua indikator',
        'Jumlah sampel asesmen formatif terbatas',
      ],
    };
  }

  async generateModule(input: ModuleGenerationInput): Promise<ModuleGenerationOutput> {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      moduleTitle: `Modul Ajar ${input.subject}: ${input.topic}`,
      learningModel: input.learningModel,
      learningMethods: input.learningMethods,
      learningMedia: input.media,
      identity: {
        grade: input.grade,
        phase: input.phase,
        subject: input.subject,
        topic: input.topic,
        duration: input.duration,
        meetingsCount: input.meetingsCount,
      },
      learningOutcomes: input.cp.map((c) => ({ id: c.code, code: c.code, description: c.description })),
      learningObjectives: input.tp.map((t) => ({
        id: t.code,
        code: t.code,
        description: t.description,
        indicators: t.indicators.map((i) => ({ id: i.code, code: i.code, description: i.description, criteria: i.criteria })),
      })),
      initialCompetencies: [
        'Peserta didik telah memahami konsep dasar terkait topik ini',
        'Peserta didik memiliki kemampuan berpikir kritis tingkat dasar',
      ],
      meaningfulUnderstanding: [
        'Memahami konsep inti dan hubungannya dengan kehidupan sehari-hari',
        'Mampun menerapkan pemahaman dalam memecahkan masalah kontekstual',
      ],
      triggerQuestions: [
        'Apa yang sudah kalian ketahui tentang topik ini?',
        'Bagaimana topik ini relevan dengan kehidupan kalian?',
      ],
      learningMaterials: [
        'Konsep dasar dan definisi kunci',
        'Contoh aplikasi dalam kehidupan nyata',
        'Langkah-langkah pemecahan masalah',
      ],
      learningActivities: {
        introduction: [
          {
            description: 'Apersepsi dan motivasi',
            teacherActivity: 'Mengajukan pertanyaan pemantik, mengaitkan dengan pengalaman siswa',
            studentActivity: 'Menjawab pertanyaan, berbagi pengalaman',
            durationMinutes: 10,
            relatedObjectiveIds: input.tp.map((t) => t.code),
          },
        ],
        main: [
          {
            description: 'Eksplorasi konsep',
            teacherActivity: 'Memfasilitasi diskusi kelompok, memberikan scaffolding',
            studentActivity: 'Berdiskusi dalam kelompok, mencari informasi, mempresentasikan hasil',
            durationMinutes: 30,
            relatedObjectiveIds: input.tp.map((t) => t.code),
          },
          {
            description: 'Latihan terstruktur',
            teacherActivity: 'Memberikan contoh soal, mengarahkan pengerjaan',
            studentActivity: 'Mengerjakan soal latihan, bertanya jika mengalami kesulitan',
            durationMinutes: 25,
            relatedObjectiveIds: input.tp.map((t) => t.code),
          },
        ],
        closing: [
          {
            description: 'Refleksi dan penutup',
            teacherActivity: 'Mengarah refleksi, memberikan umpan balik, menginformasikan tugas',
            studentActivity: 'Merefleksikan pembelajaran, mencatat tugas',
            durationMinutes: 10,
            relatedObjectiveIds: input.tp.map((t) => t.code),
          },
        ],
      },
      assessments: {
        diagnostic: [
          {
            name: 'Kuis Awal',
            type: 'formatif',
            technique: 'Tes tertulis',
            instrument: 'Soal pilihan ganda 10 butir',
            relatedIndicatorIds: input.tp.flatMap((t) => t.indicators.map((i) => i.code)),
          },
        ],
        formative: [
          {
            name: 'Observasi Kegelompokan',
            type: 'formatif',
            technique: 'Observasi',
            instrument: 'Rubrik observasi kolaborasi',
            relatedIndicatorIds: input.tp.flatMap((t) => t.indicators.map((i) => i.code)),
          },
          {
            name: 'Latihan Individu',
            type: 'formatif',
            technique: 'Tes tertulis',
            instrument: 'Soal uraian 5 butir',
            relatedIndicatorIds: input.tp.flatMap((t) => t.indicators.map((i) => i.code)),
            rubric: 'Rubrik holistik 1-4',
          },
        ],
        summative: [
          {
            name: 'Evaluasi Akhir Bab',
            type: 'sumatif',
            technique: 'Tes tertulis',
            instrument: 'Soal campuran 20 butir',
            relatedIndicatorIds: input.tp.flatMap((t) => t.indicators.map((i) => i.code)),
            rubric: 'Kunci jawaban dan rubrik skor',
          },
        ],
      },
      differentiation: {
        content: ['Menyediakan materi tambahan untuk siswa cepat tanggap', 'Menyederhanakan bahasa untuk siswa yang butuh bantuan'],
        process: ['Mengelompokkan siswa berdasarkan kemampuan', 'Memberikan scaffolding yang bervariasi'],
        product: ['Menerima berbagai bentuk jawaban (tulisan, gambar, presentasi)', 'Menyesuaikan kriteria penilaian'],
      },
      remedial: [
        'Latihan tambahan dengan panduan langkah demi langkah',
        'Pembelajaran teman sebaya (peer tutoring)',
        'Konsultasi individu di luar jam pelajaran',
      ],
      enrichment: [
        'Proyek mini penerapan konsep',
        'Soal tingkat pemecahan masalah non-rutin',
        'Penelitian sederhana terkait topik',
      ],
      teacherReflection: [
        'Apakah alokasi waktu cukup untuk setiap kegiatan?',
        'Apakah metode yang digunakan efektif untuk seluruh siswa?',
        'Apa yang perlu diperbaiki untuk pertemuan selanjutnya?',
      ],
      studentReflection: [
        'Apa yang paling sulit dipahami hari ini?',
        'Bagaimana cara belajar yang paling membantu saya?',
        'Apa yang ingin saya pelajari lebih dalam?',
      ],
    };
  }
}

type RemoteProvider = 'anthropic' | 'openai' | 'gemini';

class RemoteAIProvider implements AIProvider {
  constructor(
    private readonly provider: RemoteProvider,
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  private async generateJson<T>(systemPrompt: string, input: unknown, maxTokens = 5000): Promise<T> {
    const prompt = `${systemPrompt}\n\nKONTEKS INPUT (JSON):\n${JSON.stringify(input)}\n\nKeluarkan satu objek JSON valid saja. Jangan gunakan markdown fence, jangan tambahkan teks di luar JSON.`;
    const endpoint = this.provider === 'anthropic'
      ? 'https://api.anthropic.com/v1/messages'
      : this.provider === 'gemini'
        ? 'https://generativelanguage.googleapis.com/v1beta/interactions'
        : 'https://api.openai.com/v1/chat/completions';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    let requestBody: Record<string, unknown>;

    if (this.provider === 'anthropic') {
      delete headers.Authorization;
      headers['x-api-key'] = this.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      requestBody = {
        model: this.model,
        max_tokens: maxTokens,
        temperature: 0.25,
        system: 'Anda adalah asisten pedagogis LENTERA. Gunakan Bahasa Indonesia yang jelas, objektif, dan menghormati peserta didik. Ikuti instruksi sistem secara ketat.',
        messages: [{ role: 'user', content: prompt }],
      };
    } else if (this.provider === 'gemini') {
      delete headers.Authorization;
      headers['x-goog-api-key'] = this.apiKey;
      // Google AI Studio Get code uses Interactions API (not :generateContent).
      // No google_search tool: student/school context must not be sent to web search.
      requestBody = {
        model: this.model.replace(/^models\//, ''),
        input: `Anda adalah asisten pedagogis LENTERA untuk SD kelas 1 sampai 6. Jawab HANYA objek JSON valid berbahasa Indonesia.\n\n${prompt}`,
        generation_config: { max_output_tokens: maxTokens },
      };
    } else {
      requestBody = {
        model: this.model,
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Anda adalah asisten pedagogis LENTERA. Gunakan Bahasa Indonesia. Hanya berikan JSON valid.' },
          { role: 'user', content: prompt },
        ],
      };
    }

    let response: Response;
    try {
      const send = (url: string) => fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60_000),
        cache: 'no-store',
      });
      response = this.provider === 'gemini'
        ? await postGeminiInteraction(this.apiKey, requestBody, 65_000)
        : await send(endpoint);
    } catch (error) {
      // Do not log raw errors: Node fetch exceptions may contain request URLs.
      const transport = classifyGeminiTransportError(error);
      console.error('LENTERA AI transport failure', { provider: this.provider, code: transport.code, reason: transport.reason });
      throw new Error(`${transport.code}: ${transport.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      // Do not log or return raw upstream bodies: providers may include sensitive request context.
      const diagnostic = response.status === 429 ? 'AI_LIMIT' : response.status === 401 || response.status === 403 ? 'AI_AUTH' : response.status === 404 ? 'AI_MODEL_NOT_FOUND' : response.status >= 500 ? 'AI_UPSTREAM' : 'AI_REQUEST_REJECTED';
      console.error('LENTERA AI provider request failed', { provider: this.provider, status: response.status, code: diagnostic, upstreamCode: (() => { try { return JSON.parse(errorText)?.error?.status || undefined; } catch { return undefined; } })() });
      throw new Error(`${diagnostic}: ${this.provider} HTTP ${response.status}`);
    }

    let payload: any;
    try {
      payload = await response.json();
    } catch {
      throw new Error('AI_OUTPUT_INVALID: Respons provider bukan JSON HTTP yang valid.');
    }

    // Interactions returns steps[type=model_output].content[type=text], not candidates.
    const rawContent = this.provider === 'anthropic'
      ? (payload.content || []).filter((part: { type?: string }) => part.type === 'text').map((part: { text?: string }) => part.text || '').join('\n')
      : this.provider === 'gemini'
        ? extractGeminiInteractionText(payload)
        : payload.choices?.[0]?.message?.content;

    if (typeof rawContent !== 'string' || !rawContent.trim()) {
      throw new Error('AI_OUTPUT_EMPTY: Provider AI mengembalikan respons tanpa teks.');
    }

    const normalized = rawContent.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try {
      return JSON.parse(normalized) as T;
    } catch {
      throw new Error('AI_OUTPUT_INVALID: Provider AI mengembalikan JSON yang tidak valid.');
    }
  }

  async generateReflectionQuestions(input: ReflectionQuestionInput): Promise<ReflectionQuestionOutput> {
    return this.generateJson<ReflectionQuestionOutput>(
      `Buat 5 sampai 7 pertanyaan refleksi guru yang kontekstual berdasarkan CP, TP, indikator, materi, dan karakteristik kelas. Setiap pertanyaan memiliki: question (string), purpose (string), relatedIndicatorIds (array berisi ID indikator yang benar-benar tersedia; jangan mengarang ID), responseType (short_text, long_text, single_choice, multiple_choice, atau scale), options (array opsional), required (boolean). Jika tidak ada ID indikator, relatedIndicatorIds harus array kosong. Pertanyaan harus membantu guru melihat bukti pembelajaran, hambatan, dan tindak lanjut.`,
      input,
      3000,
    );
  }

  async analyzeLearning(input: LearningAnalysisInput): Promise<LearningAnalysisOutput> {
    return this.generateJson<LearningAnalysisOutput>(
      `Analisis pembelajaran berdasarkan data yang diberikan. Jangan membuat angka, nilai, jumlah siswa, ataupun fakta baru. Angka dan status kuantitatif harus mengikuti assessmentData apa adanya. Bedakan fakta bukti dan interpretasi. Untuk tiap indikator keluarkan indicatorId, status (achieved, needs_improvement, insufficient_data), evidenceSummary, learningGap, interpretation. Keluarkan summary, overallInterpretation, reflectionAnalysis (strengths, challenges, alignmentWithAssessment), studentSupportGroups (gunakan referensi anonim dan jangan menebak identitas), recommendations (category remedial/enrichment/teaching_strategy/media/assessment, priority high/medium/low, title, description, rationale, relatedIndicatorIds), dan limitations. Jika data tidak cukup, nyatakan dengan jelas dan jangan membuat kesimpulan. Jangan menyebut peserta didik gagal atau memberi label permanen.`,
      input,
      5000,
    );
  }

  async generateModule(input: ModuleGenerationInput): Promise<ModuleGenerationOutput> {
    return this.generateJson<ModuleGenerationOutput>(
      `Susun MODUL AJAR SD KELAS 1-6 dalam Bahasa Indonesia yang dapat langsung ditinjau Guru. Acuan kebijakan: Kurikulum yang berlaku sesuai Permendikdasmen 13/2025 (perubahan Permendikbudristek 12/2024), Panduan Pembelajaran dan Asesmen revisi 2025, dan pendekatan pembelajaran mendalam (berkesadaran, bermakna, menggembirakan). Jangan mengklaim satu model pedagogi wajib untuk semua kondisi.
Jika curriculumReferenceKind adalah school_development, officialCpText adalah usulan pengembangan sekolah, BUKAN CP nasional. Jangan menyebutnya sebagai CP resmi atau mengatribusikannya pada peraturan nasional. Susun TP dan indikator sesuai usia dan nyatakan perlu persetujuan sekolah.
KETENTUAN KURIKULUM: CP resmi hanya boleh berasal dari input cp atau officialCpText yang diberikan Guru, kecuali acuan school_development yang tidak boleh disebut CP resmi. JANGAN mengarang, mengutip palsu, atau menciptakan kode CP, ATP, TP, atau sumber peraturan. Bila input CP kosong, learningOutcomes=[] dan curriculumAlignmentNotes wajib memuat 'Rumusan CP resmi belum diverifikasi oleh Guru; lengkapi sebelum menggunakan modul'. Jika TP tidak diberikan, boleh mengusulkan tujuan operasional sebagai DRAF tanpa ID kurikulum (id dan code string kosong), dan catat bahwa TP perlu konfirmasi Guru. Gunakan indikator yang sudah diberikan, jangan membuat ID indikator seolah tersimpan di database.
WAJIB hasil JSON dengan properti dasar: moduleTitle; identity (grade,phase,subject,topic,duration,meetingsCount); learningOutcomes (id,code,description); learningObjectives (id,code,description,indicators id,code,description,criteria); initialCompetencies; meaningfulUnderstanding; triggerQuestions; learningMaterials; learningActivities (introduction/main/closing berupa array, item description,teacherActivity,studentActivity,durationMinutes,relatedObjectiveIds); assessments (diagnostic/formative/summative masing-masing array item name,type,technique,instrument,relatedIndicatorIds,rubric); differentiation (content,process,product); remedial; enrichment; teacherReflection; studentReflection. Semua waktu kegiatan realistis untuk durasi, dan pembelajaran sesuai usia.
Untuk detailLevel 'lengkap' TAMBAHKAN bagian nyata (jangan hanya menyebut nama): deepLearning {mindful,meaningful,joyful,understand,apply,reflect} berisi aktivitas operasional; lessonResources (2-4 objek title,description,source opsional, jangan mengarang URL atau judul buku khusus); worksheets (1 objek {title,instructions:[2-4],tasks:[{question,relatedIndicatorCodes}] 3-5 butir,teacherKey:[{answer,explanation}] untuk setiap butir}); assessmentInstruments (diagnostik,formatif,sumatif masing-masing 1 objek {category,title,instructions,questions:[{number,question,relatedIndicatorCodes,answerKey,scoringGuide}]} dengan 2-3 soal tiap jenis); scoringRubrics (rubrik analitik, 3-5 kriteria terpisah yang mencakup setiap indikator TP; setiap objek {title,criterion,relatedIndicators:[deskripsi indikator persis dari learningObjectives atau kode yang memang tersedia],assessmentTask,evidence,attainmentCriterion,followUp,levels:[{label,description,score}]} ); curriculumAlignmentNotes (array catatan validasi dan keterkaitan tujuan-kegiatan-asesmen). RUBRIK ANALITIK WAJIB untuk modul lengkap: setiap kriteria memiliki tepat empat tingkat skor 4 (Sangat Baik), 3 (Baik), 2 (Perlu Bimbingan), 1 (Perlu Pendampingan Intensif), dengan deskriptor berbeda yang menyebut perilaku/hasil kerja yang dapat diamati, akurasi, kualitas strategi atau tingkat bantuan sesuai tugas. Hindari deskriptor hanya berupa kata sifat. Gunakan jumlah butir yang sesuai dengan instrumen yang benar-benar dibuat; jangan mengarang hasil siswa. Hubungkan tiap kriteria ke indikator dan tugas nyata, jelaskan bukti yang diperiksa, kriteria ketercapaian yang diusulkan untuk ditinjau Guru, dan tindak lanjut spesifik. Gunakan skor 1-4 per kriteria dengan bobot sama; jangan menganggap bukti yang belum ada sebagai skor 1. Jangan menilai kepribadian siswa. Untuk modul ringkas, bila rubrik disertakan, gunakan struktur yang sama dengan jumlah kriteria sesuai kebutuhan. Soal, kunci jawaban, dan rubrik harus konsisten secara matematis dan usia. Kunci jawaban hanya lampiran GURU, bukan lembar siswa.
Untuk detailLevel 'ringkas', properti tambahan di atas boleh array kosong / objek kosong, prioritaskan bagian inti. Gunakan model dan metode yang DIPILIH Guru bila tersedia; jika kosong, jangan klaim telah dipilih. Hindari data siswa pribadi, asumsi kondisi individual, konten diskriminatif, dan jargon tanpa praktik konkret. Jangan menambahkan tools Google Search.`,
      input,
      12000,
    );
  }
}

export async function createAIProvider(): Promise<AIProvider> {
  const settings = await getServerAISettings();
  if (!settings.isConfigured) {
    throw new Error('AI_NOT_CONFIGURED: Isi GEMINI_API_KEY dan GEMINI_MODEL pada environment server.');
  }
  return new RemoteAIProvider('gemini', settings.apiKey, settings.model);
}
