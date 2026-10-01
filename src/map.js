// The world map: graticule, planetary lines, the place marker, zoom and planet tabs.
import { NAMES } from "./data/planets.js";
import { BORDERS, LAND } from "./data/world-map.js";
import { planetLines } from "./lines.js";
import { getPlace } from "./place.js";
import { app } from "./state.js";
import { $ } from "./util.js";

const NS = "http://www.w3.org/2000/svg";
const X = (lon) => lon + 180,
  Y = (lat) => 90 - lat;
function el(tag, attrs, txt) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (txt) e.textContent = txt;
  return e;
}
function renderGrat() {
  const g = $("grat");
  g.innerHTML = "";
  const k = app.vbW / 360;
  for (let lo = -150; lo <= 150; lo += 30)
    g.appendChild(
      el("line", { x1: X(lo), x2: X(lo), y1: -10, y2: 190, class: "grat" }),
    );
  for (let la = -60; la <= 75; la += 30)
    g.appendChild(
      el("line", { x1: -10, x2: 370, y1: Y(la), y2: Y(la), class: "grat" }),
    );
  if (!app.zoomed) {
    for (const la of [60, 30, 0, -30, -60])
      g.appendChild(
        el(
          "text",
          { x: 1.5, y: Y(la) - 1, class: "gl", "font-size": 3 },
          la === 0 ? "0°" : Math.abs(la) + "°" + (la > 0 ? "N" : "S"),
        ),
      );
    for (let lo = -150; lo <= 150; lo += 60)
      g.appendChild(
        el(
          "text",
          { x: X(lo) + 1, y: 151.5, class: "gl", "font-size": 3 },
          lo === 0 ? "0°" : Math.abs(lo) + "°" + (lo > 0 ? "E" : "W"),
        ),
      );
  }
}
export function renderMap() {
  const g = $("plines");
  g.innerHTML = "";
  $("mapEmpty").hidden = !!app.lines;
  if (!app.lines) return;
  const k = app.vbW / 360,
    vb = $("map").getAttribute("viewBox").split(" ").map(Number);
  for (const p of app.lines) {
    const on = app.focusP === p.name,
      cls = app.focusP ? (on ? " on" : " dim") : "";
    for (const a of ["MC", "IC"]) {
      const lo = a === "MC" ? p.mc : p.ic;
      g.appendChild(
        el("line", {
          x1: X(lo),
          x2: X(lo),
          y1: -10,
          y2: 190,
          class: `pl ${a}${cls}`,
        }),
      );
    }
    for (const a of ["ASC", "DSC"]) {
      let d = "",
        prev = null;
      for (let la = -80; la <= 80; la += app.zoomed ? 0.1 : 0.5) {
        const lo = p.horizon(la, a);
        if (lo === null) {
          prev = null;
          continue;
        }
        d +=
          (prev === null || Math.abs(lo - prev) > 90 ? "M" : "L") +
          X(lo).toFixed(2) +
          " " +
          Y(la).toFixed(2);
        prev = lo;
      }
      if (d) g.appendChild(el("path", { d, class: `pl ${a}${cls}` }));
    }
  }
  if (app.focusP) {
    const p = planetLines(app.focusP);
    const fs = 3.4 * k,
      sw = 1.4 * k;
    for (const a of ["MC", "IC"]) {
      const lo = a === "MC" ? p.mc : p.ic;
      g.appendChild(
        el(
          "text",
          {
            x: X(lo) + 1 * k,
            y: vb[1] + (a === "MC" ? 5 : 10) * k,
            class: "plab",
            "font-size": fs,
            "stroke-width": sw,
          },
          `${p.name} ${a}`,
        ),
      );
    }
    for (const a of ["ASC", "DSC"]) {
      const top = 90 - vb[1] - 12 * k;
      for (let la = Math.min(60, top); la > -60; la -= 1) {
        const lo = p.horizon(la, a);
        if (
          lo !== null &&
          X(lo) > vb[0] + 2 * k &&
          X(lo) < vb[0] + vb[2] - 20 * k
        ) {
          g.appendChild(
            el(
              "text",
              {
                x: X(lo) + 1.2 * k,
                y: Y(la),
                class: "plab",
                "font-size": fs,
                "stroke-width": sw,
              },
              `${p.name} ${a}`,
            ),
          );
          break;
        }
      }
    }
  }
}
function renderMark() {
  const g = $("pmark");
  g.innerHTML = "";
  const pl = getPlace();
  if (pl.error || pl.none) return;
  const k = app.vbW / 360;
  g.appendChild(
    el("circle", { cx: X(pl.lon), cy: Y(pl.lat), r: 2.6 * k, class: "mark" }),
  );
  g.appendChild(
    el("circle", {
      cx: X(pl.lon),
      cy: Y(pl.lat),
      r: 0.7 * k,
      class: "markdot",
    }),
  );
  g.appendChild(
    el(
      "text",
      {
        x: X(pl.lon) + 3.6 * k,
        y: Y(pl.lat) + 1.3 * k,
        class: "placelab",
        "font-size": 4 * k,
        "stroke-width": 1.4 * k,
      },
      pl.short,
    ),
  );
}
export function applyZoom() {
  const svg = $("map"),
    pl = getPlace(),
    box = $("mapbox");
  if (app.zoomed && (pl.none || pl.error)) app.zoomed = false;
  if (!app.zoomed) {
    app.vbW = 360;
    svg.setAttribute("viewBox", "0 12 360 141");
  } else {
    app.vbW = 40;
    const h = (app.vbW * 141) / 360;
    svg.setAttribute(
      "viewBox",
      `${X(pl.lon) - app.vbW / 2} ${Y(pl.lat) - h / 2} ${app.vbW} ${h}`,
    );
  }
  $("dots").setAttribute("patternTransform", `scale(${app.vbW / 360})`);
  box.classList.toggle("zoomed", app.zoomed);
  $("zWorld").setAttribute("aria-pressed", !app.zoomed);
  $("zPlace").setAttribute("aria-pressed", app.zoomed);
  $("zPlace").disabled = !!(pl.none || pl.error);
  $("plateMeta").textContent = app.zoomed
    ? `Detail · ${pl.short}`
    : "World · equirectangular";
  renderGrat();
  renderMap();
  renderMark();
  if (!app.zoomed && !pl.none && !pl.error)
    requestAnimationFrame(() => {
      box.scrollLeft = Math.max(
        0,
        (X(pl.lon) / 360) * box.scrollWidth - box.clientWidth / 2,
      );
    });
}
export function renderTabs() {
  $("tabs").innerHTML = [null, ...NAMES]
    .map(
      (n, i) =>
        `<button type="button" class="tab" role="tab" aria-selected="${app.focusP === n}" data-focus="${n || ""}">${n ? i + " " + n : "All"}</button>`,
    )
    .join("");
}
export function initMap() {
  $("land").setAttribute("d", LAND);
  $("borders").setAttribute("d", BORDERS);
  $("zWorld").addEventListener("click", () => {
    app.zoomed = false;
    applyZoom();
  });
  $("zPlace").addEventListener("click", () => {
    app.zoomed = true;
    applyZoom();
  });
  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-focus]");
    if (!b) return;
    app.focusP = b.dataset.focus || null;
    renderTabs();
    renderMap();
  });
}
