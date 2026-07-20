export default async function handler(request, response) {
  // Tes apakah API aktif
  if (request.method === "GET") {
    return response.status(200).json({
      success: true,
      message: "ASURA API Gemini aktif",
    });
  }

  // Hanya menerima POST
  if (request.method !== "POST") {
    return response.status(405).json({
      success: false,
      message: "Method tidak diizinkan",
    });
  }

  try {
    // Cek API key Gemini
    if (!process.env.GEMINI_API_KEY) {
      return response.status(500).json({
        success: false,
        message: "GEMINI_API_KEY belum terbaca di Vercel",
      });
    }

    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body || {};

    const videoUrl = body.videoUrl || "";
    const productUrl = body.productUrl || "";
    const notes = body.notes || "";

    if (!videoUrl && !productUrl && !notes) {
      return response.status(400).json({
        success: false,
        message: "Materi analisis masih kosong",
      });
    }

    const prompt = `
Kamu adalah ASURA Content Analyzer.

Analisis materi konten affiliate atau iklan berikut:

Link video:
${videoUrl || "Tidak tersedia"}

Link produk:
${productUrl || "Tidak tersedia"}

Catatan konten:
${notes || "Tidak tersedia"}

Berikan nilai dari 0 sampai 100 untuk:

- hook
- retention
- visual
- sellingPower
- cta
- overall
- winningChance
- viralPotential
- contentQuality

Berikan juga:

- prediction
- summary
- strengths
- weaknesses
- recommendations

Gunakan Bahasa Indonesia.

Jangan mengarang isi video apabila video tidak dapat dilihat.
Jika data kurang lengkap, jelaskan keterbatasannya.
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini error:", data);

      return response.status(geminiResponse.status).json({
        success: false,
        message:
          data?.error?.message ||
          "Permintaan ke Gemini gagal",
      });
    }

    const outputText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      return response.status(500).json({
        success: false,
        message: "Hasil Gemini tidak dapat dibaca",
      });
    }

    const analysis = JSON.parse(outputText);

    return response.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("ASURA API error:", error);

    return response.status(500).json({
      success: false,
      message:
        error.message ||
        "Terjadi kesalahan pada server",
    });
  }
}
