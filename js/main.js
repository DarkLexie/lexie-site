// Header scroll state + mobile nav toggle — runs on every page
(function () {
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav__link").forEach((link) => {
      link.addEventListener("click", () => nav.classList.remove("is-open"));
    });
  }
})();
