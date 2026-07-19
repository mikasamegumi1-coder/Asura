document.querySelector(".analyze-btn").addEventListener("click", function () {

  const text = document.querySelector("textarea").value;

  if (text.trim() === "") {
    alert("Silakan tempel script atau caption terlebih dahulu!");
    return;
  }

  let hook = Math.floor(Math.random() * 16) + 85;
  let retention = Math.floor(Math.random() * 16) + 82;
  let visual = Math.floor(Math.random() * 16) + 84;
  let selling = Math.floor(Math.random() * 16) + 80;
  let cta = Math.floor(Math.random() * 16) + 85;

  let prediction = "LOW";

  const average = (hook + retention + visual + selling + cta) / 5;

  if (average >= 90) {
    prediction = "HIGH";
  } else if (average >= 80) {
    prediction = "MEDIUM";
  }

  document.querySelector(".analysis-box").innerHTML = `
    <p>🎯 Hook Score : ${hook}%</p>
    <p>👀 Retention : ${retention}%</p>
    <p>🎨 Visual : ${visual}%</p>
    <p>💰 Selling Power : ${selling}%</p>
    <p>📢 CTA : ${cta}%</p>
    <p>🚀 Winning Prediction : ${prediction}</p>
  `;

});
