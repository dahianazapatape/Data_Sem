// ============================================================
// DataInsights — temas de color
// Se carga en <head> para aplicar el tema antes de pintar la página
// (evita el parpadeo del color por defecto). Cada tema define el
// color primario/secundario, la paleta de las gráficas y el panel lateral.
// ============================================================

const THEMES = {
  turquesa: {
    name: "Turquesa",
    primary: "#36C9C6", secondary: "#E76F51", tertiary: "#9BC1BC", onPrimary: "#06302F",
    sidebar: ["#0F3B3A", "#144846"], sidebarText: "#CFEAE7",
    palette: ["#36C9C6", "#E76F51", "#9BC1BC", "#F4C77B", "#6C8EBF", "#B08BBB", "#E6BEAE", "#8FD6C4", "#D68C45", "#7B9E89"],
  },
  coral: {
    name: "Coral",
    primary: "#E76F51", secondary: "#2A9D8F", tertiary: "#F4A261", onPrimary: "#2B0E06",
    sidebar: ["#3D1F17", "#552B20"], sidebarText: "#F6DCD3",
    palette: ["#E76F51", "#2A9D8F", "#F4A261", "#E9C46A", "#264653", "#C97B84", "#8AB17D", "#F2B5A0", "#5E8C9A", "#B5838D"],
  },
  salvia: {
    name: "Salvia",
    primary: "#5E9E92", secondary: "#D4A373", tertiary: "#A3C4BC", onPrimary: "#0B2420",
    sidebar: ["#1E3530", "#28443E"], sidebarText: "#D7E8E3",
    palette: ["#5E9E92", "#D4A373", "#A3C4BC", "#E9C46A", "#7D8CC4", "#C08497", "#90A955", "#CCD5AE", "#B56576", "#6D8A96"],
  },
  oceano: {
    name: "Océano",
    primary: "#4F7CC0", secondary: "#F2A541", tertiary: "#8FB3E0", onPrimary: "#FFFFFF",
    sidebar: ["#14233D", "#1C3052"], sidebarText: "#D3E0F2",
    palette: ["#4F7CC0", "#F2A541", "#8FB3E0", "#E07A5F", "#3D9A8B", "#9B72AA", "#F2CC8F", "#5C6F91", "#81B29A", "#C8553D"],
  },
  lavanda: {
    name: "Lavanda",
    primary: "#9A6FB0", secondary: "#F28482", tertiary: "#C9B6D9", onPrimary: "#FFFFFF",
    sidebar: ["#2A1D35", "#3A2848"], sidebarText: "#E6DAF0",
    palette: ["#9A6FB0", "#F28482", "#C9B6D9", "#84A59D", "#F6BD60", "#5E7CE2", "#E5989B", "#6D597A", "#B8E0D2", "#D4A5A5"],
  },
};

// Compatibilidad con la preferencia anterior (solo guardaba un color hex).
const LEGACY_ACCENTS = {
  "#36c9c6": "turquesa", "#e76f51": "coral", "#9bc1bc": "salvia",
  "#6c8ebf": "oceano", "#b08bbb": "lavanda",
};

function getThemeId() {
  let id = localStorage.getItem("itm_color_theme");
  if (!id) {
    const legacy = (localStorage.getItem("itm_accent") || "").toLowerCase();
    id = LEGACY_ACCENTS[legacy];
  }
  return THEMES[id] ? id : "turquesa";
}

function getTheme() {
  return THEMES[getThemeId()];
}

function applyColorTheme(id) {
  const t = THEMES[id] || THEMES.turquesa;
  const s = document.documentElement.style;
  s.setProperty("--kobi", t.primary);
  s.setProperty("--terra-cotta", t.secondary);
  s.setProperty("--opal", t.tertiary);
  s.setProperty("--on-primary", t.onPrimary);
  s.setProperty("--sidebar-bg", t.sidebar[0]);
  s.setProperty("--sidebar-bg-2", t.sidebar[1]);
  s.setProperty("--sidebar-text", t.sidebarText);
}

document.documentElement.setAttribute("data-theme", localStorage.getItem("itm_theme") || "light");
applyColorTheme(getThemeId());
