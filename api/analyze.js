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

   if (!process.env.GEMINI_API_KEY) {
  return Response.json(
    {
      success: false,
      message: "GEMINI_API_KEY belum terbaca di Vercel"
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

     const data = await geminiResponse.json();

if (!geminiResponse.ok) {
  console.error("Gemini error:", data);

  return Response.json(
    {
      success: false,
      message:
        data?.error?.message ||
        "Permintaan ke Gemini gagal",
    },
    {
      status: geminiResponse.status,
    }
  );
}

const outputText =
  data?.candidates?.[0]?.content?.parts?.[0]?.text;

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
