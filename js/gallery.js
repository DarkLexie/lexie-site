// Loads data/works.json, renders theme-aware filter chips + gallery grid,
// and drives the lightbox (prev/next/Esc/click-outside, image + video works).
(function () {
  const galleryEl = document.querySelector("[data-gallery]");
  const filtersEl = document.querySelector("[data-filters]");
  if (!galleryEl && !filtersEl) return;

  const CATEGORIES = {
    light: ["All Works", "Vintage", "Characters", "Creatures", "Reels", "Black and White"],
    dark: ["All Works", "Horror", "Gothic", "Surreal", "Post-Apocalyptic", "Cinematic Realism", "Moody", "Black and White", "Reels"],
  };

  let allWorks = [];
  let activeFilter = "All Works";
  let currentList = [];
  let lightboxIndex = -1;

  const dataUrl = galleryEl?.getAttribute("data-src") || filtersEl?.getAttribute("data-src") || "data/works.json";

  function theme() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  }

  function worksForTheme() {
    return allWorks.filter((w) => w.universe === theme());
  }

  function filteredWorks() {
    const list = worksForTheme();
    if (activeFilter === "All Works") return list;
    return list.filter((w) => (w.tags || []).includes(activeFilter));
  }

  function renderFilters() {
    if (!filtersEl) return;
    const cats = CATEGORIES[theme()] || CATEGORIES.dark;
    if (!cats.includes(activeFilter)) activeFilter = "All Works";
    filtersEl.innerHTML = cats
      .map(
        (c) =>
          `<button class="chip${c === activeFilter ? " is-active" : ""}" data-filter="${c}">${c}</button>`
      )
      .join("");
    filtersEl.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.getAttribute("data-filter");
        renderFilters();
        renderGrid();
      });
    });
  }

  function cardMarkup(work, index) {
    const isVideo = work.type === "video";
    const thumb = isVideo ? work.poster : `images/preview/${work.universe}/${work.slug}.webp`;
    const playIcon = isVideo
      ? `<span class="gallery-card__play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>`
      : "";
    return `
      <figure class="gallery-card" data-index="${index}" tabindex="0" role="button" aria-label="Open ${work.title}">
        <img src="${thumb}" alt="${work.title}" loading="lazy" width="${work.w}" height="${work.h}">
        ${playIcon}
        <figcaption class="gallery-card__caption">${work.title}</figcaption>
      </figure>`;
  }

  function renderGrid() {
    if (!galleryEl) return;
    currentList = filteredWorks();
    if (currentList.length === 0) {
      galleryEl.innerHTML = `<p class="gallery-empty">No works here yet.</p>`;
      return;
    }
    galleryEl.innerHTML = currentList.map(cardMarkup).join("");
    galleryEl.querySelectorAll(".gallery-card").forEach((card) => {
      card.addEventListener("click", () => openLightbox(Number(card.getAttribute("data-index"))));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(Number(card.getAttribute("data-index")));
        }
      });
    });
    observeShine();
  }

  // On touch devices there's no hover, so play the Light-theme shine sweep
  // once as each card enters the viewport instead.
  let shineObserver = null;
  function observeShine() {
    if (!window.matchMedia("(hover: none)").matches) return;
    if (shineObserver) shineObserver.disconnect();
    shineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("shine-play");
            shineObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    galleryEl.querySelectorAll(".gallery-card").forEach((card) => shineObserver.observe(card));
  }

  // ---------- Lightbox ----------
  const lb = document.querySelector(".lightbox");
  const lbStage = lb?.querySelector(".lightbox__stage");
  const lbMeta = lb?.querySelector(".lightbox__meta");

  function renderLightbox() {
    if (!lb) return;
    const work = currentList[lightboxIndex];
    if (!work) return;
    const isVideo = work.type === "video";
    const media = isVideo
      ? `<video src="${work.src}" controls autoplay playsinline></video>`
      : `<img src="images/full/${work.universe}/${work.slug}.webp" alt="${work.title}">`;
    lbStage.querySelector(".lightbox__media")?.remove();
    const wrapper = document.createElement("div");
    wrapper.className = "lightbox__media";
    wrapper.innerHTML = media;
    lbStage.prepend(wrapper);
    lbMeta.innerHTML = `<div class="title">${work.title}</div><div class="category">${(work.tags || []).join(" · ")}</div>`;
  }

  function openLightbox(index) {
    if (!lb) return;
    lightboxIndex = index;
    renderLightbox();
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    document.body.style.overflow = "";
    lbStage.querySelector("video")?.pause();
  }

  function step(delta) {
    if (currentList.length === 0) return;
    lightboxIndex = (lightboxIndex + delta + currentList.length) % currentList.length;
    renderLightbox();
  }

  if (lb) {
    lb.querySelector(".lightbox__close")?.addEventListener("click", closeLightbox);
    lb.querySelector(".lightbox__prev")?.addEventListener("click", () => step(-1));
    lb.querySelector(".lightbox__next")?.addEventListener("click", () => step(1));
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  // ---------- Boot ----------
  fetch(dataUrl)
    .then((r) => r.json())
    .then((data) => {
      allWorks = data;
      renderFilters();
      renderGrid();
    })
    .catch((err) => {
      console.error("Failed to load works.json", err);
      if (galleryEl) galleryEl.innerHTML = `<p class="gallery-empty">Could not load the gallery.</p>`;
    });

  document.addEventListener("themechange", () => {
    activeFilter = "All Works";
    renderFilters();
    renderGrid();
  });
})();
