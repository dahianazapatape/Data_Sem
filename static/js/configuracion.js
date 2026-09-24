// ============================================================
// Configuración: modo oscuro + color de acento (persistente)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const darkToggle = document.getElementById("darkModeToggle");
  const savedTheme = localStorage.getItem("itm_theme") || "light";
  darkToggle.checked = savedTheme === "dark";

  darkToggle.addEventListener("change", () => {
    const theme = darkToggle.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("itm_theme", theme);
  });

  const savedAccent = localStorage.getItem("itm_accent") || "#36C9C6";
  document.querySelectorAll(".swatch").forEach(sw => {
    if (sw.dataset.color.toLowerCase() === savedAccent.toLowerCase()) sw.classList.add("active");
    sw.addEventListener("click", () => {
      document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
      sw.classList.add("active");
      document.documentElement.style.setProperty("--kobi", sw.dataset.color);
      localStorage.setItem("itm_accent", sw.dataset.color);
    });
  });
});
