// One-shot reveal transition played on every theme toggle:
// -> dark: content dissolves out of smoke and drifting ash
// -> light: content blooms out of warm sunlight and golden sparkles
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const canvas = document.querySelector(".theme-transition-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DURATION = 1300;
  let raf = null;

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeSmokePuffs(n, w, h) {
    const puffs = [];
    for (let i = 0; i < n; i++) {
      puffs.push({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(w * 0.15, w * 0.32),
        drift: rand(-20, 20),
        rise: rand(-30, -10),
      });
    }
    return puffs;
  }

  function makeSparkles(n, w, h) {
    const sparks = [];
    const cx = w / 2, cy = h * 0.42;
    for (let i = 0; i < n; i++) {
      const angle = rand(0, Math.PI * 2);
      const dist = rand(0, Math.min(w, h) * 0.55);
      sparks.push({
        x: cx + Math.cos(angle) * dist * 0.15,
        y: cy + Math.sin(angle) * dist * 0.15,
        vx: Math.cos(angle) * rand(0.4, 1.6),
        vy: Math.sin(angle) * rand(0.4, 1.6),
        size: rand(1.5, 4),
      });
    }
    return sparks;
  }

  function drawSmokeFrame(t, w, h, puffs) {
    ctx.clearRect(0, 0, w, h);
    // fast opaque veil in, slow dissipate out — reads as a real smoke cloud, not a subtle tint
    const veil = t < 0.18 ? t / 0.18 : Math.max(0, 1 - (t - 0.18) / 0.82);
    ctx.save();

    // base darkening so the plumes have something to sit on top of
    ctx.fillStyle = `rgba(4,3,3,${0.55 * veil})`;
    ctx.fillRect(0, 0, w, h);

    puffs.forEach((p) => {
      const px = p.x + p.drift * t * 8;
      const py = p.y + p.rise * t * 8;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
      grad.addColorStop(0, `rgba(150,142,134,${0.85 * veil})`);
      grad.addColorStop(0.55, `rgba(95,88,82,${0.55 * veil})`);
      grad.addColorStop(1, "rgba(60,55,52,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // drifting ash / embers
    ctx.fillStyle = `rgba(216,210,200,${0.85 * veil})`;
    for (let i = 0; i < 60; i++) {
      const ax = (i * 97 + t * 260) % w;
      const ay = (i * 53 + t * 300) % h;
      ctx.fillRect(ax, ay, 2.5, 2.5);
    }
    ctx.restore();
  }

  function drawLightFrame(t, w, h, sparks) {
    ctx.clearRect(0, 0, w, h);
    const veil = t < 0.22 ? t / 0.22 : Math.max(0, 1 - (t - 0.22) / 0.78);
    const fade = veil;
    ctx.save();

    // full white-gold flash so the whole page briefly reads as "flooded with light"
    ctx.fillStyle = `rgba(255,248,230,${0.5 * veil})`;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h * 0.42;
    const bloomR = Math.max(w, h) * (0.25 + t * 0.75);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
    grad.addColorStop(0, `rgba(255,238,196,${0.95 * fade})`);
    grad.addColorStop(0.5, `rgba(241,197,111,${0.55 * fade})`);
    grad.addColorStop(1, "rgba(241,197,111,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = `rgba(255,244,214,${0.9 * fade})`;
    sparks.forEach((s) => {
      const sx = s.x + s.vx * t * 260;
      const sy = s.y + s.vy * t * 260;
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function play(theme) {
    if (raf) cancelAnimationFrame(raf);
    const w = window.innerWidth, h = window.innerHeight;
    const puffs = theme === "dark" ? makeSmokePuffs(22, w, h) : null;
    const sparks = theme === "light" ? makeSparkles(70, w, h) : null;
    const start = performance.now();

    canvas.style.opacity = "1";

    function frame(now) {
      const t = Math.min(1, (now - start) / DURATION);
      if (theme === "dark") drawSmokeFrame(t, w, h, puffs);
      else drawLightFrame(t, w, h, sparks);

      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        canvas.style.opacity = "0";
        ctx.clearRect(0, 0, w, h);
      }
    }
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener("themechange", (e) => {
    if (!e.detail.animate) return;
    play(e.detail.theme);
  });
})();
