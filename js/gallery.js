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

  // ---------- Likes ----------
  // localStorage only remembers THIS browser's liked/not-liked state (so the
  // heart shows filled correctly on return visits). The actual shared count
  // seen by everyone lives in Supabase (see docs/supabase-setup.sql) and is
  // only ever touched through the increment_like/decrement_like RPCs.
  const LIKES_KEY = "lexie-likes";
  function readLikes() {
    try { return JSON.parse(window.localStorage.getItem(LIKES_KEY)) || {}; }
    catch { return {}; }
  }
  function writeLikes(likes) {
    window.localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  }
  let likes = readLikes();
  let likeCounts = {};
  const supabase = window.LexieSupabase;

  function loadLikeCounts() {
    if (!supabase) return Promise.resolve();
    return supabase
      .rpc("get_like_counts")
      .then(({ data, error }) => {
        if (error) { console.error("get_like_counts failed", error); return; }
        likeCounts = {};
        (data || []).forEach((row) => { likeCounts[row.slug] = row.like_count; });
      });
  }

  function updateLikeCountUI(slug, count) {
    document.querySelectorAll(`[data-like="${slug}"] .gallery-card__like-count`).forEach((el) => {
      el.textContent = count > 0 ? count : "";
    });
  }

  function isNew(work) {
    if (!work.dateAdded) return false;
    const added = new Date(work.dateAdded + "T00:00:00");
    const diffDays = (Date.now() - added.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 2;
  }

  function cardMarkup(work, index) {
    const isVideo = work.type === "video";
    const thumb = isVideo ? work.poster : `images/preview/${work.universe}/${work.slug}.webp`;
    const playIcon = isVideo
      ? `<span class="gallery-card__play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>`
      : "";
    const badge = isNew(work) ? `<span class="gallery-card__badge">New</span>` : "";
    const liked = !!likes[work.slug];
    const count = likeCounts[work.slug] || 0;
    return `
      <figure class="gallery-card" data-index="${index}" tabindex="0" role="button" aria-label="Open ${work.title}">
        <img src="${thumb}" alt="${work.title}" loading="lazy" width="${work.w}" height="${work.h}">
        ${playIcon}
        ${badge}
        <button class="gallery-card__like${liked ? " is-liked" : ""}" data-like="${work.slug}" aria-label="Like ${work.title}" aria-pressed="${liked}">
          <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.53L12 21.35z"/></svg>
          <span class="gallery-card__like-count">${count > 0 ? count : ""}</span>
        </button>
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
    galleryEl.querySelectorAll("[data-like]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const slug = btn.getAttribute("data-like");
        const nowLiked = !likes[slug];
        likes[slug] = nowLiked;
        if (!nowLiked) delete likes[slug];
        writeLikes(likes);
        btn.classList.toggle("is-liked", nowLiked);
        btn.setAttribute("aria-pressed", nowLiked);

        // Optimistic local bump while the RPC round-trips.
        likeCounts[slug] = Math.max(0, (likeCounts[slug] || 0) + (nowLiked ? 1 : -1));
        updateLikeCountUI(slug, likeCounts[slug]);

        if (!supabase) return;
        const rpc = nowLiked ? "increment_like" : "decrement_like";
        supabase.rpc(rpc, { work_slug: slug }).then(({ data, error }) => {
          if (error) { console.error(rpc + " failed", error); return; }
          if (typeof data === "number") {
            likeCounts[slug] = data;
            updateLikeCountUI(slug, data);
          }
        });
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
      ? `<video src="${work.src}" controls autoplay playsinline controlsList="nodownload noremoteplayback" disablePictureInPicture oncontextmenu="return false"></video>`
      : `<img src="images/full/${work.universe}/${work.slug}.webp" alt="${work.title}">`;
    lbStage.querySelector(".lightbox__media")?.remove();
    const wrapper = document.createElement("div");
    wrapper.className = "lightbox__media";
    wrapper.innerHTML = media;
    lbStage.prepend(wrapper);
    lbMeta.classList.toggle("is-hidden", isVideo);
    lbMeta.innerHTML = isVideo ? "" : `<div class="title">${work.title}</div><div class="category">${(work.tags || []).join(" · ")}</div>`;
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
  Promise.all([
    fetch(dataUrl).then((r) => r.json()),
    loadLikeCounts(),
  ])
    .then(([data]) => {
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
