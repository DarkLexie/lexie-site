// First-load (and every page navigation, since this is a multi-page site)
// intro: dark screen, smoke swirling behind a glowing "ART by LEXIE" title,
// then the smoke dissipates to reveal the page underneath.
(function () {
  const el = document.querySelector(".preloader");
  if (!el) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    el.remove();
    return;
  }

  const canvas = el.querySelector(".preloader-canvas");
  const ctx = canvas.getContext("2d");

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

  const w = window.innerWidth, h = window.innerHeight;
  const puffs = Array.from({ length: 26 }, () => ({
    x: rand(0, w),
    y: rand(0, h),
    r: rand(w * 0.14, w * 0.34),
    drift: rand(-14, 14),
    rise: rand(-22, -6),
  }));

  const HOLD = 1350;   // smoke + title fully visible
  const DISSOLVE = 950; // smoke clears to reveal the page
  const TOTAL = HOLD + DISSOLVE;
  const start = performance.now();
  let raf = null;

  function frame(now) {
    const elapsed = now - start;
    const t = elapsed / TOTAL;
    const dissolveT = Math.max(0, (elapsed - HOLD) / DISSOLVE);
    const veil = 1 - dissolveT;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(2, 1, 2, 1)";
    ctx.fillRect(0, 0, w, h);

    // Black smoke with only a faint burgundy undertone — never reads as grey/white.
    puffs.forEach((p) => {
      const px = p.x + p.drift * (elapsed / 1000);
      const py = p.y + p.rise * (elapsed / 1000);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
      grad.addColorStop(0, `rgba(28, 10, 12, ${0.75 * veil})`);
      grad.addColorStop(0.55, `rgba(14, 5, 6, ${0.55 * veil})`);
      grad.addColorStop(1, "rgba(4, 2, 2, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (dissolveT > 0 && !el.classList.contains("is-dissolving")) {
      el.classList.add("is-dissolving");
    }

    if (t < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      el.remove();
    }
  }
  raf = requestAnimationFrame(frame);

  // Hard fallback: guarantees the intro never blocks the page even if rAF
  // is throttled/suspended (e.g. loaded in a background tab).
  setTimeout(() => {
    if (el.isConnected) el.remove();
  }, TOTAL + 400);
})();
