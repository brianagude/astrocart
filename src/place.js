// City picker, the chosen place, and the "place check" results.
import { ANG, ORDER } from "./data/angles.js";
import { CITIES, cityLabel } from "./data/cities.js";
import { READ } from "./data/readings.js";
import { distKm, lineLonAt, strength } from "./lines.js";
import { app } from "./state.js";
import { $, mi, pad } from "./util.js";

// Called after the chosen place changes; set by initPlace.
let onChange = () => {};

const fold = (t) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function showResults() {
  const q = fold($("city").value.trim()),
    ul = $("results");
  if (!q) {
    ul.hidden = true;
    $("city").setAttribute("aria-expanded", "false");
    return;
  }
  const m = CITIES.filter((c) => fold(c[0]).startsWith(q))
    .concat(
      CITIES.filter(
        (c) => !fold(c[0]).startsWith(q) && fold(cityLabel(c)).includes(q),
      ),
    )
    .slice(0, 8);
  ul.innerHTML = m.length
    ? m
        .map(
          (c) =>
            `<li role="option" data-i="${CITIES.indexOf(c)}">${c[0]}<span>${c[1] ? c[1] + " · " : ""}${c[2]}</span></li>`,
        )
        .join("")
    : '<li aria-disabled="true">No match in the list. Try another spelling, or enter coordinates.</li>';
  ul.hidden = false;
  $("city").setAttribute("aria-expanded", "true");
}
export function chooseCity(i) {
  app.selCity = CITIES[i];
  $("city").value = cityLabel(app.selCity);
  $("lat").value = "";
  $("lon").value = "";
  $("results").hidden = true;
  $("city").setAttribute("aria-expanded", "false");
  onChange();
}
export function initPlace(handler) {
  onChange = handler;
  $("city").addEventListener("input", showResults);
  $("city").addEventListener("focus", () => $("city").select());
  $("city").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const li = $("results").querySelector("li[data-i]");
      if (li) chooseCity(+li.dataset.i);
    }
    if (e.key === "Escape") $("results").hidden = true;
  });
  $("results").addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li) {
      e.preventDefault();
      chooseCity(+li.dataset.i);
    }
  });
  $("city").addEventListener("blur", () =>
    setTimeout(() => {
      $("results").hidden = true;
      $("city").value = app.selCity ? cityLabel(app.selCity) : "";
    }, 150),
  );
}
export function getPlace() {
  const la = $("lat").value.trim(),
    lo = $("lon").value.trim();
  if (la || lo) {
    const lat = parseFloat(la),
      lon = parseFloat(lo);
    if (
      !isFinite(lat) ||
      !isFinite(lon) ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180
    )
      return {
        error:
          "Enter a latitude between −90 and 90 and a longitude between −180 and 180, or clear both to use the city.",
      };
    return {
      lat,
      lon,
      label: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      short: `${lat.toFixed(1)}, ${lon.toFixed(1)}`,
    };
  }
  if (!app.selCity) return { none: true };
  return {
    lat: app.selCity[3],
    lon: app.selCity[4],
    label: cityLabel(app.selCity),
    short: app.selCity[0],
  };
}
export const orb = () => +$("orb").value;
export function citiesNear(p, a, limit) {
  return CITIES.map((c, i) => ({
    c,
    i,
    d: distKm(lineLonAt(p, a, c[3]), c[3], c[4]),
  }))
    .filter((x) => x.d !== null && x.d <= orb())
    .sort((x, y) => x.d - y.d)
    .slice(0, limit);
}

export function renderHits() {
  const out = $("hits"),
    pl = getPlace();
  if (pl.error) {
    out.innerHTML = `<p class="empty">${pl.error}</p>`;
    return;
  }
  if (pl.none) {
    out.innerHTML = `<p class="empty">No city chosen yet.</p>`;
    return;
  }
  if (!app.lines) {
    out.innerHTML = `<p class="empty">Set your birth details above to check ${pl.label}.</p>`;
    return;
  }
  const hits = [];
  for (const p of app.lines)
    for (const a of ORDER) {
      const d = distKm(lineLonAt(p, a, pl.lat), pl.lat, pl.lon);
      if (d !== null && d <= orb()) hits.push({ p, a, d });
    }
  hits.sort((x, y) => x.d - y.d);
  if (!hits.length) {
    out.innerHTML = `<p class="verdict">None of your lines pass within ${orb().toLocaleString()} km of ${pl.label}.</p><p class="sub" style="margin-top:8px">In astrocartography terms that's a place without a strong planetary emphasis for you. Try a wider range, or another city.</p>`;
    return;
  }
  out.innerHTML = `<p class="verdict">${hits.length === 1 ? "One of your lines passes" : `${hits.length} of your lines pass`} within ${orb().toLocaleString()} km of ${pl.label}.</p>
   <div class="file" style="margin-top:16px"><div class="entries-label label" style="border-top:0">Item entries · nearest first</div>
   ${hits
     .map((h, i) => {
       const r = READ[h.p.name][h.a];
       return `<div class="entry"><div class="entry-bar label"><b>Entry ${pad(i + 1)}</b><span>${h.p.name} · ${h.a} — ${ANG[h.a].name}</span><span class="r">${Math.round(h.d)} km · ${mi(h.d)} mi · ${strength(h.d)}</span></div>
     <div class="entry-body"><div class="txt"><p>${r[0]}</p><div class="gw"><div><span class="label">Good for</span>${r[1]}</div><div><span class="label">Watch out for</span>${r[2]}</div></div><button type="button" class="linkbtn" data-open="${h.p.name}">Open the ${h.p.name} record</button></div></div></div>`;
     })
     .join("")}</div>`;
}
