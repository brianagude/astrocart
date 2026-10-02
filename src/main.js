// Entry point: wires the modules together and runs the first calculation.
import { EXAMPLE_BIRTH, initBirthplace, setBirth } from "./birthplace.js";
import { CITIES, cityLabel } from "./data/cities.js";
import { initKey } from "./key.js";
import { computeLines } from "./lines.js";
import { applyZoom, initMap, renderTabs } from "./map.js";
import { chooseCity, followBirth, initPlace, renderHits } from "./place.js";
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
import { fmtOff, toUTC } from "./time.js";
import { $ } from "./util.js";

initSections();
initBirthplace(followBirth);
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
    return;
  }
  if (e.target.closest("[data-zoom]")) {
    app.zoomed = true;
    applyZoom();
    $("map").scrollIntoView({ behavior: "smooth", block: "center" });
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
  // the time zone comes from the birth city unless an offset is typed in
  const manual = $("off").value.trim();
  if (!manual && !app.birth) {
    err.textContent =
      "Choose your birth city from the list, or enter your UTC offset.";
    err.hidden = false;
    return false;
  }
  try {
    const { ts, off } = toUTC(
      $("bd").value,
      $("bt").value,
      app.birth?.tz,
      $("off").value,
    );
    const d = new Date(ts);
    app.lines = computeLines(d);
    $("moment").textContent =
      `Calculated for ${d.toISOString().slice(0, 16).replace("T", " ")} UTC · ${manual ? "" : app.birth.tz.replace(/_/g, " ") + " · "}offset ${fmtOff(off)}`;
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
  setBirth(EXAMPLE_BIRTH);
  $("city").value = "";
  app.selCity = null;
  $("clear").hidden = true;
  $("savedTag").textContent = "Example";
  followBirth(EXAMPLE_BIRTH);
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
    if (d.birth?.tz) setBirth(d.birth);
    // saved before the city picker existed: only the time zone is known
    else if (d.tz) setBirth({ label: d.tz.replace(/_/g, " "), tz: d.tz });
    if (d.orb) $("orb").value = d.orb;
    // older saves kept only the label of a city from the built-in list
    const c = Array.isArray(d.place)
      ? d.place
      : d.city && CITIES.find((x) => cityLabel(x) === d.city);
    if (c) {
      app.selCity = c;
      app.cityFromBirth = !!d.cityFromBirth;
      $("city").value = cityLabel(c);
    }
    $("clear").hidden = false;
    $("savedTag").textContent = "Saved";
    $("savedTag").hidden = false;
  }
  renderTabs();
  layoutRec();
  if (!d) followBirth(EXAMPLE_BIRTH);
  if (run()) return;
  refresh();
}
boot();
