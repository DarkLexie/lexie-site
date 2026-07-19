// Picks a random vertical accent video for the current theme (3 per side),
// re-picks whenever the theme changes.
(function () {
  const mount = document.querySelector("[data-hero-video]");
  if (!mount) return;

  const video = mount.querySelector("video");
  const source = video.querySelector("source");

  function pick(theme) {
    const n = 1 + Math.floor(Math.random() * 3);
    const base = `images/ui/video/bg-${theme}-${n}`;
    video.setAttribute("poster", `${base}-poster.webp`);
    source.setAttribute("src", `${base}.mp4`);
    video.load();
    video.play().catch(() => {});
  }

  pick(document.documentElement.getAttribute("data-theme") || "dark");
  document.addEventListener("themechange", (e) => pick(e.detail.theme));
})();
