// Ambient background particles: falling ash (dark) / drifting fireflies (light).
// Tech spec §10. Pauses when tab hidden, disabled under prefers-reduced-motion.
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.querySelector(".ambient-canvas");
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d");

  const isMobile = () => window.innerWidth < 768;
  let particles = [];
  let theme = document.documentElement.getAttribute("data-theme") || "dark";
  let raf = null;
  let running = true;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    seed();
  }

  let embers = [];

  function seed() {
    const w = window.innerWidth, h = window.innerHeight;
    if (theme === "dark") {
      const count = isMobile() ? 8 : 16;
      particles = Array.from({ length: count }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(isMobile() ? 120 : 220, isMobile() ? 260 : 480),
        driftX: rand(-6, 6) / 60,
        driftY: rand(-3, -0.5) / 60,
        opacity: rand(0.035, 0.09),
      }));
      const emberCount = isMobile() ? 16 : 34;
      embers = Array.from({ length: emberCount }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        size: rand(0.6, 1.8),
        speed: rand(6, 20) / 60,
        drift: rand(-6, 6) / 60,
        opacity: rand(0.1, 0.4),
      }));
    } else {
      const count = isMobile() ? 22 : 55;
      particles = Array.from({ length: count }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        size: rand(1.5, 3.5),
        angle: rand(0, Math.PI * 2),
        speed: rand(4, 12) / 60,
        glow: rand(6, 18),
        opacity: rand(0.15, 0.75),
        flicker: rand(0.01, 0.03),
        phase: rand(0, Math.PI * 2),
      }));
    }
  }

  function drawAsh(w, h) {
    ctx.clearRect(0, 0, w, h);

    // slow, soft smoke wisps — large low-opacity blobs, not falling dots
    particles.forEach((p) => {
      p.x += p.driftX;
      p.y += p.driftY;
      if (p.x < -p.r) p.x = w + p.r;
      if (p.x > w + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = h + p.r;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(120, 114, 110, ${p.opacity})`);
      grad.addColorStop(0.6, `rgba(90, 85, 82, ${p.opacity * 0.6})`);
      grad.addColorStop(1, "rgba(60, 56, 54, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // a few small embers drifting through the smoke for depth
    ctx.fillStyle = "rgba(200, 150, 120, 1)";
    embers.forEach((p) => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -4) { p.y = h + 4; p.x = rand(0, w); }
      if (p.x > w + 4) p.x = -4;
      if (p.x < -4) p.x = w + 4;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawFireflies(w, h) {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.phase += p.flicker;
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed - 0.05;
      if (p.y < -10) p.y = h + 10;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const flicker = (Math.sin(p.phase) + 1) / 2;
      const alpha = p.opacity * (0.4 + 0.6 * flicker);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glow);
      grad.addColorStop(0, `rgba(255, 224, 150, ${alpha})`);
      grad.addColorStop(1, "rgba(255, 224, 150, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.glow, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Slow tint wash cycling through the background every ~2.5s —
  // darkening pulses on Dark, warm gold pulses on Light.
  const CYCLE_MS = 2500;
  function drawCycleTint(w, h, now) {
    const phase = (now % CYCLE_MS) / CYCLE_MS;
    const wave = (Math.sin(phase * Math.PI * 2) + 1) / 2; // 0..1
    if (theme === "dark") {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.06 + wave * 0.16})`;
    } else {
      ctx.fillStyle = `rgba(241, 197, 111, ${0.03 + wave * 0.09})`;
    }
    ctx.fillRect(0, 0, w, h);
  }

  function loop(now) {
    if (!running) return;
    const w = window.innerWidth, h = window.innerHeight;
    if (theme === "dark") drawAsh(w, h); else drawFireflies(w, h);
    drawCycleTint(w, h, now || 0);
    raf = requestAnimationFrame(loop);
  }

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) loop(); else if (raf) cancelAnimationFrame(raf);
  });

  document.addEventListener("themechange", (e) => {
    theme = e.detail.theme;
    seed();
  });

  window.addEventListener("resize", resize);
  resize();
  loop();
})();
