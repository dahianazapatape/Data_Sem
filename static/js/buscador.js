// ============================================================
// Buscador — tabla paginada con filtros y export CSV
// ============================================================
let currentPage = 1;

function currentFilters() {
  return {
    q: document.getElementById("qInput").value.trim(),
    facultad: document.getElementById("fFacultad").value,
    sede: document.getElementById("fSede").value,
    modalidad: document.getElementById("fModalidad").value,
    sexo: document.getElementById("fSexo").value,
    estrato: document.getElementById("fEstrato").value,
    comuna: document.getElementById("fComuna").value,
    tipo_inscripcion: document.getElementById("fTipoInscripcion").value,
  };
}

async function populateFilters() {
  const opts = await FA.getJSON("/api/filtros");
  const map = { fFacultad: "facultad", fSede: "sede", fModalidad: "modalidad", fSexo: "sexo", fComuna: "comuna", fTipoInscripcion: "tipo_inscripcion" };
  Object.entries(map).forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    (opts[key] || []).forEach(v => {
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

function genderBadge(sexo) {
  const cls = sexo === "Femenino" ? "bg-terra" : sexo === "Masculino" ? "bg-kobi" : "bg-opal";
  return `<span class="badge-pill ${cls}">${sexo}</span>`;
}

async function runSearch(page = 1) {
  currentPage = page;
  const qs = FA.qs({ ...currentFilters(), page, page_size: 25 });
  const data = await FA.getJSON(`/api/buscar?${qs}`);
  const body = document.getElementById("resultsBody");
  const empty = document.getElementById("emptyState");

  if (!data.results.length) {
    body.innerHTML = "";
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
    body.innerHTML = data.results.map(r => `
      <tr>
        <td>${r.consecutivo}</td>
        <td>${r.programa}</td>
        <td>${r.facultad.replace("Facultad de ", "")}</td>
        <td>${r.sede}</td>
        <td>${r.modalidad}</td>
        <td>${genderBadge(r.sexo)}</td>
        <td>${r.estrato || "—"}</td>
        <td>${r.comuna}</td>
        <td>${r.institucion}</td>
        <td>${r.colegio}</td>
      </tr>`).join("");
  }

  document.getElementById("paginationInfo").textContent =
    `${FA.fmt(data.total)} resultados · página ${data.page} de ${data.total_pages}`;
  document.getElementById("prevPage").disabled = data.page <= 1;
  document.getElementById("nextPage").disabled = data.page >= data.total_pages;
}

document.addEventListener("DOMContentLoaded", async () => {
  await populateFilters();
  await runSearch(1);

  document.getElementById("searchBtn").addEventListener("click", () => runSearch(1));
  document.getElementById("qInput").addEventListener("keydown", e => { if (e.key === "Enter") runSearch(1); });
  ["fFacultad", "fSede", "fModalidad", "fSexo", "fEstrato", "fComuna", "fTipoInscripcion"].forEach(id =>
    document.getElementById(id).addEventListener("change", () => runSearch(1))
  );
  document.getElementById("clearFilters").addEventListener("click", () => {
    document.getElementById("qInput").value = "";
    ["fFacultad", "fSede", "fModalidad", "fSexo", "fEstrato", "fComuna", "fTipoInscripcion"].forEach(id => (document.getElementById(id).value = ""));
    runSearch(1);
  });
  document.getElementById("prevPage").addEventListener("click", () => runSearch(currentPage - 1));
  document.getElementById("nextPage").addEventListener("click", () => runSearch(currentPage + 1));
  document.getElementById("exportBtn").addEventListener("click", () => {
    const qs = FA.qs(currentFilters());
    window.location.href = `/api/exportar?${qs}`;
  });
  document.getElementById("exportExcelBtn").addEventListener("click", () => {
    const qs = FA.qs(currentFilters());
    window.location.href = `/api/exportar/excel?${qs}`;
  });
});
