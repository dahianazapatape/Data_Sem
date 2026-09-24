// ============================================================
// Estadísticas y gráficos — con filtros dinámicos
// ============================================================
const PSET = ["#36C9C6", "#E76F51", "#9BC1BC", "#F4C77B", "#6C8EBF", "#B08BBB", "#E6BEAE", "#8FD6C4", "#D68C45", "#7B9E89"];
const charts = {};

function destroy(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function currentFilters() {
  return {
    facultad: document.getElementById("fFacultad").value,
    sede: document.getElementById("fSede").value,
    modalidad: document.getElementById("fModalidad").value,
    sexo: document.getElementById("fSexo").value,
    tipo_programa: document.getElementById("fTipoPrograma").value,
    estrato: document.getElementById("fEstrato").value,
  };
}

async function populateFilters() {
  const opts = await FA.getJSON("/api/filtros");
  const map = { fFacultad: "facultad", fSede: "sede", fModalidad: "modalidad", fSexo: "sexo", fTipoPrograma: "tipo_programa" };
  Object.entries(map).forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    opts[key].forEach(v => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      el.appendChild(o);
    });
  });
  const estratoEl = document.getElementById("fEstrato");
  (opts.estrato || []).forEach(v => {
    const o = document.createElement("option");
    o.value = v; o.textContent = `Estrato ${v}`;
    estratoEl.appendChild(o);
  });
}

let currentTopBottom = "top";

async function drawTopBottomList() {
  const qs = FA.qs({ ...currentFilters(), limit: 10 });
  const data = await FA.getJSON(`/api/top-bottom/programas?${qs}`);
  const rows = data[currentTopBottom] || [];
  document.getElementById("topBottomList").innerHTML = rows.map((r, i) => `
    <div class="mini-list-item">
      <span>${i + 1}. ${r.label}</span>
      <strong>${FA.fmt(r.total)} <span style="color:var(--ink-soft); font-weight:500;">(${r.pct}%)</span></strong>
    </div>`).join("") || "<p class='section-note'>Sin datos para estos filtros.</p>";
}

function initTopBottomTabs() {
  document.querySelectorAll('[data-topbottom]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[data-topbottom]').forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTopBottom = btn.dataset.topbottom;
      drawTopBottomList();
    });
  });
}

async function drawProgramas() {
  const qs = FA.qs({ ...currentFilters(), limit: 10 });
  const data = await FA.getJSON(`/api/charts/programa?${qs}`);
  destroy("programas");
  charts.programas = new Chart(document.getElementById("chartProgramas"), {
    type: "bar",
    data: {
      labels: data.map(d => d.label.length > 28 ? d.label.slice(0, 28) + "…" : d.label),
      datasets: [{ data: data.map(d => d.total), backgroundColor: "#36C9C6", borderRadius: 6 }],
    },
    options: { indexAxis: "y", plugins: { legend: { display: false } } },
  });
}

async function drawGeneroFacultad() {
  const qs = FA.qs(currentFilters());
  const data = await FA.getJSON(`/api/charts/cruce/facultad/sexo?${qs}`);
  const facultades = [...new Set(data.map(d => d.grp))];
  const generos = [...new Set(data.map(d => d.stack))];
  const colors = { Femenino: "#E76F51", Masculino: "#36C9C6", "No registra": "#9BC1BC" };
  destroy("generoFacultad");
  charts.generoFacultad = new Chart(document.getElementById("chartGeneroFacultad"), {
    type: "bar",
    data: {
      labels: facultades.map(f => f.replace("Facultad de ", "")),
      datasets: generos.map(g => ({
        label: g,
        data: facultades.map(f => (data.find(d => d.grp === f && d.stack === g) || {}).total || 0),
        backgroundColor: colors[g] || "#B08BBB",
        borderRadius: 4,
      })),
    },
    options: { plugins: { legend: { position: "bottom" } }, scales: { x: { stacked: true }, y: { stacked: true } } },
  });
}

async function drawSimple(chartKey, canvasId, endpoint, type = "doughnut", extraQs = {}) {
  const qs = FA.qs({ ...currentFilters(), ...extraQs });
  const data = await FA.getJSON(`/api/charts/${endpoint}?${qs}`);
  destroy(chartKey);
  charts[chartKey] = new Chart(document.getElementById(canvasId), {
    type,
    data: {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.total), backgroundColor: PSET, borderWidth: type === "bar" ? 0 : 0, borderRadius: type === "bar" ? 6 : 0 }],
    },
    options: type === "bar"
      ? { indexAxis: "y", plugins: { legend: { display: false } } }
      : { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } },
  });
}

async function reloadAll() {
  await Promise.all([
    drawProgramas(),
    drawGeneroFacultad(),
    drawSimple("area", "chartArea", "area_conocimiento", "doughnut"),
    drawSimple("inscripcion", "chartInscripcion", "tipo_inscripcion", "pie"),
    drawSimple("sedeTop", "chartSedeTop", "sede", "bar", { limit: 8 }),
    drawTopBottomList(),
  ]);
}

document.addEventListener("DOMContentLoaded", async () => {
  await populateFilters();
  initTopBottomTabs();
  await reloadAll();

  ["fFacultad", "fSede", "fModalidad", "fSexo", "fTipoPrograma", "fEstrato"].forEach(id => {
    document.getElementById(id).addEventListener("change", reloadAll);
  });

  document.getElementById("clearFilters").addEventListener("click", () => {
    ["fFacultad", "fSede", "fModalidad", "fSexo", "fTipoPrograma", "fEstrato"].forEach(id => (document.getElementById(id).value = ""));
    reloadAll();
  });
});
