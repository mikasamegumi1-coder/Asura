export default {
  async fetch(request) {
    if (request.method === "GET") {
      return Response.json({
        success: true,
        message: "ASURA API aktif"
      });
    }

    if (request.method !== "POST") {
      return Response.json(
        {
          success: false,
          message: "Method tidak diizinkan"
        },
        {
          status: 405
        }
      );
    }

    try {
      if (!process.env.OPENAI_API_KEY) {
        return Response.json(
          {
            success: false,
            message: "OPENAI_API_KEY belum terbaca di Vercel"
          },
          {
            status: 500
          }
        );
      }

      const body = await request.json();

      const videoUrl = body.videoUrl || "";
      const productUrl = body.productUrl || "";
      const notes = body.notes || "";

      if (!videoUrl && !productUrl && !notes) {
        return Response.json(
          {
            success: false,
            message: "Materi analisis masih kosong"
          },
          {
            status: 400
          }
        );
      }

      const prompt = `
Kamu adalah ASURA Content Analyzer, analis konten affiliate
dan iklan video berbahasa Indonesia.

Analisis informasi berikut:

Link video:
${videoUrl || "Tidak tersedia"}

Link produk:
${productUrl || "Tidak tersedia"}

Catatan konten:
${notes || "Tidak tersedia"}

Berikan penilaian objektif dari 0 sampai 100 untuk:
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

Jangan mengarang isi video yang tidak terlihat.
Apabila data tidak cukup, jelaskan keterbatasannya.
Gunakan Bahasa Indonesia.
`;

      const openAIResponse = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization":
              `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-5.6",
            input: prompt,
            text: {
              format: {
                type: "json_schema",
                name: "asura_content_analysis",
                strict: true,
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    hook: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    retention: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    visual: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    sellingPower: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    cta: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    overall: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    winningChance: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    viralPotential: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    contentQuality: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100
                    },
                    prediction: {
                      type: "string"
                    },
                    summary: {
                      type: "string"
                    },
                    strengths: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    },
                    weaknesses: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    },
                    recommendations: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    }
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
                    "recommendations"
                  ]
                }
              }
            }
          })
        }
      );

      const data = await openAIResponse.json();

      if (!openAIResponse.ok) {
        console.error("OpenAI error:", data);

        return Response.json(
          {
            success: false,
            message:
              data?.error?.message ||
              "Permintaan ke OpenAI gagal"
          },
          {
            status: openAIResponse.status
          }
        );
      }

      const outputText = data.output
        ?.flatMap(item => item.content || [])
        ?.find(item => item.type === "output_text")
        ?.text;

      if (!outputText) {
        return Response.json(
          {
            success: false,
            message: "Hasil AI tidak dapat dibaca"
          },
          {
            status: 500
          }
        );
      }

      const analysis = JSON.parse(outputText);

      return Response.json({
        success: true,
        analysis
      });

    } catch (error) {
      console.error("ASURA API error:", error);

      return Response.json(
        {
          success: false,
          message:
            error.message ||
            "Terjadi kesalahan pada server"
        },
        {
          status: 500
        }
      );
    }
  }
};
