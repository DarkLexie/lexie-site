// Plays the 3 vertical accent videos per theme in a fixed round-robin
// sequence (1 -> 2 -> 3 -> 1 -> ...), advancing on each video's "ended" event.
// Switching theme restarts the sequence from 1 for that theme.
(function () {
  const mount = document.querySelector("[data-hero-video]");
  if (!mount) return;

  const video = mount.querySelector("video");
  const source = video.querySelector("source");

  let current = 1;

  function load(theme, n) {
    const base = `images/ui/video/bg-${theme}-${n}`;
    video.setAttribute("poster", `${base}-poster.webp`);
    source.setAttribute("src", `${base}.mp4`);
    video.load();
    video.play().catch(() => {});
  }

  function advance() {
    current = (current % 3) + 1;
    load(document.documentElement.getAttribute("data-theme") || "dark", current);
  }

  video.addEventListener("ended", advance);

  function start(theme) {
    current = 1;
    load(theme, current);
  }

  start(document.documentElement.getAttribute("data-theme") || "dark");
  document.addEventListener("themechange", (e) => start(e.detail.theme));
})();
