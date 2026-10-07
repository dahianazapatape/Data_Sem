// ============================================================
// Configuración: modo oscuro + tema de color (persistente)
// ============================================================
let previewChart = null;

function renderPreview() {
  const canvas = document.getElementById("themePreviewChart");
  if (!canvas || typeof Chart === "undefined") return;
  if (previewChart) previewChart.destroy();
  initChartDefaults();
  const labels = ["Ingeniería", "Ciencias", "Artes", "Economía", "Exactas", "Virtual"];
  previewChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ data: [42, 35, 28, 22, 17, 12], backgroundColor: FA.palette.slice(0, labels.length), borderRadius: 6 }],
    },
    options: {
      responsive: true,
      animation: { duration: 250 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { grid: { display: false } }, y: { display: false } },
    },
  });
}

function renderThemeGrid() {
  const grid = document.getElementById("themeGrid");
  const current = getThemeId();
  grid.innerHTML = Object.entries(THEMES).map(([id, t]) => `
    <button type="button" class="theme-card ${id === current ? "active" : ""}" data-theme-id="${id}">
      <div class="theme-card-head">${t.name} <i class="bi bi-check-circle-fill"></i></div>
      <div class="theme-strip">${t.palette.slice(0, 6).map(c => `<span style="background:${c};"></span>`).join("")}</div>
    </button>
  `).join("");

  grid.querySelectorAll(".theme-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.themeId;
      localStorage.setItem("itm_color_theme", id);
      localStorage.removeItem("itm_accent");
      applyColorTheme(id);
      grid.querySelectorAll(".theme-card").forEach(c => c.classList.toggle("active", c === card));
      renderPreview();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const darkToggle = document.getElementById("darkModeToggle");
  const savedTheme = localStorage.getItem("itm_theme") || "light";
  darkToggle.checked = savedTheme === "dark";

  darkToggle.addEventListener("change", () => {
    const theme = darkToggle.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("itm_theme", theme);
    renderPreview();
  });

  renderThemeGrid();
  renderPreview();
});
