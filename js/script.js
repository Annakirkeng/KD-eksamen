/*
  Shared site behavior
  ---------------------
  Loaded on every page.

  Opens and closes the small-screen menu, and swaps the header
  between the full masthead and the compact bar.

  It reads scroll position. It does not control the story scenes.

  The breakpoint below must match the 880px rule in css/style.css.
*/

(function () {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const mobileQuery = window.matchMedia("(max-width: 880px)");

  if (!header || !toggle || !nav) {
    return;
  }

  function closeMenu() {
    nav.classList.remove("is-open");
    header.classList.remove("is-menu-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    nav.classList.add("is-open");
    header.classList.add("is-menu-open");
    toggle.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", function () {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  /* If the window grows back to desktop width, don't leave the menu open. */
  mobileQuery.addEventListener("change", function (event) {
    if (!event.matches) {
      closeMenu();
    }
  });

  /*
    Full masthead until the reader has moved past 120px.
    The full header returns only at the top of the page.
  */
  const fullLogo = header.querySelector(".logo--full");
  const markLogo = header.querySelector(".logo--mark");
  const compactOn = 120;

  function syncLogos() {
    const compact = header.classList.contains("is-compact");
    if (fullLogo) {
      fullLogo.tabIndex = compact ? -1 : 0;
      fullLogo.setAttribute("aria-hidden", compact ? "true" : "false");
    }
    if (markLogo) {
      markLogo.tabIndex = compact ? 0 : -1;
      markLogo.setAttribute("aria-hidden", compact ? "false" : "true");
    }
  }

  function updateCompact() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const compact = header.classList.contains("is-compact");
    if (!compact && y > compactOn) {
      header.classList.add("is-compact");
    } else if (compact && y <= 1) {
      header.classList.remove("is-compact");
    }
    syncLogos();
  }

  let compactTick = false;

  function requestCompact() {
    if (compactTick) {
      return;
    }
    compactTick = true;
    requestAnimationFrame(function () {
      updateCompact();
      compactTick = false;
    });
  }

  updateCompact();
  window.addEventListener("scroll", requestCompact, { passive: true });
  window.addEventListener("pageshow", updateCompact);
})();
