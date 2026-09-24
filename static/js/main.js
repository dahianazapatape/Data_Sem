// ============================================================
// ITM Data — lógica común (sidebar móvil, tema, acento)
// ============================================================

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
  qs(params) {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    return new URLSearchParams(clean).toString();
  },
};

function initTheme() {
  const saved = localStorage.getItem("itm_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  const accent = localStorage.getItem("itm_accent");
  if (accent) document.documentElement.style.setProperty("--kobi", accent);
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
  initTheme();
  initSidebar();
});
