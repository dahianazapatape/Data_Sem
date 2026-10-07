// ============================================================
// Dashboard principal
// ============================================================
const PALETTE_SET = FA.palette;

function kpiCard({ icon, bg, value, label }) {
  return `
    <div class="kpi-card">
      <div class="kpi-icon ${bg}"><i class="bi ${icon}"></i></div>
      <div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-label">${label}</div>
      </div>
    </div>`;
}

async function loadKPIs() {
  const data = await FA.getJSON("/api/kpis");
  const grid = document.getElementById("kpiGrid");
  grid.innerHTML = [
    kpiCard({ icon: "bi-people-fill", bg: "bg-kobi", value: FA.fmt(data.total_matriculados), label: "Total matriculados" }),
    kpiCard({ icon: "bi-building-fill", bg: "bg-opal", value: data.total_sedes, label: "Sedes activas" }),
    kpiCard({ icon: "bi-gender-ambiguous", bg: "bg-terra", value: `${data.pct_femenino}% / ${data.pct_masculino}%`, label: "Mujeres / Hombres" }),
    kpiCard({ icon: "bi-laptop-fill", bg: "bg-bud", value: `${data.pct_virtual}%`, label: "Modalidad virtual" }),
  ].join("");
}

function baseBarOptions(horizontal = false) {
  return {
    indexAxis: horizontal ? "y" : "x",
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: !horizontal }, ticks: { font: { size: 11 } } },
      y: { grid: { display: horizontal }, ticks: { font: { size: 11 } } },
    },
  };
}

async function loadFacultadChart() {
  const data = await FA.getJSON("/api/charts/facultad");
  new Chart(document.getElementById("chartFacultad"), {
    type: "bar",
    data: {
      labels: data.map(d => d.label.replace("Facultad de ", "")),
      datasets: [{ data: data.map(d => d.total), backgroundColor: PALETTE_SET, borderRadius: 8, maxBarThickness: 46 }],
    },
    options: baseBarOptions(true),
  });
}

async function loadGeneroChart() {
  const data = await FA.getJSON("/api/charts/sexo");
  new Chart(document.getElementById("chartGenero"), {
    type: "doughnut",
    data: {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.total), backgroundColor: [FA.theme.primary, FA.theme.secondary, FA.theme.tertiary], borderWidth: 0 }],
    },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } }, cutout: "62%" },
  });
}

async function loadModalidadChart() {
  const data = await FA.getJSON("/api/charts/modalidad");
  new Chart(document.getElementById("chartModalidad"), {
    type: "pie",
    data: {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.total), backgroundColor: PALETTE_SET, borderWidth: 0 }],
    },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } },
  });
}

async function loadSedesChart() {
  const data = await FA.getJSON("/api/charts/sede?limit=5");
  new Chart(document.getElementById("chartSedes"), {
    type: "bar",
    data: {
      labels: data.map(d => d.label.length > 14 ? d.label.slice(0, 14) + "…" : d.label),
      datasets: [{ data: data.map(d => d.total), backgroundColor: FA.theme.primary, borderRadius: 8, maxBarThickness: 34 }],
    },
    options: baseBarOptions(false),
  });
}

async function loadTipoProgramaChart() {
  const data = await FA.getJSON("/api/charts/tipo_programa");
  new Chart(document.getElementById("chartTipoPrograma"), {
    type: "doughnut",
    data: {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.total), backgroundColor: [FA.theme.secondary, FA.theme.primary], borderWidth: 0 }],
    },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } }, cutout: "62%" },
  });
}

function loadAllDashboard() {
  document.getElementById("kpiGrid").innerHTML = "";
  loadKPIs();
  loadFacultadChart();
  loadGeneroChart();
  loadModalidadChart();
  loadSedesChart();
  loadTipoProgramaChart();
}

document.addEventListener("DOMContentLoaded", () => {
  loadAllDashboard();
  document.getElementById("refreshBtn")?.addEventListener("click", () => location.reload());
});
