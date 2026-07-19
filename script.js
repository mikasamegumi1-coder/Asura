const analyzeBtn = document.querySelector(".analyze-btn");

analyzeBtn.addEventListener("click", function () {

    const text = document.querySelector("textarea").value.toLowerCase();

    if (text.trim() === "") {
        alert("Masukkan script atau caption terlebih dahulu!");
        return;
    }

    let hook = 50;
    let retention = 50;
    let visual = 50;
    let selling = 50;
    let cta = 50;

    // HOOK
    if(text.includes("stop scroll")) hook += 15;
    if(text.includes("jangan")) hook += 10;
    if(text.includes("awas")) hook += 10;
    if(text.includes("lihat")) hook += 5;

    // SELLING
    if(text.includes("diskon")) selling += 15;
    if(text.includes("promo")) selling += 10;
    if(text.includes("murah")) selling += 10;
    if(text.includes("gratis")) selling += 10;

    // CTA
    if(text.includes("klik")) cta += 15;
    if(text.includes("checkout")) cta += 10;
    if(text.includes("pesan")) cta += 10;
    if(text.includes("beli")) cta += 10;

    // RETENTION
    if(text.length > 150) retention += 15;
    if(text.length > 300) retention += 10;

    // VISUAL
    if(text.includes("video")) visual += 10;
    if(text.includes("hd")) visual += 10;
    if(text.includes("4k")) visual += 15;

    hook = Math.min(hook,100);
    retention = Math.min(retention,100);
    visual = Math.min(visual,100);
    selling = Math.min(selling,100);
    cta = Math.min(cta,100);

    const overall = Math.round((hook+retention+visual+selling+cta)/5);

    document.querySelector(".analysis-box").innerHTML = `
        <p>🎯 Hook Score : ${hook}%</p>
        <p>👀 Retention : ${retention}%</p>
        <p>🎨 Visual : ${visual}%</p>
        <p>💰 Selling Power : ${selling}%</p>
        <p>📢 CTA : ${cta}%</p>
        <h3>🏆 Overall Score : ${overall}%</h3>
    `;
});
document.getElementById("overall-score").textContent = overall + "%";
document.getElementById("winning-score").textContent = Math.min(overall + 2, 100) + "%";
document.getElementById("viral-score").textContent = Math.max(hook, retention) + "%";
document.getElementById("quality-score").textContent = Math.round((visual + selling) / 2) + "%";
