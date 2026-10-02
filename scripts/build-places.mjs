// Rebuilds src/data/places.txt, the birth city list, from GeoNames.
// Run with `npm run places`. Needs curl and unzip.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { searchKey } from "../src/util.js";

const BASE = "https://download.geonames.org/export/dump/";
const OUT = new URL("../src/data/places.txt", import.meta.url);
// Extra words a region can be found by, on top of its names and codes.
const ALIASES = { US: "USA America", GB: "UK Britain", AE: "UAE" };

const dir = mkdtempSync(join(tmpdir(), "places-"));
const get = (file) => {
  execFileSync("curl", ["-fsSL", BASE + file, "-o", join(dir, file)]);
  if (file.endsWith(".zip"))
    execFileSync("unzip", ["-oq", join(dir, file), "-d", dir]);
  return readFileSync(join(dir, file.replace(/\.zip$/, ".txt")), "utf8");
};
const rows = (text) =>
  text
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("\t"));

const countries = new Map(rows(get("countryInfo.txt")).map((r) => [r[0], r[4]]));
const admins = new Map(
  rows(get("admin1CodesASCII.txt")).map((r) => [r[0], r[1]]),
);

const tzs = [],
  tzIdx = new Map(),
  regions = [],
  regionIdx = new Map();
const index = (list, map, id, make) => {
  if (!map.has(id)) {
    map.set(id, list.length);
    list.push(make());
  }
  return map.get(id);
};

// latitude and longitude to 0.01°, as three base-36 digits each
const b36 = (deg, shift) =>
  Math.round((+deg + shift) * 100)
    .toString(36)
    .padStart(3, "0");
const places = [];
// every populated place with 500+ people, plus the seats of smaller districts
for (const r of rows(get("cities500.zip"))) {
  const [, name, ascii] = r,
    cc = r[8],
    a1 = r[10],
    tz = r[17];
  if (!name || !tz || !countries.has(cc)) continue;
  const admin = admins.get(`${cc}.${a1}`) || "";
  const region = index(regions, regionIdx, `${cc}.${admin}`, () => [
    admin,
    countries.get(cc),
    // state and country codes, so "Springfield, IL" and "Paris, FR" work
    [/^[A-Z]+$/.test(a1) && admin ? a1 : "", cc, ALIASES[cc] || ""]
      .filter(Boolean)
      .join(" "),
  ]);
  const zone = index(tzs, tzIdx, tz, () => tz);
  const cols = [
    name,
    region.toString(36),
    zone.toString(36),
    b36(r[4], 90) + b36(r[5], 180),
  ];
  // keep the plain spelling only where stripping accents doesn't produce it
  if (searchKey(ascii) !== searchKey(name)) cols.push(ascii);
  places.push({
    pop: +r[14] || 0,
    name,
    id: `${name}|${region}|${zone}`,
    line: cols.join("\t"),
  });
}
// biggest first, so the search can stop at the first few matches
places.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name));
// the picker can't tell apart two places with the same name, region and zone: keep the bigger
const seen = new Set();
const unique = places.filter((p) => !seen.has(p.id) && seen.add(p.id));

writeFileSync(
  OUT,
  JSON.stringify({ tz: tzs, regions }) +
    "\n" +
    unique.map((p) => p.line).join("\n") +
    "\n",
);
console.log(
  `${unique.length} places, ${regions.length} regions, ${tzs.length} time zones`,
);
