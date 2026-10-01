// Shared UI state. Modules read and write these fields directly.
export const app = {
  lines: null, // the ten planets' computed lines; null until the first calculation
  openP: null, // planet whose record is open
  focusP: null, // planet highlighted on the map
  zoomed: false, // whether the map is zoomed to the chosen place
  vbW: 360, // current width of the map's viewBox
  selCity: null, // the chosen entry from CITIES
};
