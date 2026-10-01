// Entry point: wires the modules together and runs the first calculation.
import { CITIES, cityLabel } from "./data/cities.js";
import { initKey } from "./key.js";
import { computeLines } from "./lines.js";
import { applyZoom, initMap, renderTabs } from "./map.js";
import { chooseCity, initPlace, renderHits } from "./place.js";
import {
  initPlanets,
  layoutRec,
  openRec,
  renderRec,
  updateCards,
} from "./planets.js";
import { expandSection, initSections } from "./sections.js";
import { app } from "./state.js";
import { KEY, load, persist, save } from "./storage.js";
import { fmtOff, initTimeZones, toUTC } from "./time.js";
import { $ } from "./util.js";

initSections();
initTimeZones();
initPlace(() => {
  persist();
  refresh();
});
initMap();
initKey();
initPlanets();

document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-city]");
  if (c) {
    chooseCity(+c.dataset.city);
    expandSection($("place"));
    $("place").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const o = e.target.closest("[data-open]");
  if (o) {
    expandSection($("specimens"));
    openRec(o.dataset.open, true);
  }
});

// Redraw everything that depends on the lines or the chosen place.
function refresh() {
  updateCards();
  applyZoom();
  renderHits();
  if (app.openP) renderRec();
}
// Read the form and calculate the lines. Returns false if the form can't be read.
function run() {
  const err = $("err");
  err.hidden = true;
  if (!$("bd").value || !$("bt").value) {
    err.textContent = "Enter both your birth date and birth time.";
    err.hidden = false;
    return false;
  }
  try {
    const { ts, off } = toUTC(
      $("bd").value,
      $("bt").value,
      $("tz").value,
      $("off").value,
    );
    const d = new Date(ts);
    app.lines = computeLines(d);
    $("moment").textContent =
      `Calculated for ${d.toISOString().slice(0, 16).replace("T", " ")} UTC · offset ${fmtOff(off)}`;
    $("recno").textContent =
      `Record no. ${$("bd").value.replace(/-/g, "")}-${$("bt").value.replace(":", "")}`;
    refresh();
    return true;
  } catch (e) {
    err.textContent = e.message || "That date and time couldn't be read.";
    err.hidden = false;
    return false;
  }
}
$("f").addEventListener("submit", (e) => {
  e.preventDefault();
  if (run()) save();
});
$("clear").addEventListener("click", () => {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {}
  for (const id of ["off", "lat", "lon"]) $(id).value = "";
  $("bd").value = "1995-06-15";
  $("bt").value = "09:30";
  $("tz").value = "America/New_York";
  $("city").value = "";
  app.selCity = null;
  $("clear").hidden = true;
  $("savedTag").textContent = "Example";
  run();
});
for (const id of ["orb", "lat", "lon"])
  $(id).addEventListener("input", () => {
    persist();
    refresh();
  });
function boot() {
  const d = load();
  if (d) {
    for (const k of ["bd", "bt", "off", "lat", "lon"])
      if (d[k]) $(k).value = d[k];
    if (d.tz) {
      $("tz").value = d.tz;
      if ($("tz").selectedIndex < 0) $("tz").value = "UTC";
    }
    if (d.orb) $("orb").value = d.orb;
    if (d.city) {
      const c = CITIES.find((x) => cityLabel(x) === d.city);
      if (c) {
        app.selCity = c;
        $("city").value = d.city;
      }
    }
    $("clear").hidden = false;
    $("savedTag").textContent = "Saved";
    $("savedTag").hidden = false;
  }
  renderTabs();
  layoutRec();
  if (run()) return;
  refresh();
}
boot();
