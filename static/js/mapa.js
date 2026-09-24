// ============================================================
// Mapa interactivo de sedes (Leaflet + OpenStreetMap)
// ============================================================

function radiusFor(total, max) {
  const min = 8, maxR = 34;
  return min + (Math.sqrt(total / max) * (maxR - min));
}

async function loadMapa() {
  const map = L.map("mapa-sedes", { scrollWheelZoom: true }).setView([6.55, -75.6], 8);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  const sedes = await FA.getJSON("/api/sedes");
  const max = Math.max(...sedes.map(s => s.total));

  const ranking = document.getElementById("rankingSedes");
  ranking.innerHTML = sedes
    .slice(0, 25)
    .map((s, i) => `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.4rem .1rem; border-bottom:1px solid var(--border-soft);">
        <div style="display:flex; align-items:center; gap:.5rem; min-width:0;">
          <span class="chip" style="min-width:26px; justify-content:center;">${i + 1}</span>
          <span style="font-size:.83rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:170px;" title="${s.sede}">${s.sede}</span>
        </div>
        <strong style="font-size:.85rem;">${FA.fmt(s.total)}</strong>
      </div>`)
    .join("");

  sedes.forEach(s => {
    const marker = L.circleMarker([s.lat, s.lon], {
      radius: radiusFor(s.total, max),
      color: "#0F3B3A",
      weight: 1,
      fillColor: s.total > max * 0.3 ? "#E76F51" : "#36C9C6",
      fillOpacity: 0.65,
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family:Inter, sans-serif; min-width:190px;">
        <strong>${s.sede}</strong><br>
        <span style="font-size:.8rem; color:#4C5C59;">Facultad principal: ${s.facultad_top || "—"}</span><br>
        <div style="margin-top:.4rem; font-size:.82rem;">
          <div>Total matriculados: <strong>${FA.fmt(s.total)}</strong></div>
          <div>Mujeres: ${FA.fmt(s.femenino)} · Hombres: ${FA.fmt(s.masculino)}</div>
        </div>
      </div>
    `);
  });
}

document.addEventListener("DOMContentLoaded", loadMapa);
