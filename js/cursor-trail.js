// Desktop-only cursor trail: smoke wisps follow the pointer on Dark,
// golden magic-wand sparkles follow it on Light.
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduceMotion || !isDesktop) return;

  const canvas = document.createElement("canvas");
  canvas.className = "cursor-trail-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
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
  function theme() { return document.documentElement.getAttribute("data-theme") || "dark"; }

  let particles = [];
  let mouseX = -1000, mouseY = -1000;
  let lastSpawn = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    const now = performance.now();
    if (now - lastSpawn < 16) return;
    lastSpawn = now;

    if (theme() === "dark") {
      particles.push({
        x: mouseX + rand(-4, 4),
        y: mouseY + rand(-4, 4),
        r: rand(14, 30),
        vx: rand(-0.3, 0.3),
        vy: rand(-0.6, -0.2),
        life: 1,
        decay: rand(0.012, 0.02),
      });
    } else {
      const count = rand(0, 1) > 0.4 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: mouseX + rand(-6, 6),
          y: mouseY + rand(-6, 6),
          r: rand(1.2, 3),
          vx: rand(-0.6, 0.6),
          vy: rand(-0.9, -0.2),
          life: 1,
          decay: rand(0.02, 0.035),
          twinkle: rand(0, Math.PI * 2),
        });
      }
    }
    if (particles.length > 180) particles.splice(0, particles.length - 180);
  });

  function drawSmoke(w, h) {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.r += 0.25;
      p.life -= p.decay;
      const alpha = Math.max(0, p.life) * 0.28;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(130, 122, 118, ${alpha})`);
      grad.addColorStop(0.6, `rgba(90, 82, 80, ${alpha * 0.6})`);
      grad.addColorStop(1, "rgba(60, 55, 54, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    particles = particles.filter((p) => p.life > 0);
  }

  function drawSparkles(w, h) {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.01;
      p.life -= p.decay;
      p.twinkle += 0.25;
      const flicker = (Math.sin(p.twinkle) + 1) / 2;
      const alpha = Math.max(0, p.life) * (0.5 + 0.5 * flicker);
      const glowR = p.r * 5;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      grad.addColorStop(0, `rgba(255, 238, 196, ${alpha})`);
      grad.addColorStop(0.4, `rgba(241, 197, 111, ${alpha * 0.6})`);
      grad.addColorStop(1, "rgba(241, 197, 111, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 250, 230, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    particles = particles.filter((p) => p.life > 0);
  }

  function loop() {
    const w = window.innerWidth, h = window.innerHeight;
    if (theme() === "dark") drawSmoke(w, h); else drawSparkles(w, h);
    requestAnimationFrame(loop);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) particles = [];
  });

  document.addEventListener("themechange", () => {
    particles = [];
  });

  requestAnimationFrame(loop);
})();
