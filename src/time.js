// Birth time handling: turn a local date, time and zone into a UTC instant.
import { $, pad } from "./util.js";

function tzOffsetMin(tz, ts) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const g = (t) => +p.find((x) => x.type === t).value;
  return (
    (Date.UTC(
      g("year"),
      g("month") - 1,
      g("day"),
      g("hour") % 24,
      g("minute"),
      g("second"),
    ) -
      ts) /
    60000
  );
}
function parseOffset(s) {
  const m = s
    .trim()
    .match(/^(?:UTC|GMT)?\s*([+\-−])?\s*(\d{1,2})(?::?(\d{2}))?$/i);
  if (!m) return null;
  const sign = m[1] === "-" || m[1] === "−" ? -1 : 1,
    h = +m[2],
    n = +(m[3] || 0);
  if (h > 14 || n > 59) return null;
  return sign * (h * 60 + n);
}
export function toUTC(dateStr, timeStr, tz, offStr) {
  const [y, mo, d] = dateStr.split("-").map(Number),
    [h, n] = timeStr.split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, n);
  if (offStr.trim()) {
    const o = parseOffset(offStr);
    if (o === null)
      throw new Error(
        "That UTC offset isn't in a form the page understands. Use something like -5, +1 or +5:30.",
      );
    return { ts: wall - o * 60000, off: o };
  }
  let ts = wall;
  for (let i = 0; i < 4; i++) {
    const o = tzOffsetMin(tz, ts);
    const nx = wall - o * 60000;
    if (nx === ts) break;
    ts = nx;
  }
  return { ts, off: tzOffsetMin(tz, ts) };
}
export const fmtOff = (o) =>
  (o < 0 ? "−" : "+") +
  Math.floor(Math.abs(o) / 60) +
  (Math.abs(o) % 60 ? ":" + pad(Math.abs(o) % 60) : "");

// Fill the time zone picker.
export function initTimeZones() {
  const sel = $("tz");
  let zones = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch (e) {
    zones = [
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
    ];
  }
  if (!zones.includes("UTC")) zones.unshift("UTC");
  const COMMON = [
    ["America/New_York", "US Eastern – Atlanta, New York"],
    ["America/Indiana/Indianapolis", "US Eastern – Indianapolis"],
    ["America/Chicago", "US Central – Chicago"],
    ["America/Denver", "US Mountain – Denver"],
    ["America/Phoenix", "US Mountain – Phoenix"],
    ["America/Los_Angeles", "US Pacific – Los Angeles"],
    ["America/Anchorage", "Alaska – Anchorage"],
    ["Pacific/Honolulu", "Hawaii – Honolulu"],
    ["Europe/London", "UK – London"],
    ["UTC", "UTC / GMT"],
  ];
  const nowOff = (z) => {
    try {
      return (
        "GMT" + fmtOff(tzOffsetMin(z, Math.floor(Date.now() / 60000) * 60000))
      );
    } catch (e) {
      return "";
    }
  };
  const add = (parent, z, label) => {
    const o = document.createElement("option");
    o.value = z;
    o.textContent = `${label} (${nowOff(z)} now)`;
    parent.appendChild(o);
  };
  const g1 = document.createElement("optgroup");
  g1.label = "Common";
  COMMON.forEach(([z, l]) => add(g1, z, l));
  sel.appendChild(g1);
  const g2 = document.createElement("optgroup");
  g2.label = "All time zones";
  zones.forEach((z) => add(g2, z, z.replace(/_/g, " ")));
  sel.appendChild(g2);
  sel.value = "America/New_York";
}
