// ============================================================
// Analítica avanzada: estrato, geografía, colegios, equidad de género
// ============================================================

const COVERAGE_COLORS = ["#36C9C6", "#E76F51", "#9BC1BC", "#F4C77B", "#6C8EBF", "#B08BBB"];

function progressRow(label, pct, total, color) {
  return `
    <div class="progress-row">
      <div class="progress-label">
        <span>${label}</span>
        <span style="color:var(--ink-soft);">${FA.fmt(total)} · ${pct}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:${color};"></div></div>
    </div>`;
}

async function drawVirtualidad() {
  const data = await FA.getJSON("/api/virtualidad");
  document.getElementById("virtualidadList").innerHTML = data
    .map((d, i) => progressRow(d.label, d.pct, d.total, COVERAGE_COLORS[i % COVERAGE_COLORS.length]))
    .join("");
}

async function drawMunicipio() {
  const data = await FA.getJSON("/api/cobertura/municipio_nacimiento?limit=8");
  document.getElementById("municipioList").innerHTML = data
    .map((d, i) => progressRow(d.label, d.pct, d.total, COVERAGE_COLORS[i % COVERAGE_COLORS.length]))
    .join("");
}

async function drawEstrato() {
  const data = await FA.getJSON("/api/estrato");
  const labels = data.map(d => d.estrato === 0 ? "Sin dato" : `Estrato ${d.estrato}`);
  new Chart(document.getElementById("chartEstrato"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ data: data.map(d => d.total), backgroundColor: "#9BC1BC", borderRadius: 8, maxBarThickness: 46 }],
    },
    options: { plugins: { legend: { display: false } } },
  });
}

async function drawComuna() {
  const data = await FA.getJSON("/api/charts/comuna?limit=10");
  new Chart(document.getElementById("chartComuna"), {
    type: "bar",
    data: {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.total), backgroundColor: "#36C9C6", borderRadius: 8, maxBarThickness: 30 }],
    },
    options: { indexAxis: "y", plugins: { legend: { display: false } } },
  });
}

async function drawColegios() {
  const data = await FA.getJSON("/api/charts/institucion?limit=12");
  new Chart(document.getElementById("chartColegios"), {
    type: "bar",
    data: {
      labels: data.map(d => d.label.length > 32 ? d.label.slice(0, 32) + "…" : d.label),
      datasets: [{ data: data.map(d => d.total), backgroundColor: "#E76F51", borderRadius: 6 }],
    },
    options: { indexAxis: "y", plugins: { legend: { display: false } } },
  });
}

async function drawTipoColegio() {
  const data = await FA.getJSON("/api/charts/colegio");
  document.getElementById("tipoColegioList").innerHTML = data
    .map((d, i) => progressRow(d.label, Math.round((d.total / data.reduce((s, x) => s + x.total, 0)) * 1000) / 10, d.total, COVERAGE_COLORS[i % COVERAGE_COLORS.length]))
    .join("");
}

async function drawEquidad() {
  const data = await FA.getJSON("/api/charts/cruce/facultad/sexo");
  const facultades = [...new Set(data.map(d => d.grp))];
  const container = document.getElementById("equidadList");

  container.innerHTML = facultades.map(f => {
    const fem = (data.find(d => d.grp === f && d.stack === "Femenino") || {}).total || 0;
    const masc = (data.find(d => d.grp === f && d.stack === "Masculino") || {}).total || 0;
    const total = fem + masc;
    const pctFem = total ? Math.round((fem / total) * 100) : 0;
    return `
      <div>
        <div style="display:flex; justify-content:space-between; font-size:.82rem; margin-bottom:.3rem;">
          <span>${f.replace("Facultad de ", "")}</span>
          <span style="color:var(--ink-soft);">${pctFem}% mujeres</span>
        </div>
        <div style="height:10px; border-radius:999px; background:var(--alabaster); overflow:hidden; display:flex;">
          <div style="width:${pctFem}%; background:#E76F51;"></div>
          <div style="width:${100 - pctFem}%; background:#36C9C6;"></div>
        </div>
      </div>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  drawVirtualidad();
  drawMunicipio();
  drawEstrato();
  drawComuna();
  drawColegios();
  drawTipoColegio();
  drawEquidad();
});
