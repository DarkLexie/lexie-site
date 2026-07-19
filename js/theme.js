// Theme state: light/dark, persisted in localStorage, URL ?side= wins on load.
// Dispatches a "themechange" CustomEvent on document whenever the theme changes.
(function () {
  const STORAGE_KEY = "lexie-theme";
  const root = document.documentElement;

  function readInitialTheme() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("side");
    if (fromUrl === "light" || fromUrl === "dark") return fromUrl;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;

    return "dark"; // site default
  }

  function applyTheme(theme, opts) {
    const options = opts || {};
    const previous = root.getAttribute("data-theme");
    if (previous === theme && !options.force) return;

    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);

    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      const isActive = btn.getAttribute("data-theme-btn") === theme;
      btn.classList.toggle("is-active", isActive);
    });

    document.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme, previous, animate: options.animate !== false } })
    );
  }

  function initToggle() {
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-theme-btn");
        if (target === root.getAttribute("data-theme")) return;
        applyTheme(target, { animate: true });
      });
    });
  }

  const initial = readInitialTheme();
  applyTheme(initial, { force: true, animate: false });
  document.addEventListener("DOMContentLoaded", initToggle);

  window.LexieTheme = {
    get: () => root.getAttribute("data-theme"),
    set: (theme) => applyTheme(theme, { animate: true }),
  };
})();
