export default async function handler(req, res) {
  // Mengecek apakah API ASURA aktif
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "ASURA API Gemini aktif",
    });
  }

  // API hanya menerima POST untuk analisis
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak diizinkan",
    });
  }

  try {
    // Mengecek API key Gemini di Vercel
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY belum terbaca di Vercel",
      });
    }

    // Membaca data dari dashboard ASURA
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const videoUrl = body.videoUrl || "";
    const productUrl = body.productUrl || "";
    const notes = body.notes || "";
    const videoMetadata = body.videoMetadata || {};

    // Mengecek apakah pengguna sudah memasukkan materi
    const hasVideoMetadata =
      videoMetadata.fileName ||
      videoMetadata.duration ||
      videoMetadata.width ||
      videoMetadata.height;

    if (!videoUrl && !productUrl && !notes && !hasVideoMetadata) {
      return res.status(400).json({
        success: false,
        message: "Materi analisis masih kosong",
      });
    }

    const prompt = `
Kamu adalah ASURA Content Analyzer.

Tugasmu adalah menganalisis potensi performa konten affiliate
atau konten iklan secara objektif.

DATA KONTEN:

Link video:
${videoUrl || "Tidak tersedia"}

Link produk:
${productUrl || "Tidak tersedia"}

Catatan konten:
${notes || "Tidak tersedia"}

Informasi file video:
- Nama file: ${videoMetadata.fileName || "Tidak tersedia"}
- Durasi: ${videoMetadata.duration || 0} detik
- Resolusi: ${videoMetadata.width || 0} x ${videoMetadata.height || 0}
- Ukuran file: ${videoMetadata.size || 0} byte

Berikan skor dari 0 sampai 100 untuk:

1. hook
2. retention
3. visual
4. sellingPower
5. cta
6. overall
7. winningChance
8. viralPotential
9. contentQuality

Berikan juga:

- prediction: prediksi performa singkat
- summary: ringkasan hasil analisis
- strengths: daftar kelebihan konten
- weaknesses: daftar kekurangan konten
- recommendations: daftar saran perbaikan

ATURAN:

- Gunakan Bahasa Indonesia yang mudah dipahami.
- Semua skor harus berupa angka bulat dari 0 sampai 100.
- Jangan memberikan skor tinggi tanpa alasan yang jelas.
- Jangan mengarang isi video apabila video tidak benar-benar dapat dilihat.
- Jika informasi kurang lengkap, jelaskan keterbatasannya.
- Bedakan Overall Score dengan Winning Chance.
- Overall Score menilai kualitas konten.
- Winning Chance menilai peluang konten menghasilkan performa yang baik.
`;

    // Mengirim permintaan ke Gemini
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            responseMimeType: "application/json",

            responseJsonSchema: {
              type: "object",
              additionalProperties: false,

              properties: {
                hook: {
                  type: "integer",
                },

                retention: {
                  type: "integer",
                },

                visual: {
                  type: "integer",
                },

                sellingPower: {
                  type: "integer",
                },

                cta: {
                  type: "integer",
                },

                overall: {
                  type: "integer",
                },

                winningChance: {
                  type: "integer",
                },

                viralPotential: {
                  type: "integer",
                },

                contentQuality: {
                  type: "integer",
                },

                prediction: {
                  type: "string",
                },

                summary: {
                  type: "string",
                },

                strengths: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },

                weaknesses: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },

                recommendations: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },

              required: [
                "hook",
                "retention",
                "visual",
                "sellingPower",
                "cta",
                "overall",
                "winningChance",
                "viralPotential",
                "contentQuality",
                "prediction",
                "summary",
                "strengths",
                "weaknesses",
                "recommendations",
              ],
            },
          },
        }),
      }
    );

    // Membaca jawaban Gemini
    const data = await geminiResponse.json();

    // Menampilkan pesan error dari Gemini
    if (!geminiResponse.ok) {
      console.error("Gemini API error:", data);

      return res.status(geminiResponse.status).json({
        success: false,
        message:
          data?.error?.message ||
          "Permintaan ke Gemini gagal",
      });
    }

    // Mengambil teks hasil Gemini
    const outputText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      return res.status(500).json({
        success: false,
        message: "Hasil Gemini tidak dapat dibaca",
      });
    }

    // Mengubah hasil JSON Gemini menjadi data JavaScript
    const result = JSON.parse(outputText);

    // Membatasi semua skor agar tetap 0 sampai 100
    const clampScore = (value) => {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return 0;
      }

      return Math.max(0, Math.min(100, Math.round(number)));
    };

    const analysis = {
      hook: clampScore(result.hook),
      retention: clampScore(result.retention),
      visual: clampScore(result.visual),
      sellingPower: clampScore(result.sellingPower),
      cta: clampScore(result.cta),
      overall: clampScore(result.overall),
      winningChance: clampScore(result.winningChance),
      viralPotential: clampScore(result.viralPotential),
      contentQuality: clampScore(result.contentQuality),

      prediction:
        typeof result.prediction === "string"
          ? result.prediction
          : "Belum ada prediksi.",

      summary:
        typeof result.summary === "string"
          ? result.summary
          : "Belum ada ringkasan.",

      strengths: Array.isArray(result.strengths)
        ? result.strengths
        : [],

      weaknesses: Array.isArray(result.weaknesses)
        ? result.weaknesses
        : [],

      recommendations: Array.isArray(result.recommendations)
        ? result.recommendations
        : [],
    };

    // Mengirim hasil ke dashboard ASURA
    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("ASURA API error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Terjadi kesalahan pada server",
    });
  }
}
