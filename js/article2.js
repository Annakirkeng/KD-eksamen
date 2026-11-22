/*
  Article 2 — carousel and scroll fade
  -------------------------------------
  Loaded only by article2.html.

  The page scrolls vertically, like any other page.
  This file never listens to the mouse wheel.
  It never calls preventDefault() on touch.
  Arrow keys are handled only while focus is inside the carousel.

  The trend row is a native sideways scroller, so a swipe
  moves the cards and a vertical gesture still moves the page.
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
    threshold: 0.12
  });

  nodes.forEach(function (node) {
    observer.observe(node);
  });
})();

(function () {
  const root = document.querySelector("[data-carousel]");
  if (!root) {
    return;
  }

  const track = root.querySelector("[data-carousel-track]");
  const prevBtn = root.querySelector("[data-carousel-prev]");
  const nextBtn = root.querySelector("[data-carousel-next]");
  const status = root.querySelector("[data-carousel-status]");
  const live = root.querySelector("[data-carousel-live]");

  if (!track || !prevBtn || !nextBtn) {
    return;
  }

  const slides = Array.prototype.slice.call(track.children);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let shouldAnnounce = false;
  let announceTimer = 0;
  let frame = 0;

  function scrollBehavior() {
    return reduced.matches ? "auto" : "smooth";
  }

  function stride() {
    if (slides.length < 2) {
      return slides[0] ? slides[0].getBoundingClientRect().width : 0;
    }
    return slides[1].offsetLeft - slides[0].offsetLeft;
  }

  function atStart() {
    return track.scrollLeft <= 2;
  }

  function atEnd() {
    return track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function currentIndex() {
    const distance = stride();
    if (!distance || !slides.length) {
      return 0;
    }
    if (atStart()) {
      return 0;
    }
    if (atEnd()) {
      return slides.length - 1;
    }
    let index = Math.round(track.scrollLeft / distance);
    return Math.max(0, Math.min(slides.length - 1, index));
  }

  function update() {
    const index = currentIndex();
    prevBtn.disabled = atStart();
    nextBtn.disabled = atEnd();

    if (status) {
      status.textContent = pad(index + 1) + " / " + pad(slides.length);
    }

    slides.forEach(function (slide, slideIndex) {
      if (slideIndex === index) {
        slide.setAttribute("aria-current", "true");
      } else {
        slide.removeAttribute("aria-current");
      }
    });
  }

  function announce() {
    if (!shouldAnnounce || !live) {
      return;
    }
    const index = currentIndex();
    const heading = slides[index] ? slides[index].querySelector("h3") : null;
    const title = heading ? heading.textContent : "";
    live.textContent = "Trend " + (index + 1) + " av " + slides.length + (title ? ", " + title : "");
    shouldAnnounce = false;
  }

  function requestUpdate() {
    if (frame) {
      return;
    }
    frame = window.requestAnimationFrame(function () {
      update();
      frame = 0;
    });
  }

  function scheduleAnnounce() {
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(announce, 160);
  }

  function step(direction) {
    const distance = stride();
    if (!distance) {
      return;
    }
    if (direction > 0 && atEnd()) {
      return;
    }
    if (direction < 0 && atStart()) {
      return;
    }
    shouldAnnounce = true;
    track.scrollBy({
      left: direction * distance,
      behavior: scrollBehavior()
    });
  }

  function goToEdge(toEnd) {
    shouldAnnounce = true;
    track.scrollTo({
      left: toEnd ? track.scrollWidth : 0,
      behavior: scrollBehavior()
    });
  }

  prevBtn.addEventListener("click", function () {
    step(-1);
  });

  nextBtn.addEventListener("click", function () {
    step(1);
  });

  root.addEventListener("keydown", function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToEdge(false);
    } else if (event.key === "End") {
      event.preventDefault();
      goToEdge(true);
    }
  });

  track.addEventListener("scroll", function () {
    requestUpdate();
    scheduleAnnounce();
  }, { passive: true });

  window.addEventListener("resize", function () {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    if (track.scrollLeft > max) {
      track.scrollLeft = max;
    }
    requestUpdate();
  });
  update();
})();
