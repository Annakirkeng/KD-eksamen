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
    Full masthead until the reader has moved past 150px.
    The full header returns only at the top of the page.
    compactOn is only the scroll distance that collapses the header.
    It does not size the story type.
  */
  const fullLogo = header.querySelector(".logo--full");
  const markLogo = header.querySelector(".logo--mark");
  const compactOn = 150;

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

/*
  Image fallback
  --------------
  If a photograph fails, keep the frame and show a short note
  inside it. Alt text stays on the image for screen readers.
  The small header mark and the cover mark already have a fixed
  box, so they do not get a sentence on top of the letters.
*/
(function () {
  const MESSAGE = "Bildet kunne ikke lastes";
  const hosts = ".logo, .photo-slot, .frame, .compare, .fashion-hero__stage, .station-map__stage, .gta-hero__photo";

  function markBroken(img) {
    if (!img || img.dataset.broken === "true" || !img.getAttribute("src")) {
      return;
    }

    img.dataset.broken = "true";
    img.classList.remove("is-ready");
    img.classList.add("is-broken");

    if (img.closest(".logo--mark, .cover__mark, .station-popup")) {
      return;
    }

    let host = img.closest(hosts);

    if (!host) {
      host = document.createElement("div");
      host.className = "img-fallback-host";
      img.parentNode.insertBefore(host, img);
      host.appendChild(img);
    }

    if (host.querySelector(":scope > .img-fallback")) {
      return;
    }

    const note = document.createElement("p");
    note.className = "img-fallback";
    if (host.classList.contains("logo")) {
      note.classList.add("img-fallback--logo");
    }
    note.textContent = MESSAGE;
    note.setAttribute("aria-hidden", "true");
    host.appendChild(note);
    host.classList.add("has-img-fallback");
  }

  function watch(img) {
    if (img.dataset.fallbackWatch === "true") {
      return;
    }
    img.dataset.fallbackWatch = "true";
    img.addEventListener("error", function () {
      markBroken(img);
    });
    if (img.complete && img.getAttribute("src") && img.naturalWidth === 0) {
      markBroken(img);
    }
  }

  document.querySelectorAll("img").forEach(watch);

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) {
          return;
        }
        if (node.tagName === "IMG") {
          watch(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll("img").forEach(watch);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
