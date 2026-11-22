/*
  Article 3 — reveal and the price
  ---------------------------------
  Loaded only by article3.html.

  The page scrolls vertically, like any other page.
  This file never listens to the mouse wheel.
  It never calls preventDefault() on scroll or touch.

  GSAP is not used. The rest of the site is built to run
  offline, and these motions are small enough for CSS plus
  one scroll listener.

  The hero is a still gradient. The only drift left is the
  price mark, which settles as that section arrives.
*/

(function () {
  const nodes = document.querySelectorAll("[data-reveal]");
  if (!nodes.length) {
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function show(node) {
    node.classList.add("is-in");
  }

  if (reduced.matches || !("IntersectionObserver" in window)) {
    nodes.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        return;
      }
      show(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    root: null,
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.16
  });

  nodes.forEach(function (node) {
    observer.observe(node);
  });
})();

(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const price = document.querySelector("[data-price]");
  const priceField = price ? price.querySelector("[data-parallax]") : null;
  let ticking = false;

  function clearMotion() {
    if (priceField) {
      priceField.style.transform = "";
    }
    if (price) {
      price.style.setProperty("--in", "1");
    }
  }

  if (reduced.matches || !price) {
    clearMotion();
    return;
  }

  function update() {
    ticking = false;

    if (reduced.matches) {
      clearMotion();
      return;
    }

    if (price) {
      const rect = price.getBoundingClientRect();
      const view = window.innerHeight || 1;
      const start = view * 0.96;
      const end = view * 0.42;
      const raw = (start - rect.top) / (start - end);
      const amount = Math.min(1, Math.max(0, raw));
      price.style.setProperty("--in", amount.toFixed(3));

      if (priceField) {
        const drift = (1 - amount) * 28;
        priceField.style.transform = "translate3d(-50%, calc(-50% + " + drift.toFixed(1) + "px), 0)";
      }
    }
  }

  function request() {
    if (ticking) {
      return;
    }
    ticking = true;
    requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  reduced.addEventListener("change", function () {
    if (reduced.matches) {
      clearMotion();
    } else {
      request();
    }
  });
})();

(function () {
  const timeline = document.querySelector("[data-timeline]");
  if (!timeline) {
    return;
  }

  const cards = Array.prototype.slice.call(timeline.querySelectorAll(".gta-timeline__card"));
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function sync(card) {
    if (!fine.matches) {
      return;
    }
    const open = card.matches(":hover") || card.matches(":focus-visible");
    card.setAttribute("aria-expanded", open ? "true" : "false");
  }

  cards.forEach(function (card) {
    card.addEventListener("pointerenter", function () {
      sync(card);
    });
    card.addEventListener("pointerleave", function () {
      sync(card);
    });
    card.addEventListener("focus", function () {
      sync(card);
    });
    card.addEventListener("blur", function () {
      sync(card);
    });
    card.addEventListener("click", function () {
      if (fine.matches) {
        return;
      }
      const open = !card.classList.contains("is-open");
      card.classList.toggle("is-open", open);
      card.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  fine.addEventListener("change", function () {
    if (!fine.matches) {
      return;
    }
    cards.forEach(function (card) {
      card.classList.remove("is-open");
      card.setAttribute("aria-expanded", "false");
    });
  });

  const first = cards[0];
  if (!first || reduced.matches || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        return;
      }
      first.classList.add("is-hint");
      window.setTimeout(function () {
        first.classList.remove("is-hint");
      }, 1400);
      observer.disconnect();
    });
  }, {
    threshold: 0.45
  });

  observer.observe(timeline);
})();

(function () {
  const photos = document.querySelectorAll(".gta-frame img");

  photos.forEach(function (img) {
    function ready() {
      img.classList.add("is-ready");
    }

    function drop() {
      img.classList.remove("is-ready");
      img.classList.add("is-broken");
    }

    if (img.complete && img.naturalWidth > 0) {
      ready();
    } else if (img.complete) {
      drop();
    } else {
      img.addEventListener("load", ready);
      img.addEventListener("error", drop);
    }
  });
})();

(function () {
  const ending = document.querySelector("[data-ending]");
  if (!ending) {
    return;
  }

  const buttons = ending.querySelectorAll("[data-answer]");
  const replies = ending.querySelectorAll("[data-reply]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function show(choice) {
    buttons.forEach(function (button) {
      const chosen = button.getAttribute("data-answer") === choice;
      button.classList.toggle("is-chosen", chosen);
      button.setAttribute("aria-pressed", chosen ? "true" : "false");
    });

    replies.forEach(function (reply) {
      reply.classList.remove("is-in");
      reply.setAttribute("aria-hidden", "true");
    });

    const next = ending.querySelector('[data-reply="' + choice + '"]');
    if (!next) {
      return;
    }

    next.setAttribute("aria-hidden", "false");

    if (reduced.matches) {
      next.classList.add("is-in");
      return;
    }

    window.requestAnimationFrame(function () {
      next.classList.add("is-in");
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      show(button.getAttribute("data-answer"));
    });
  });
})();
