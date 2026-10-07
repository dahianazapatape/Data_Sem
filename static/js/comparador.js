// ============================================================
// Comparador de sedes
// ============================================================

async function populateSedes() {
  const opts = await FA.getJSON("/api/filtros");
  const a = document.getElementById("sedeA");
  const b = document.getElementById("sedeB");
  opts.sede.forEach(s => {
    a.appendChild(new Option(s, s));
    b.appendChild(new Option(s, s));
  });
}

function renderCol(profile, color) {
  const modalidad = profile.modalidad.map(m =>
    `<div class="mini-list-item"><span>${m.label}</span><strong>${FA.fmt(m.total)}</strong></div>`
  ).join("") || "<div class='section-note'>Sin datos</div>";

  const programas = profile.top_programas.map((p, i) =>
    `<div class="mini-list-item"><span>${i + 1}. ${p.label.length > 34 ? p.label.slice(0, 34) + "…" : p.label}</span><strong>${FA.fmt(p.total)}</strong></div>`
  ).join("") || "<div class='section-note'>Sin datos</div>";

  const facultades = profile.top_facultades.map(f =>
    `<div class="mini-list-item"><span>${f.label.replace("Facultad de ", "")}</span><strong>${FA.fmt(f.total)}</strong></div>`
  ).join("") || "<div class='section-note'>Sin datos</div>";

  return `
    <div class="compare-header">
      <div class="chip" style="margin-bottom:.5rem; background:${color}22; color:${color}; border-color:${color}55;">${profile.sede}</div>
      <div class="total">${FA.fmt(profile.total)}</div>
      <div class="section-note" style="margin:0;">matriculados · ${profile.pct_femenino}% mujeres</div>
    </div>
    <div>
      <div class="card-title" style="margin-bottom:.6rem;"><i class="bi bi-mortarboard-fill"></i> Top programas</div>
      <div class="mini-list">${programas}</div>
    </div>
    <div>
      <div class="card-title" style="margin-bottom:.6rem;"><i class="bi bi-building-fill"></i> Facultades</div>
      <div class="mini-list">${facultades}</div>
    </div>
    <div>
      <div class="card-title" style="margin-bottom:.6rem;"><i class="bi bi-laptop-fill"></i> Modalidad</div>
      <div class="mini-list">${modalidad}</div>
    </div>
  `;
}

async function comparar() {
  const sedeA = document.getElementById("sedeA").value;
  const sedeB = document.getElementById("sedeB").value;
  if (!sedeA || !sedeB) return;
  if (sedeA === sedeB) {
    alert("Elige dos sedes distintas para comparar.");
    return;
  }
  const data = await FA.getJSON(`/api/comparar-sedes?${FA.qs({ sede_a: sedeA, sede_b: sedeB })}`);
  document.getElementById("colA").innerHTML = renderCol(data.a, FA.theme.primary);
  document.getElementById("colB").innerHTML = renderCol(data.b, FA.theme.secondary);
  document.getElementById("compareEmpty").style.display = "none";
  document.getElementById("compareResult").style.display = "grid";
}

document.addEventListener("DOMContentLoaded", async () => {
  await populateSedes();
  document.getElementById("compararBtn").addEventListener("click", comparar);
});
