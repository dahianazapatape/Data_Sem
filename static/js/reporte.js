// ============================================================
// Reporte ejecutivo — hallazgos automáticos + calidad de datos
// ============================================================

function kpiCardSmall({ icon, bg, value, label }) {
  return `
    <div class="kpi-card">
      <div class="kpi-icon ${bg}"><i class="bi ${icon}"></i></div>
      <div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-label">${label}</div>
      </div>
    </div>`;
}

async function loadReport() {
  const data = await FA.getJSON("/api/reporte");
  const k = data.kpis;

  document.getElementById("reportKpis").innerHTML = [
    kpiCardSmall({ icon: "bi-people-fill", bg: "bg-kobi", value: FA.fmt(k.total_matriculados), label: "Total matriculados" }),
    kpiCardSmall({ icon: "bi-building-fill", bg: "bg-opal", value: k.total_sedes, label: "Sedes" }),
    kpiCardSmall({ icon: "bi-mortarboard-fill", bg: "bg-bud", value: k.total_programas, label: "Programas activos" }),
    kpiCardSmall({ icon: "bi-laptop-fill", bg: "bg-terra", value: `${k.pct_virtual}%`, label: "Modalidad virtual" }),
  ].join("");

  document.getElementById("findingsList").innerHTML = data.hallazgos.map(h => `
    <div class="finding-item"><i class="bi bi-arrow-right-circle-fill"></i><span>${h}</span></div>
  `).join("");
}

async function loadQuality() {
  const data = await FA.getJSON("/api/calidad-datos");
  document.getElementById("qualityList").innerHTML = data.campos.map(c => `
    <div class="quality-row">
      <span class="field-name">${c.campo}</span>
      <div class="quality-track"><div class="quality-fill" style="width:${Math.min(c.pct, 100)}%;"></div></div>
      <span class="quality-pct">${c.pct}%</span>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  loadReport();
  loadQuality();
  document.getElementById("pdfBtn").addEventListener("click", () => {
    window.location.href = `/api/reporte/pdf?${FA.qs({ color: FA.theme.primary.slice(1) })}`;
  });
});
