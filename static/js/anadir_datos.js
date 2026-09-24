// ============================================================
// Añadir datos — registro manual + carga masiva CSV
// ============================================================

// Campos con desplegable poblado desde datos reales de la BD.
// allowOther=true agrega una opción "Otro" que se convierte en campo de texto.
const DROPDOWN_FIELDS = [
  { key: "programa", label: "Nombre del programa", allowOther: true },
  { key: "facultad", label: "Facultad", allowOther: true },
  { key: "sede", label: "Sede", allowOther: true },
  { key: "modalidad", label: "Modalidad", allowOther: false },
  { key: "tipo_programa", label: "Tipo de programa", allowOther: false },
  { key: "area_conocimiento", label: "Área de conocimiento", allowOther: true },
  { key: "tipo_inscripcion", label: "Tipo de inscripción", allowOther: false },
  { key: "sexo", label: "Sexo", allowOther: false },
  { key: "estrato", label: "Estrato (0 si no aplica)", allowOther: false },
  { key: "comuna", label: "Comuna", allowOther: true },
  { key: "barrio", label: "Barrio", allowOther: true },
  { key: "ciudad_nacimiento", label: "Ciudad de nacimiento", allowOther: true },
  { key: "pais_nacimiento", label: "País de nacimiento", allowOther: true },
  { key: "institucion", label: "Institución de procedencia", allowOther: true },
  { key: "colegio", label: "Tipo de colegio (público/privado)", allowOther: false },
];

async function buildForm() {
  const schema = await FA.getJSON("/api/datos/esquema");
  const container = document.getElementById("formFields");
  let html = `
    <div class="form-field">
      <label for="f_anio">Año</label>
      <input class="form-input" type="number" id="f_anio" name="anio" value="2026">
    </div>`;

  DROPDOWN_FIELDS.forEach(({ key, label, allowOther }) => {
    const options = (schema[key] || []).map(o => (key === "estrato" ? (o === 0 ? "0 (sin dato)" : `Estrato ${o}`) : o));
    const values = schema[key] || [];
    html += `
      <div class="form-field">
        <label for="f_${key}">${label}</label>
        <select class="form-select" id="f_${key}" name="${key}" data-real="true">
          <option value="">Seleccionar…</option>
          ${values.map((v, i) => `<option value="${v}">${options[i]}</option>`).join("")}
          ${allowOther ? '<option value="__otro__">Otro (escribir)…</option>' : ""}
        </select>
      </div>`;
  });

  container.innerHTML = html;

  // Si eligen "Otro", el select se convierte en un campo de texto libre
  DROPDOWN_FIELDS.filter(f => f.allowOther).forEach(({ key }) => {
    const el = document.getElementById(`f_${key}`);
    el.addEventListener("change", () => {
      if (el.value === "__otro__") {
        const input = document.createElement("input");
        input.className = "form-input";
        input.id = `f_${key}`;
        input.name = key;
        input.placeholder = "Escribe el valor…";
        el.replaceWith(input);
      }
    });
  });
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tabManual").style.display = btn.dataset.tab === "manual" ? "block" : "none";
      document.getElementById("tabCsv").style.display = btn.dataset.tab === "csv" ? "block" : "none";
    });
  });
}

async function submitManual(e) {
  e.preventDefault();
  const form = document.getElementById("formManual");
  const data = Object.fromEntries(new FormData(form).entries());
  const msg = document.getElementById("manualMsg");
  msg.textContent = "Guardando…";

  try {
    const res = await fetch("/api/datos/agregar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.ok) {
      msg.innerHTML = `<i class="bi bi-check-circle-fill" style="color:#0d7a78;"></i> Registro #${json.consecutivo} guardado correctamente. Ya aparece en Dashboard, Estadísticas y Buscador.`;
      form.reset();
    } else {
      msg.textContent = `Error: ${json.error || "no se pudo guardar"}`;
    }
  } catch (err) {
    msg.textContent = `Error de conexión: ${err.message}`;
  }
}

function initCsvUpload() {
  const dropZone = document.getElementById("dropZone");
  const input = document.getElementById("csvInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const dropText = document.getElementById("dropText");
  const msg = document.getElementById("csvMsg");
  let selectedFile = null;

  const setFile = file => {
    selectedFile = file;
    dropText.textContent = file ? `Archivo seleccionado: ${file.name}` : "Arrastra tu archivo CSV aquí o haz clic para seleccionarlo";
    uploadBtn.disabled = !file;
  };

  dropZone.addEventListener("click", () => input.click());
  input.addEventListener("change", () => setFile(input.files[0]));
  ["dragover", "dragleave", "drop"].forEach(evt =>
    dropZone.addEventListener(evt, e => e.preventDefault())
  );
  dropZone.addEventListener("dragover", () => dropZone.classList.add("dragover"));
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", e => {
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  });

  uploadBtn.addEventListener("click", async () => {
    if (!selectedFile) return;
    msg.textContent = "Cargando…";
    const formData = new FormData();
    formData.append("archivo", selectedFile);
    try {
      const res = await fetch("/api/datos/cargar-csv", { method: "POST", body: formData });
      const json = await res.json();
      if (json.ok) {
        msg.innerHTML = `<i class="bi bi-check-circle-fill" style="color:#0d7a78;"></i> ${json.registros_agregados} registros agregados correctamente.`;
        setFile(null);
      } else {
        msg.textContent = `Error: ${json.error || "no se pudo procesar el archivo"}`;
      }
    } catch (err) {
      msg.textContent = `Error de conexión: ${err.message}`;
    }
  });
}

function initRebuild() {
  document.getElementById("rebuildBtn").addEventListener("click", async () => {
    const msg = document.getElementById("rebuildMsg");
    msg.textContent = "Reconstruyendo…";
    try {
      const res = await fetch("/api/datos/reconstruir", { method: "POST" });
      const json = await res.json();
      msg.textContent = json.ok ? "Base de datos reconstruida correctamente." : `Error: ${json.error}`;
    } catch (err) {
      msg.textContent = `Error de conexión: ${err.message}`;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await buildForm();
  initTabs();
  initCsvUpload();
  initRebuild();
  document.getElementById("formManual").addEventListener("submit", submitManual);
});
