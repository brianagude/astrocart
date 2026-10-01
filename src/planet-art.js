// Halftone planet drawings, rendered onto a canvas.
function h3(x, y, z) {
  let h =
    Math.imul(x, 374761393) ^
    Math.imul(y, 668265263) ^
    Math.imul(z, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, z) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z),
    xf = x - xi,
    yf = y - yi,
    zf = z - zi;
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf),
    w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(
      l(h3(xi, yi, zi), h3(xi + 1, yi, zi), u),
      l(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u),
      v,
    ),
    l(
      l(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u),
      l(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u),
      v,
    ),
    w,
  );
}
function fbm(x, y, z, o) {
  let s = 0,
    a = 0.5,
    f = 1,
    t = 0;
  for (let i = 0; i < (o || 4); i++) {
    s += a * vnoise(x * f, y * f, z * f);
    t += a;
    a *= 0.5;
    f *= 2.03;
  }
  return s / t;
}
const ss = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const nrm = (v) => {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
};
const ART = {
  Sun: {
    R: 0.44,
    L: null,
    lo: 0.38,
    hi: 0.72,
    tex: (x, y, z) => {
      const g = fbm(x * 7 + 3, y * 7, z * 7, 4);
      return (0.35 + 0.75 * g) * (0.55 + 0.45 * Math.pow(z, 0.4));
    },
  },
  Moon: {
    R: 0.44,
    L: nrm([0.95, -0.15, 0.35]),
    lo: 0.22,
    hi: 0.62,
    tex: (x, y, z) => {
      const m = ss(0.5, 0.58, fbm(x * 2.1 + 9, y * 2.1, z * 2.1, 4));
      const c = fbm(x * 16, y * 16, z * 16, 2);
      return 0.92 - 0.6 * m - 0.25 * ss(0.6, 0.7, c);
    },
  },
  Mercury: {
    R: 0.44,
    L: nrm([-0.55, -0.35, 0.75]),
    lo: 0.3,
    hi: 0.62,
    tex: (x, y, z) => {
      const s = fbm(x * 9 + 2, y * 9, z * 9, 3);
      return 0.28 + 0.7 * ss(0.56, 0.64, s);
    },
  },
  Venus: {
    R: 0.44,
    L: nrm([1, -0.05, 0.12]),
    lo: 0.3,
    hi: 0.7,
    tex: (x, y, z) => {
      const w = fbm(x * 1.6, y * 1.6, z * 1.6, 3);
      return (
        0.55 + 0.5 * (fbm(x * 2 + w * 2, y * 5 + w * 2, z * 2, 4) - 0.5) * 2
      );
    },
  },
  Mars: {
    R: 0.44,
    L: nrm([0.45, -0.35, 0.82]),
    lo: 0.3,
    hi: 0.66,
    tex: (x, y, z) => {
      if (y < -0.84) return 1;
      const p = ss(0.5, 0.6, fbm(x * 3 + 5, y * 3, z * 3, 4));
      return 0.8 - 0.55 * p;
    },
  },
  Jupiter: {
    R: 0.44,
    L: nrm([0.25, -0.2, 0.95]),
    lo: 0.32,
    hi: 0.68,
    tex: (x, y, z) => {
      const n = fbm(x * 3, y * 3, z * 3, 4);
      let b = 0.5 + 0.5 * Math.sin(y * 15 + 2.4 * (n - 0.5));
      const dx = (x - 0.32) / 0.17,
        dy = (y - 0.3) / 0.09;
      const e = dx * dx + dy * dy;
      if (e < 1) b = e < 0.45 ? 0.08 : 0.95;
      return 0.2 + 0.75 * b;
    },
  },
  Saturn: {
    R: 0.3,
    L: nrm([0.5, -0.45, 0.74]),
    lo: 0.3,
    hi: 0.7,
    ring: { rx: 1.6, ry: 0.36, tilt: -0.22 },
    tex: (x, y, z) =>
      0.62 + 0.25 * Math.sin(y * 11 + 1.5 * fbm(x * 3, y * 3, z * 3, 3)),
  },
  Uranus: {
    R: 0.36,
    L: nrm([-0.85, -0.2, 0.5]),
    lo: 0.3,
    hi: 0.66,
    ring: { rx: 1.3, ry: 0.17, tilt: 1.25, thin: true },
    tex: (x, y, z) => 0.8 + 0.08 * Math.sin(y * 6),
  },
  Neptune: {
    R: 0.44,
    L: nrm([0.3, -0.25, 0.92]),
    lo: 0.3,
    hi: 0.62,
    tex: (x, y, z) => {
      const c = ss(0.6, 0.66, fbm(x * 2.4 + 4, y * 2.4, z * 2.4, 4));
      return 0.25 + 0.7 * c;
    },
  },
  Pluto: {
    R: 0.44,
    L: nrm([0.6, -0.4, 0.7]),
    lo: 0.3,
    hi: 0.66,
    tex: (x, y, z) => {
      const n = fbm(x * 3.5 + 7, y * 3.5, z * 3.5, 4);
      const h = x * 0.55 + y * 0.55 + z * 0.63;
      return 0.32 + 0.4 * n + 0.45 * ss(0.62, 0.72, h + 0.25 * (n - 0.5));
    },
  },
};
export function drawPlanet(cv, name) {
  const css = cv.clientWidth || 180,
    dpr = Math.min(2, window.devicePixelRatio || 1),
    W = Math.round(css * dpr);
  cv.width = W;
  cv.height = W;
  const ctx = cv.getContext("2d"),
    cfg = ART[name],
    c = W / 2,
    R = W * cfg.R,
    g = Math.max(1, Math.round(dpr));
  const ink = "#1B1B19";
  const ring = (front) => {
    if (!cfg.ring) return;
    const r = cfg.ring;
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(r.tilt);
    ctx.strokeStyle = ink;
    const bands = r.thin
      ? [[1, 1.2]]
      : [
          [1, 2.2],
          [0.93, 1.2],
          [0.82, 3.2],
          [0.72, 1],
        ];
    for (const [k, lw] of bands) {
      ctx.lineWidth = lw * dpr;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        R * r.rx * k,
        R * r.ry * k,
        0,
        front ? 0 : Math.PI,
        front ? Math.PI : Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
  };
  ring(false);
  ctx.fillStyle = "#E7E5DF";
  ctx.beginPath();
  ctx.arc(c, c, R, 0, Math.PI * 2);
  ctx.fill();
  const img = ctx.createImageData(W, W),
    d = img.data;
  for (let py = 0; py < W; py += g)
    for (let px = 0; px < W; px += g) {
      const nx = (px + g / 2 - c) / R,
        ny = (py + g / 2 - c) / R,
        rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      let b = cfg.tex(nx, ny, nz);
      if (cfg.L) {
        const lam = nx * cfg.L[0] + ny * cfg.L[1] + nz * cfg.L[2];
        b *= ss(-0.08, 0.35, lam);
      }
      b = ss(cfg.lo, cfg.hi, b);
      if (b < h3(px, py, name.length * 7)) {
        for (let yy = 0; yy < g; yy++)
          for (let xx = 0; xx < g; xx++) {
            const i = ((py + yy) * W + px + xx) * 4;
            d[i] = 27;
            d[i + 1] = 27;
            d[i + 2] = 25;
            d[i + 3] = 255;
          }
      }
    }
  const tmp = document.createElement("canvas");
  tmp.width = W;
  tmp.height = W;
  tmp.getContext("2d").putImageData(img, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.arc(c, c, R, 0, Math.PI * 2);
  ctx.stroke();
  if (cfg.ring) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, W);
    ctx.arc(c, c, R + 0.5, 0, Math.PI * 2, true);
    ctx.clip("evenodd");
    ring(false);
    ctx.restore();
    ring(true);
  }
}
