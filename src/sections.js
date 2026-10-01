// Collapsible sections: each section heading becomes a toggle for the content beneath it.
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function setCollapsed(sec, collapsed, animate = true) {
  if (sec.classList.contains("collapsed") === collapsed) return;
  const body = sec.querySelector(".sec-body");
  animate = animate && !reducedMotion.matches;
  // "moving" clips the content while the height animates
  if (animate) body.classList.add("moving");
  else body.style.transition = "none";
  sec.classList.toggle("collapsed", collapsed);
  sec.querySelector(".sec-toggle").setAttribute("aria-expanded", !collapsed);
  sec.querySelector(".sec-state").textContent = collapsed
    ? "Expand"
    : "Collapse";
  body.inert = collapsed;
  if (!animate) {
    body.offsetHeight; // apply the new height before transitions come back
    body.style.transition = "";
    body.classList.remove("moving");
  }
}

// Open the section containing `el` straight away, so it can be scrolled to.
export function expandSection(el) {
  const sec = el.closest(".sec");
  if (sec) setCollapsed(sec, false, false);
}

export function initSections() {
  document.querySelectorAll(".sec").forEach((sec, i) => {
    const head = sec.querySelector(".sec-head");
    const h2 = head.querySelector("h2");

    const body = document.createElement("div");
    body.className = "sec-body";
    body.id = `sec-body-${i + 1}`;
    const inner = document.createElement("div");
    inner.className = "sec-inner";
    inner.append(...[...sec.children].filter((c) => c !== head));
    body.append(inner);
    sec.append(body);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sec-toggle";
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-controls", body.id);
    btn.append(...h2.childNodes);
    h2.append(btn);

    // the word after the small label; the button already announces the state
    const word = document.createElement("span");
    word.className = "sec-state";
    word.setAttribute("aria-hidden", "true");
    word.textContent = "Collapse";
    head.querySelector(".label").append(word);

    btn.addEventListener("click", () =>
      setCollapsed(sec, !sec.classList.contains("collapsed")),
    );
    for (const type of ["transitionend", "transitioncancel"])
      body.addEventListener(type, (e) => {
        if (e.target === body) body.classList.remove("moving");
      });
  });
}
