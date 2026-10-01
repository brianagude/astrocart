// The planet grid ("specimens") and the record that opens beneath a planet.
import { ANG, ORDER } from "./data/angles.js";
import { cityLabel } from "./data/cities.js";
import { INFO, NAMES, PLANET_INTRO } from "./data/planets.js";
import { READ } from "./data/readings.js";
import { distKm, lineLonAt, planetLines, signOf } from "./lines.js";
import { renderMap, renderTabs } from "./map.js";
import { citiesNear, getPlace, orb } from "./place.js";
import { drawPlanet } from "./planet-art.js";
import { app } from "./state.js";
import { $, fmtLat, fmtLon, pad } from "./util.js";

const grid = $("specimens");

export function initPlanets() {
  grid.innerHTML =
    NAMES.map(
      (
        n,
        i,
      ) => `<button type="button" class="spec" id="spec-${n}" data-p="${n}" aria-expanded="false" aria-controls="rec">
  <span class="spec-head"><span class="spec-name">${i + 1} ${n}</span><span class="spec-sign" id="sg-${n}"></span></span>
  <canvas aria-hidden="true" id="cv-${n}"></canvas>
  <span class="spec-cap">${INFO[n].cap}</span>
  <span class="spec-foot"><span id="st-${n}">Learn more</span><b aria-hidden="true">+</b></span></button>`,
    ).join("") +
    `<div class="rec" id="rec" role="region" aria-live="polite" hidden></div>`;
  NAMES.forEach((n, i) =>
    setTimeout(() => drawPlanet($("cv-" + n), n), 30 + i * 25),
  );
  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".spec");
    if (b) openRec(app.openP === b.dataset.p ? null : b.dataset.p, true);
  });
  window.addEventListener("resize", () => {
    layoutRec();
  });
  $("rec").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) {
      const n = app.openP;
      openRec(null);
      $("spec-" + n).focus();
    }
  });
}
function cols() {
  return getComputedStyle(grid).gridTemplateColumns.split(" ").length;
}
export function layoutRec() {
  const rec = $("rec");
  const n = cols();
  NAMES.forEach((p, j) => {
    const s = $("spec-" + p);
    s.style.order = j * 2;
    s.setAttribute("aria-expanded", app.openP === p);
  });
  grid.classList.toggle("has-open", !!app.openP);
  if (!app.openP) {
    rec.hidden = true;
    return;
  }
  const i = NAMES.indexOf(app.openP),
    rowEnd = Math.min(NAMES.length - 1, Math.floor(i / n) * n + n - 1);
  rec.style.order = rowEnd * 2 + 1;
  rec.hidden = false;
}
export function openRec(n, scroll) {
  app.openP = n;
  app.focusP = n;
  renderTabs();
  renderMap();
  renderRec();
  layoutRec();
  if (n && scroll)
    requestAnimationFrame(() =>
      $("rec").scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    );
}
function entryHTML(n, a, idx) {
  const r = READ[n][a],
    p = planetLines(n);
  let coords = "",
    where;
  if (p) {
    coords =
      a === "MC" || a === "IC"
        ? `Runs along ${fmtLon(a === "MC" ? p.mc : p.ic)}`
        : [60, 40, 20]
            .map((l) => {
              const v = p.horizon(l, a);
              return v === null ? null : `${fmtLat(l)} ${fmtLon(v)}`;
            })
            .filter(Boolean)
            .join(" · ");
    const near = citiesNear(p, a, 8);
    where = near.length
      ? `<ul class="cities">${near.map((x) => `<li><button type="button" data-city="${x.i}"><span>${cityLabel(x.c)}</span><small>${Math.round(x.d)} km</small></button></li>`).join("")}</ul>`
      : `<p class="empty">No listed cities within ${orb().toLocaleString()} km.</p>`;
  } else
    where = `<p class="empty">Set your birth details to see where this line runs.</p>`;
  return `<div class="entry"><div class="entry-bar label"><b>${pad(NAMES.indexOf(n) + 1)}.${idx + 1}</b><span>${a} — ${ANG[a].name}</span><span class="r muted">${coords}</span></div>
   <div class="entry-body"><div class="txt"><p>${r[0]}</p><div class="gw"><div><span class="label">Good for</span>${r[1]}</div><div><span class="label">Watch out for</span>${r[2]}</div></div></div>
   <div class="where"><span class="label">Passes near</span>${where}</div></div></div>`;
}
export function renderRec() {
  const rec = $("rec");
  if (!app.openP) {
    rec.innerHTML = "";
    return;
  }
  const n = app.openP,
    i = NAMES.indexOf(n),
    inf = INFO[n],
    p = planetLines(n);
  let count = "";
  if (p) {
    const s = new Set();
    ORDER.forEach((a) => citiesNear(p, a, 999).forEach((x) => s.add(x.i)));
    count = `${s.size} listed ${s.size === 1 ? "city" : "cities"} within ${orb().toLocaleString()} km`;
  }
  rec.innerHTML = `<div class="rec-bar label"><span><b>Record ${pad(i + 1)}</b> / ${n}</span><span class="muted">${inf.standing}</span><button type="button" class="x" data-close>Close ×</button></div>
   <div class="rec-top"><canvas id="cv-big" aria-hidden="true"></canvas>
    <div class="rec-text"><p class="big">${inf.cap}</p><p>${PLANET_INTRO[n]}</p><p>${inf.onmap}</p>
     <dl class="facts">
      <dt>At your birth</dt><dd>${p ? signOf(p.elon).txt : "Set your birth details"}</dd>
      <dt>Tradition</dt><dd>${inf.standing}</dd>
      <dt>Trip around the zodiac</dt><dd>${inf.cycle}</dd>
      ${p ? `<dt>Your ${n} lines</dt><dd>${count}</dd>` : ""}
     </dl>
     <a class="more" href="${inf.link}" target="_blank" rel="noopener">Learn more about ${n} lines</a></div></div>
   <div class="entries-label label">Line entries · 4</div>
   ${ORDER.map((a, j) => entryHTML(n, a, j)).join("")}`;
  requestAnimationFrame(() => {
    const c = $("cv-big");
    if (c) drawPlanet(c, n);
  });
}
export function updateCards() {
  const pl = getPlace();
  NAMES.forEach((n) => {
    const p = planetLines(n);
    $("sg-" + n).textContent = p ? "in " + signOf(p.elon).sign : "";
    let t = "Learn more";
    if (p && !pl.none && !pl.error) {
      let best = null;
      ORDER.forEach((a) => {
        const d = distKm(lineLonAt(p, a, pl.lat), pl.lat, pl.lon);
        if (d !== null && (!best || d < best.d)) best = { a, d };
      });
      if (best && best.d <= orb())
        t = `${best.a} ${Math.round(best.d)} km from ${pl.short}`;
    }
    $("st-" + n).textContent = t;
  });
}
