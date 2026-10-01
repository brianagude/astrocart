// Small helpers shared by every module.
export const $ = (id) => document.getElementById(id);
export const rad = Math.PI / 180;
export const norm = (x) => (((x % 360) + 540) % 360) - 180;
export const fmtLon = (l) => Math.abs(l).toFixed(1) + "°" + (l < 0 ? "W" : "E");
export const fmtLat = (l) => Math.abs(l).toFixed(0) + "°" + (l < 0 ? "S" : "N");
export const mi = (k) => Math.round(k * 0.621371);
export const pad = (n) => String(n).padStart(2, "0");
