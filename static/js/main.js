// ============================================================
// DataInsights — lógica común (sidebar móvil, tema, acento)
// ============================================================

initChartDefaults();

const FA = {
  fmt(n) {
    return new Intl.NumberFormat("es-CO").format(n);
  },
  pct(n) {
    return `${n}%`;
  },
  async getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
    return res.json();
  },
  // Colores del tema activo (ver theme.js)
  get theme() { return getTheme(); },
  get palette() { return getTheme().palette; },
  qs(params) {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    return new URLSearchParams(clean).toString();
  },
};

// Textos y cuadrícula de las gráficas acordes al modo claro/oscuro.
function initChartDefaults() {
  if (typeof Chart === "undefined") return;
  const css = getComputedStyle(document.documentElement);
  Chart.defaults.color = css.getPropertyValue("--ink-soft").trim();
  Chart.defaults.borderColor = css.getPropertyValue("--border-soft").trim();
  Chart.defaults.font.family = "'Inter', sans-serif";
}

function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggle");
  const overlay = document.getElementById("mobileOverlay");
  if (!toggle) return;
  const open = () => { sidebar.classList.add("open"); overlay.classList.add("open"); };
  const close = () => { sidebar.classList.remove("open"); overlay.classList.remove("open"); };
  toggle.addEventListener("click", () => {
    sidebar.classList.contains("open") ? close() : open();
  });
  overlay.addEventListener("click", close);
}

document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
});
