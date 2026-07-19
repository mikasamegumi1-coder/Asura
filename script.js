const videoFileInput = document.getElementById("video-file");
const videoUrlInput = document.getElementById("video-url");
const productUrlInput = document.getElementById("product-url");
const notesInput = document.getElementById("content-notes");

const videoPreview = document.getElementById("video-preview");
const fileInformation = document.getElementById("file-information");

const analyzeButton = document.getElementById("analyze-btn");
const analysisStatus = document.getElementById("analysis-status");
const resultStatus = document.getElementById("result-status");
const resultSection = document.getElementById("result-section");

let selectedVideo = null;
let previewUrl = null;

let videoMetadata = {
  duration: 0,
  width: 0,
  height: 0,
  size: 0
};

/* =========================
   VIDEO UPLOAD & PREVIEW
========================= */

videoFileInput.addEventListener("change", function () {
  const file = this.files[0];

  if (!file) {
    resetVideo();
    return;
  }

  if (!file.type.startsWith("video/")) {
    showStatus("File yang dipilih bukan video.", "error");
    resetVideo();
    return;
  }

  const maximumSize = 250 * 1024 * 1024;

  if (file.size > maximumSize) {
    showStatus("Ukuran video maksimal 250 MB.", "error");
    resetVideo();
    return;
  }

  selectedVideo = file;

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }

  previewUrl = URL.createObjectURL(file);

  videoPreview.src = previewUrl;
  videoPreview.hidden = false;
  videoPreview.load();

  fileInformation.textContent =
    `${file.name} • ${formatFileSize(file.size)}`;

  videoPreview.addEventListener(
    "loadedmetadata",
    function handleMetadata() {
      videoMetadata = {
        duration: videoPreview.duration || 0,
        width: videoPreview.videoWidth || 0,
        height: videoPreview.videoHeight || 0,
        size: file.size
      };

      fileInformation.textContent =
        `${file.name} • ` +
        `${formatFileSize(file.size)} • ` +
        `${formatDuration(videoMetadata.duration)} • ` +
        `${videoMetadata.width}×${videoMetadata.height}`;

      showStatus("Video berhasil dimuat.", "success");
    },
    { once: true }
  );
});

/* =========================
   ANALYZE BUTTON
========================= */
analyzeButton.addEventListener("click", async function () {
  const videoUrl = videoUrlInput.value.trim();
  const productUrl = productUrlInput.value.trim();
  const notes = notesInput.value.trim();

  const hasUploadedVideo = Boolean(selectedVideo);
  const hasVideoUrl = Boolean(videoUrl);

  if (!hasUploadedVideo && !hasVideoUrl) {
    showStatus(
      "Upload video atau masukkan link video terlebih dahulu.",
      "error"
    );
    return;
  }

  if (hasVideoUrl && !isValidUrl(videoUrl)) {
    showStatus("Link video tidak valid.", "error");
    return;
  }

  if (productUrl && !isValidUrl(productUrl)) {
    showStatus("Link produk tidak valid.", "error");
    return;
  }

  setLoading(true);
  showStatus("ASURA sedang menjalankan analisis AI...", "loading");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        videoUrl,
        productUrl,
        notes,
        videoMetadata: {
          fileName: selectedVideo?.name || "",
          duration: videoMetadata.duration,
          width: videoMetadata.width,
          height: videoMetadata.height,
          size: videoMetadata.size
        }
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Analisis AI gagal dijalankan."
      );
    }

    const analysis = data.analysis;

    const scores = {
      hook: analysis.hook,
      retention: analysis.retention,
      visual: analysis.visual,
      selling: analysis.sellingPower,
      cta: analysis.cta,
      overall: analysis.overall,
      winning: analysis.winningChance,
      viral: analysis.viralPotential,
      quality: analysis.contentQuality
    };

    updateDashboard(scores);
    showAIResult(analysis);

    showStatus("Analisis AI selesai.", "success");

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } catch (error) {
    console.error(error);

    showStatus(
      error.message || "Terjadi kesalahan saat menghubungi AI.",
      "error"
    );
  } finally {
    setLoading(false);
  }
});
/* =========================
   SCORING ENGINE
========================= */

function calculateScores(data) {
  const {
    hasUploadedVideo,
    videoUrl,
    productUrl,
    notes,
    metadata
  } = data;

  const normalizedNotes = notes.toLowerCase();

  let hook = 45;
  let retention = 48;
  let visual = 45;
  let selling = 40;
  let cta = 35;

  /* Video source */

  if (hasUploadedVideo) {
    visual += 12;
    retention += 6;
  }

  if (videoUrl) {
    visual += 8;
    retention += 5;
  }

  /* Video resolution */

  if (metadata.width >= 1920 || metadata.height >= 1920) {
    visual += 18;
  } else if (metadata.width >= 1080 || metadata.height >= 1080) {
    visual += 14;
  } else if (metadata.width >= 720 || metadata.height >= 720) {
    visual += 9;
  }

  /* Vertical video */

  if (
    metadata.width > 0 &&
    metadata.height > metadata.width
  ) {
    visual += 8;
    retention += 5;
  }

  /* Video duration */

  const duration = metadata.duration;

  if (duration >= 8 && duration <= 20) {
    retention += 20;
  } else if (duration > 20 && duration <= 35) {
    retention += 14;
  } else if (duration > 35 && duration <= 60) {
    retention += 7;
  } else if (duration > 60) {
    retention -= 5;
  }

  /* Hook indicators */

  const hookKeywords = [
    "stop scroll",
    "jangan scroll",
    "jangan beli",
    "ternyata",
    "gak nyangka",
    "nggak nyangka",
    "serius",
    "awas",
    "lihat ini",
    "coba lihat",
    "pov",
    "jujur",
    "baru tahu",
    "masih banyak yang belum tahu",
    "siapa yang",
    "kalian pernah"
  ];

  hook += keywordScore(
    normalizedNotes,
    hookKeywords,
    6,
    30
  );

  /* Retention indicators */

  const retentionKeywords = [
    "sampai akhir",
    "lihat hasilnya",
    "tunggu dulu",
    "ternyata hasilnya",
    "sebelum",
    "sesudah",
    "pertama",
    "kemudian",
    "akhirnya",
    "review",
    "tes",
    "percobaan",
    "cara pakai"
  ];

  retention += keywordScore(
    normalizedNotes,
    retentionKeywords,
    4,
    22
  );

  /* Selling indicators */

  if (productUrl) {
    selling += 22;
    cta += 6;
  }

  const sellingKeywords = [
    "diskon",
    "promo",
    "murah",
    "hemat",
    "gratis ongkir",
    "harga turun",
    "manfaat",
    "kelebihan",
    "nyaman",
    "praktis",
    "awet",
    "kualitas",
    "worth it",
    "best seller",
    "cod",
    "bayar di tempat"
  ];

  selling += keywordScore(
    normalizedNotes,
    sellingKeywords,
    4,
    30
  );

  /* CTA indicators */

  const ctaKeywords = [
    "klik link",
    "cek link",
    "link di bawah",
    "klik di bawah",
    "cek produk",
    "checkout",
    "beli sekarang",
    "pesan sekarang",
    "keranjang",
    "link bio",
    "jangan sampai kehabisan",
    "buruan"
  ];

  cta += keywordScore(
    normalizedNotes,
    ctaKeywords,
    7,
    38
  );

  /* Notes quality */

  if (notes.length >= 40) {
    hook += 4;
    selling += 4;
  }

  if (notes.length >= 100) {
    retention += 5;
    selling += 4;
  }

  if (notes.length >= 250) {
    retention += 3;
  }

  hook = clampScore(hook);
  retention = clampScore(retention);
  visual = clampScore(visual);
  selling = clampScore(selling);
  cta = clampScore(cta);

  const overall = Math.round(
    hook * 0.24 +
    retention * 0.22 +
    visual * 0.19 +
    selling * 0.20 +
    cta * 0.15
  );

  const winning = clampScore(
    Math.round(
      overall * 0.7 +
      selling * 0.18 +
      cta * 0.12
    )
  );

  const viral = clampScore(
    Math.round(
      hook * 0.48 +
      retention * 0.38 +
      visual * 0.14
    )
  );

  const quality = clampScore(
    Math.round(
      visual * 0.5 +
      retention * 0.25 +
      selling * 0.25
    )
  );

  return {
    hook,
    retention,
    visual,
    selling,
    cta,
    overall,
    winning,
    viral,
    quality
  };
}

/* =========================
   DASHBOARD UPDATE
========================= */

function updateDashboard(scores) {
  animateNumber("overall-score", scores.overall, "");
  animateNumber("winning-score", scores.winning, "%");
  animateNumber("viral-score", scores.viral, "%");
  animateNumber("quality-score", scores.quality, "%");

  updateMetric("hook", scores.hook);
  updateMetric("retention", scores.retention);
  updateMetric("visual", scores.visual);
  updateMetric("selling", scores.selling);
  updateMetric("cta", scores.cta);

  resultStatus.textContent = getScoreLabel(scores.overall);
  resultStatus.className =
    `result-status ${getStatusClass(scores.overall)}`;
}

function updateMetric(name, value) {
  const valueElement =
    document.getElementById(`${name}-value`);

  const progressElement =
    document.getElementById(`${name}-bar`);

  valueElement.textContent = `${value}%`;

  requestAnimationFrame(function () {
    progressElement.style.width = `${value}%`;
  });
}

/* =========================
   RECOMMENDATION
========================= */

function showRecommendations(data) {
  const {
    scores,
    hasUploadedVideo,
    videoUrl,
    productUrl,
    notes,
    metadata
  } = data;

  const recommendations = [];

  if (scores.hook < 70) {
    recommendations.push(
      "Perkuat 1–3 detik pertama dengan rasa penasaran, masalah, atau kejutan visual."
    );
  } else {
    recommendations.push(
      "Hook sudah cukup kuat. Pastikan produk atau masalah utama langsung terlihat."
    );
  }

  if (scores.retention < 70) {
    recommendations.push(
      "Gunakan perpindahan adegan yang lebih cepat dan tampilkan hasil utama lebih awal."
    );
  }

  if (
    hasUploadedVideo &&
    metadata.duration > 35
  ) {
    recommendations.push(
      `Durasi video sekitar ${formatDuration(metadata.duration)}. Pertimbangkan versi 15–30 detik untuk konten affiliate.`
    );
  }

  if (
    hasUploadedVideo &&
    metadata.width > metadata.height
  ) {
    recommendations.push(
      "Video terdeteksi horizontal. Gunakan rasio vertikal 9:16 untuk TikTok, Reels, atau Shorts."
    );
  }

  if (scores.visual < 70) {
    recommendations.push(
      "Pastikan video terang, produk terlihat jelas, dan tidak memiliki terlalu banyak teks."
    );
  }

  if (!productUrl) {
    recommendations.push(
      "Tambahkan link produk agar Selling Power dan relevansi CTA dapat dinilai lebih baik."
    );
  }

  if (scores.selling < 70) {
    recommendations.push(
      "Tambahkan manfaat utama, alasan membeli, perbandingan, atau bukti hasil penggunaan."
    );
  }

  if (scores.cta < 70) {
    recommendations.push(
      "Tambahkan CTA yang jelas seperti “cek link di bawah” atau “klik produknya sekarang”."
    );
  }

  if (!notes) {
    recommendations.push(
      "Tambahkan catatan mengenai hook, voice-over, target audiens, atau CTA untuk analisis yang lebih akurat."
    );
  }

  const sourceName = getVideoSourceName(
    hasUploadedVideo,
    videoUrl
  );

  const productSource = productUrl
    ? getDomainName(productUrl)
    : "Belum tersedia";

  const summary = document.getElementById(
    "analysis-summary"
  );

  summary.innerHTML = `
    <p>
      Sumber video: <strong>${escapeHtml(sourceName)}</strong><br>
      Produk: <strong>${escapeHtml(productSource)}</strong><br>
      Prediksi: <strong>${getScoreLabel(scores.overall)}</strong>
    </p>

    <ul>
      ${recommendations
        .slice(0, 5)
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join("")}
    </ul>
  `;
}

/* =========================
   HELPERS
========================= */

function keywordScore(
  text,
  keywords,
  pointsPerKeyword,
  maximum
) {
  let score = 0;

  keywords.forEach(function (keyword) {
    if (text.includes(keyword)) {
      score += pointsPerKeyword;
    }
  });

  return Math.min(score, maximum);
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isValidUrl(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function getDomainName(value) {
  try {
    return new URL(value).hostname.replace("www.", "");
  } catch {
    return "Link tidak dikenali";
  }
}

function getVideoSourceName(hasFile, videoUrl) {
  if (hasFile && selectedVideo) {
    return selectedVideo.name;
  }

  if (videoUrl) {
    return getDomainName(videoUrl);
  }

  return "Tidak tersedia";
}

function getScoreLabel(score) {
  if (score >= 85) {
    return "High Potential";
  }

  if (score >= 70) {
    return "Good Potential";
  }

  if (score >= 55) {
    return "Needs Improvement";
  }

  return "Low Potential";
}

function getStatusClass(score) {
  if (score >= 75) {
    return "status-good";
  }

  if (score >= 55) {
    return "status-medium";
  }

  return "status-low";
}

function animateNumber(elementId, target, suffix) {
  const element = document.getElementById(elementId);

  const duration = 700;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easedProgress =
      1 - Math.pow(1 - progress, 3);

    const currentValue =
      Math.round(target * easedProgress);

    element.textContent =
      `${currentValue}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function formatDuration(seconds) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "Durasi tidak terbaca";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds} detik`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 MB";
  }

  const megabytes = bytes / (1024 * 1024);

  return `${megabytes.toFixed(1)} MB`;
}

function showStatus(message, type) {
  analysisStatus.textContent = message;

  analysisStatus.className = "analysis-status";

  if (type === "success") {
    analysisStatus.classList.add("status-good");
  }

  if (type === "error") {
    analysisStatus.classList.add("status-low");
  }

  if (type === "loading") {
    analysisStatus.classList.add("status-medium");
  }
}

function setLoading(isLoading) {
  analyzeButton.disabled = isLoading;

  if (isLoading) {
    analyzeButton.innerHTML = `
      <span>Analyzing Content...</span>
      <span class="button-arrow">•••</span>
    `;
  } else {
    analyzeButton.innerHTML = `
      <span>Analyze Content</span>
      <span class="button-arrow">→</span>
    `;
  }
}

function resetVideo() {
  selectedVideo = null;

  videoMetadata = {
    duration: 0,
    width: 0,
    height: 0,
    size: 0
  };

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  videoPreview.removeAttribute("src");
  videoPreview.hidden = true;

  fileInformation.textContent =
    "Belum ada video yang dipilih";

  videoFileInput.value = "";
}

function delay(milliseconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function showAIResult(analysis) {
  const summary = document.getElementById("analysis-summary");

  const strengths = Array.isArray(analysis.strengths)
    ? analysis.strengths
    : [];

  const weaknesses = Array.isArray(analysis.weaknesses)
    ? analysis.weaknesses
    : [];

  const recommendations = Array.isArray(analysis.recommendations)
    ? analysis.recommendations
    : [];

  summary.innerHTML = `
    <p>
      <strong>Prediksi:</strong>
      ${escapeHtml(analysis.prediction || "-")}
    </p>

    <p style="margin-top: 12px;">
      ${escapeHtml(
        analysis.summary || "Tidak ada ringkasan."
      )}
    </p>

    <h4 style="margin-top: 20px;">Kelebihan</h4>
    <ul>
      ${
        strengths.length
          ? strengths
              .map(
                item =>
                  `<li>${escapeHtml(item)}</li>`
              )
              .join("")
          : "<li>Belum ada data.</li>"
      }
    </ul>

    <h4 style="margin-top: 20px;">Kekurangan</h4>
    <ul>
      ${
        weaknesses.length
          ? weaknesses
              .map(
                item =>
                  `<li>${escapeHtml(item)}</li>`
              )
              .join("")
          : "<li>Belum ada data.</li>"
      }
    </ul>

    <h4 style="margin-top: 20px;">Rekomendasi</h4>
    <ul>
      ${
        recommendations.length
          ? recommendations
              .map(
                item =>
                  `<li>${escapeHtml(item)}</li>`
              )
              .join("")
          : "<li>Belum ada rekomendasi.</li>"
      }
    </ul>
  `;
}
