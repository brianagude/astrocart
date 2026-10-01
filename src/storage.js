// Saves the form to this browser's localStorage so it survives a reload.
import { cityLabel } from "./data/cities.js";
import { app } from "./state.js";
import { $ } from "./util.js";

export const KEY = "astrocartography-reader.v1";
export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) {
    return null;
  }
}
export // Re-save only if the visitor has already saved once.
function persist() {
  const cur = load();
  if (!cur) return;
  save();
}
export function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        bd: $("bd").value,
        bt: $("bt").value,
        tz: $("tz").value,
        off: $("off").value,
        city: app.selCity ? cityLabel(app.selCity) : "",
        lat: $("lat").value,
        lon: $("lon").value,
        orb: $("orb").value,
      }),
    );
    $("savedTag").textContent = "Saved";
    $("savedTag").hidden = false;
    $("clear").hidden = false;
  } catch (e) {}
}
