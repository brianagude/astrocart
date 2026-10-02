// Birth city picker: searches every GeoNames town and keeps the chosen one's time zone.
import placesUrl from "./data/places.txt?url";
import { app } from "./state.js";
import { $, searchKey } from "./util.js";

export const EXAMPLE_BIRTH = {
  label: "Atlanta, Georgia, United States",
  tz: "America/New_York",
  name: "Atlanta",
  region: "Georgia, United States",
  lat: 33.75,
  lon: -84.39,
};
const MAX = 8;

// The list is large, so it's only fetched once the visitor goes to type a city.
let places = null,
  loading = null;
function parse(text) {
  const rows = text.trimEnd().split("\n"),
    head = JSON.parse(rows[0]),
    n = rows.length - 1;
  const p = {
    n,
    tzs: head.tz,
    regions: head.regions,
    // each region's names and codes, space-padded so a query can match whole words or word starts
    regionKeys: head.regions.map((r) => ` ${searchKey(r.join(" "))} `),
    name: new Array(n),
    key: new Array(n),
    alt: new Array(n),
    region: new Array(n),
    tz: new Array(n),
    coord: new Array(n),
  };
  for (let i = 0; i < n; i++) {
    const c = rows[i + 1].split("\t");
    p.name[i] = c[0];
    p.key[i] = searchKey(c[0]);
    p.region[i] = parseInt(c[1], 36);
    p.tz[i] = parseInt(c[2], 36);
    p.coord[i] = c[3];
    if (c[4]) p.alt[i] = searchKey(c[4]);
  }
  return p;
}
function loadPlaces() {
  loading ??= fetch(placesUrl)
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then((t) => {
      places = parse(t);
    })
    .catch((e) => {
      loading = null;
      throw e;
    });
  return loading;
}

// Places are stored biggest first, so each group comes out in that order.
function scan(qn, qr) {
  let ok = null;
  if (qr) {
    // a whole word ("MA" is Massachusetts) beats the start of one (Maryland, Maine)
    ok = places.regionKeys.map((k) => k.includes(` ${qr} `));
    if (!ok.includes(true))
      ok = places.regionKeys.map((k) => k.includes(` ${qr}`));
  }
  const exact = [],
    pre = [],
    sub = [];
  for (let i = 0; i < places.n && exact.length < MAX; i++) {
    if (ok && !ok[places.region[i]]) continue;
    const k = places.key[i],
      a = places.alt[i];
    if (k === qn || a === qn) exact.push(i);
    else if (k.startsWith(qn) || (a && a.startsWith(qn))) {
      if (pre.length < MAX) pre.push(i);
    } else if (sub.length < MAX && qn.length > 2 && k.includes(qn)) sub.push(i);
  }
  return exact.concat(pre, sub).slice(0, MAX);
}
function search(text) {
  const comma = text.indexOf(",");
  if (comma >= 0) {
    const qn = searchKey(text.slice(0, comma));
    return qn ? scan(qn, searchKey(text.slice(comma + 1))) : [];
  }
  const q = searchKey(text);
  if (!q) return [];
  const m = scan(q, "");
  if (m.length) return m;
  // "springfield illinois": try the trailing words as the region
  const words = q.split(" ");
  for (let i = words.length - 1; i > 0; i--) {
    const r = scan(words.slice(0, i).join(" "), words.slice(i).join(" "));
    if (r.length) return r;
  }
  return [];
}

const esc = (s) =>
  s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const regionOf = (i) => places.regions[places.region[i]];
// The chosen place in the shape kept in app.birth.
function birthAt(i) {
  const [admin, country] = regionOf(i),
    name = places.name[i],
    c = places.coord[i];
  const region = [admin !== name && admin !== country ? admin : "", country]
    .filter(Boolean)
    .join(", ");
  return {
    label: region === name ? name : `${name}, ${region}`,
    tz: places.tzs[places.tz[i]],
    name,
    region,
    // three base-36 digits each, in hundredths of a degree
    lat: (parseInt(c.slice(0, 3), 36) - 9000) / 100,
    lon: (parseInt(c.slice(3), 36) - 18000) / 100,
  };
}

let active = -1;
function hide() {
  $("bresults").hidden = true;
  $("bc").setAttribute("aria-expanded", "false");
  $("bc").removeAttribute("aria-activedescendant");
  active = -1;
}
function show(html) {
  $("bresults").innerHTML = html;
  $("bresults").hidden = false;
  $("bc").setAttribute("aria-expanded", "true");
  $("bc").removeAttribute("aria-activedescendant");
  active = -1;
}
const note = (t) => `<li aria-disabled="true">${t}</li>`;
async function showResults() {
  const text = $("bc").value;
  if (!text.trim()) return hide();
  if (!places) {
    show(note("Loading places…"));
    try {
      await loadPlaces();
    } catch (e) {
      show(
        note(
          "The place list couldn't be loaded. Check your connection, or enter your UTC offset below.",
        ),
      );
      return;
    }
    // the visitor may have typed more, or left, while it loaded
    if (document.activeElement !== $("bc")) return hide();
    return showResults();
  }
  const m = search(text);
  show(
    m.length
      ? m
          .map((i, k) => {
            const [admin, country] = regionOf(i);
            return `<li role="option" id="bopt${k}" data-i="${i}">${esc(places.name[i])}<span>${esc(admin && admin !== country ? admin + " · " : "")}${esc(country)}</span></li>`;
          })
          .join("")
      : note(
          "No match. Try another spelling or the nearest town, or enter your UTC offset below.",
        ),
  );
}
function move(step) {
  const opts = $("bresults").querySelectorAll("li[data-i]");
  if ($("bresults").hidden || !opts.length) return;
  if (active >= 0) opts[active].removeAttribute("aria-selected");
  active = (active + step + opts.length) % opts.length;
  opts[active].setAttribute("aria-selected", "true");
  opts[active].scrollIntoView({ block: "nearest" });
  $("bc").setAttribute("aria-activedescendant", opts[active].id);
}

// Set the birth place, or pass null when the field no longer names a chosen city.
export function setBirth(b) {
  app.birth = b;
  if (b) $("bc").value = b.label;
  $("bzone").textContent = b ? `Time zone · ${b.tz.replace(/_/g, " ")}` : "";
}
// Called with the birth place when one is picked from the list; set by initBirthplace.
let onPick = () => {};
function choose(i) {
  setBirth(birthAt(i));
  hide();
  onPick(app.birth);
}
export function initBirthplace(handler) {
  onPick = handler;
  const input = $("bc");
  setBirth(EXAMPLE_BIRTH);
  input.addEventListener("focus", () => {
    input.select();
    loadPlaces().catch(() => {});
  });
  input.addEventListener("input", () => {
    // typed text isn't a birth place until it's picked from the list
    setBirth(null);
    showResults();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    }
    if (e.key === "Enter" && !$("bresults").hidden) {
      e.preventDefault();
      const opts = $("bresults").querySelectorAll("li[data-i]");
      const li = opts[Math.max(active, 0)];
      if (li) choose(+li.dataset.i);
    }
    if (e.key === "Escape") hide();
  });
  $("bresults").addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li) {
      e.preventDefault();
      choose(+li.dataset.i);
    }
  });
  input.addEventListener("blur", () => setTimeout(hide, 150));
}
