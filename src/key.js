// The map legend and the "How to read the lines" diagrams.
import { ANG, ORDER } from "./data/angles.js";
import { $ } from "./util.js";

function sampleSVG(a) {
  const curved = a === "ASC" || a === "DSC";
  const dash =
    a === "DSC"
      ? ' stroke-dasharray="4 2.5"'
      : a === "IC"
        ? ' stroke-dasharray="1 2.4"'
        : "";
  return `<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true"><path d="${curved ? "M2 15 C 8 13, 14 8, 20 1" : "M11 1 L11 15"}" fill="none" stroke="#1B1B19" stroke-width="1.6"${dash}/></svg>`;
}
function angleDiagram(a) {
  const pos = { ASC: [22, 46], DSC: [98, 46], MC: [60, 10], IC: [60, 82] }[a];
  return `<svg width="120" height="92" viewBox="0 0 120 92" aria-hidden="true">
   <path d="M22 46 A38 36 0 0 1 98 46" fill="none" stroke="#1B1B19" stroke-width="1"/>
   <path d="M22 46 A38 36 0 0 0 98 46" fill="none" stroke="#1B1B19" stroke-width="1" stroke-dasharray="2 3"/>
   <line x1="4" y1="46" x2="116" y2="46" stroke="#1B1B19" stroke-width="1.6"/>
   <text x="4" y="58" font-family="Courier Prime,monospace" font-size="8" fill="#55534D">EAST</text>
   <text x="116" y="58" text-anchor="end" font-family="Courier Prime,monospace" font-size="8" fill="#55534D">WEST</text>
   <circle cx="60" cy="46" r="2" fill="#1B1B19"/>
   <circle cx="${pos[0]}" cy="${pos[1]}" r="6" fill="#1B1B19"/>
  </svg>`;
}
export function initKey() {
  $("key").innerHTML = ORDER.map(
    (a) => `<span>${sampleSVG(a)}${a} ${ANG[a].name}</span>`,
  ).join("");
  $("angles").innerHTML = ORDER.map(
    (a) =>
      `<div class="angle">${angleDiagram(a)}<h3>${ANG[a].name}<span class="label">${a}</span></h3><p>${ANG[a].what}</p><span class="label muted onmap">${sampleSVG(a)}On the map: ${ANG[a].style.toLowerCase()}</span></div>`,
  ).join("");
}
