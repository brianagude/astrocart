// The astronomy: where each planet's four lines fall for a given moment.
import {
  Ecliptic,
  EquatorFromVector,
  GeoVector,
  MakeTime,
  Rotation_EQJ_EQD,
  RotateVector,
  SiderealTime,
} from "astronomy-engine";
import { NAMES } from "./data/planets.js";
import { app } from "./state.js";
import { norm, pad, rad } from "./util.js";

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export function computeLines(date) {
  const t = MakeTime(date),
    gast = SiderealTime(t) * 15,
    rot = Rotation_EQJ_EQD(t);
  return NAMES.map((name) => {
    const vec = GeoVector(name, t, true);
    const eq = EquatorFromVector(RotateVector(rot, vec));
    const ra = eq.ra * 15,
      dec = eq.dec,
      mc = norm(ra - gast),
      elon = Ecliptic(vec).elon;
    return {
      name,
      dec,
      mc,
      ic: norm(mc + 180),
      elon,
      horizon(lat, kind) {
        const c = -Math.tan(lat * rad) * Math.tan(dec * rad);
        if (Math.abs(c) > 1) return null;
        const H0 = Math.acos(c) / rad;
        return norm(kind === "ASC" ? mc - H0 : mc + H0);
      },
    };
  });
}
export const planetLines = (n) =>
  app.lines && app.lines.find((p) => p.name === n);
export function lineLonAt(p, a, lat) {
  if (a === "MC") return p.mc;
  if (a === "IC") return p.ic;
  return p.horizon(lat, a);
}
export function distKm(lineLon, lat, lon) {
  if (lineLon === null) return null;
  return Math.abs(norm(lon - lineLon)) * Math.cos(lat * rad) * 111.32;
}
export function signOf(elon) {
  const s = Math.floor(elon / 30) % 12,
    w = elon - s * 30,
    d = Math.floor(w),
    m = Math.floor((w - d) * 60);
  return { sign: SIGNS[s], txt: `${d}° ${pad(m)}′ ${SIGNS[s]}` };
}
export const strength = (d) =>
  d < 150 ? "Very close" : d < 400 ? "Close" : "In range";
