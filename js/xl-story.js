/*
  XL story scroll behavior
  ------------------------
  Loaded only by xl-story.html.

  Three scenes are tied to vertical scroll position:
  1. Hook — the quote is revealed line by line, then the screen goes black
  2. Before / after — the old photograph wipes into the new one
  3. Short journey — three photographs crossfade in order

  The other sections use IntersectionObserver. Each text block fades in
  once, when it enters the screen, and then stays still.

  This file never listens to the mouse wheel.
  It never calls preventDefault().
  The page scrolls normally. We only read where it has scrolled to.

  If the visitor has asked for reduced motion, the scrubbed scenes are
  turned off in css/xl-story.css and the updates below are skipped.
*/

(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const header = document.querySelector(".site-header");
  const hook = document.querySelector('[data-scene="hook"]');
  const compare = document.querySelector('[data-scene="compare"]');
  const journey = document.querySelector('[data-scene="journey"]');
  const hookLines = hook ? hook.querySelectorAll(".hook__line") : [];
  const hookBlackout = hook ? hook.querySelector(".hook__blackout") : null;
  const journeyFrames = journey ? journey.querySelectorAll(".journey__frame") : [];

  /*
    Læring begge veier. One panel is open at a time.
    Without JavaScript both texts stay in the page.
  */
  function initLearnTabs() {
    const root = document.querySelector("[data-learn-tabs]");
    if (!root) {
      return;
    }

    const tabs = Array.prototype.slice.call(root.querySelectorAll("[role='tab']"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function panelFor(tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    }

    function activate(tab) {
      tabs.forEach(function (item) {
        const selected = item === tab;
        const panel = panelFor(item);
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.tabIndex = selected ? 0 : -1;
        if (!panel) {
          return;
        }
        panel.classList.toggle("is-active", selected);
        panel.setAttribute("aria-hidden", selected ? "false" : "true");
        panel.inert = !selected;
      });
    }

    function select(tab) {
      const current = tabs.filter(function (item) {
        return item.getAttribute("aria-selected") === "true";
      })[0];
      if (!current || current === tab) {
        activate(tab || current);
        return;
      }

      const currentPanel = panelFor(current);
      if (motion.matches || !currentPanel) {
        activate(tab);
        return;
      }

      currentPanel.classList.add("is-leaving");
      window.setTimeout(function () {
        currentPanel.classList.remove("is-leaving");
        activate(tab);
      }, 180);
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab);
      });

      tab.addEventListener("keydown", function (event) {
        let nextIndex = null;
        if (event.key === "ArrowRight") {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        }
        if (nextIndex === null) {
          return;
        }
        event.preventDefault();
        select(tabs[nextIndex]);
        tabs[nextIndex].focus();
      });
    });

    const initial = tabs.filter(function (tab) {
      return tab.getAttribute("aria-selected") === "true";
    })[0] || tabs[0];
    activate(initial);
  }

  /*
    How far the reader has moved through a tall section.
    0 = the section has just reached the top of the screen.
    1 = the section is about to leave the screen.
  */
  function getScrollProgress(section) {
    const rect = section.getBoundingClientRect();
    const distance = section.offsetHeight - window.innerHeight;
    if (distance <= 0) {
      return 0;
    }
    const progress = -rect.top / distance;
    return Math.min(1, Math.max(0, progress));
  }

  /* 0 before `start`, 1 after `end`, and a fraction while moving between them. */
  function segment(progress, start, end) {
    if (progress <= start) {
      return 0;
    }
    if (progress >= end) {
      return 1;
    }
    return (progress - start) / (end - start);
  }

  /*
    Fade in, hold, then fade out.
    Leave outStart empty on the last journey photo so it stays visible.
  */
  function hold(progress, inStart, inEnd, outStart, outEnd) {
    if (progress < inStart) {
      return 0;
    }
    if (inEnd > inStart && progress < inEnd) {
      return (progress - inStart) / (inEnd - inStart);
    }
    if (outStart === undefined || progress < outStart) {
      return 1;
    }
    if (progress >= outEnd) {
      return 0;
    }
    return 1 - (progress - outStart) / (outEnd - outStart);
  }

  /*
    Line timing. The first line is already visible so the page does not
    open on an empty black screen. Later lines share the scroll up to 0.68.
    The fade to black starts later, at 0.78, which leaves a pause to read.
    Add or remove a .hook__line in the HTML and the spacing follows.
  */
  function updateHook() {
    if (!hook) {
      return;
    }

    const progress = getScrollProgress(hook);
    const laterLines = Math.max(hookLines.length - 1, 1);

    hookLines.forEach(function (line, index) {
      let shown = 1;
      if (index > 0) {
        const slot = 0.6 / laterLines;
        const start = index * slot;
        shown = segment(progress, start, start + slot * 0.42);
      }
      line.style.setProperty("--shown", shown.toFixed(3));
    });

    if (hookBlackout) {
      const black = segment(progress, 0.78, 0.95);
      hookBlackout.style.setProperty("--shown", black.toFixed(3));
    }
  }

  /* 0 = old photograph. 1 = new photograph. See .compare__new in the CSS. */
  function updateCompare() {
    if (!compare) {
      return;
    }
    const progress = getScrollProgress(compare);
    compare.style.setProperty("--p", progress.toFixed(4));
  }

  /*
    Edit these numbers to change when each photograph appears.
    Values are scroll progress from 0 to 1 through the journey section.
  */
  const journeyBeats = [
    { inStart: 0, inEnd: 0, outStart: 0.26, outEnd: 0.4 },
    { inStart: 0.26, inEnd: 0.4, outStart: 0.56, outEnd: 0.7 },
    { inStart: 0.56, inEnd: 0.7 }
  ];

  function updateJourney() {
    if (!journey) {
      return;
    }

    const progress = getScrollProgress(journey);

    journeyFrames.forEach(function (frame, index) {
      const beat = journeyBeats[index];
      if (!beat) {
        return;
      }
      const shown = hold(progress, beat.inStart, beat.inEnd, beat.outStart, beat.outEnd);
      frame.style.setProperty("--shown", shown.toFixed(3));
      /* Hide inactive photos from screen readers during the crossfade. */
      frame.setAttribute("aria-hidden", shown < 0.45 ? "true" : "false");
    });
  }

  /* A few pixels of movement on the historical photo and the photo of today. */
  function updateParallax() {
    const frames = document.querySelectorAll("[data-parallax]");

    frames.forEach(function (frame) {
      const rect = frame.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      if (rect.bottom < 0 || rect.top > viewH) {
        return;
      }
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const shift = (progress - 0.5) * 20;
      frame.style.setProperty("--shift", shift.toFixed(2) + "px");
    });
  }

  /*
    The header text is light over the dark scenes and dark over the paper ones.
    data-header="dark" or data-header="light" is set on each section in the HTML.
  */
  function updateHeader() {
    if (!header) {
      return;
    }

    const probe = header.offsetHeight * 0.45;
    const scenes = document.querySelectorAll("[data-header]");
    let mode = "light";

    scenes.forEach(function (scene) {
      const rect = scene.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) {
        mode = scene.getAttribute("data-header");
      }
    });

    header.classList.toggle("is-on-dark", mode === "dark");
  }

  function updateScrollScenes() {
    if (reducedMotion.matches) {
      return;
    }
    updateHook();
    updateCompare();
    updateJourney();
    updateParallax();
  }

  function update() {
    updateHeader();
    updateScrollScenes();
  }

  /* Fade story text in when it enters the viewport. Do not fade it back out. */
  let revealObserver = null;
  let revealQueue = [];
  let revealQueued = false;

  function holdsPicture(node) {
    return node.matches("figure, .spread, figcaption, .caption") || !!node.querySelector("img");
  }

  function flushReveals() {
    revealQueued = false;
    const batch = revealQueue.splice(0, revealQueue.length);
    batch.forEach(function (node, index) {
      const delay = Math.min(index, 3) * 80;
      if (delay) {
        node.style.transitionDelay = delay + "ms";
      }
      node.classList.add("is-visible");
    });
  }

  function queueReveal(node) {
    revealQueue.push(node);
    if (!revealQueued) {
      revealQueued = true;
      requestAnimationFrame(flushReveals);
    }
  }

  function initReveals() {
    const nodes = document.querySelectorAll(".reveal, .story-step");
    if (!nodes.length) {
      return;
    }

    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          revealObserver.unobserve(entry.target);
          queueReveal(entry.target);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -18% 0px"
      }
    );

    nodes.forEach(function (node) {
      if (holdsPicture(node)) {
        node.classList.add("is-visible");
        return;
      }
      revealObserver.observe(node);
    });
  }

  let ticking = false;

  function requestUpdate() {
    if (ticking) {
      return;
    }
    ticking = true;
    requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  initLearnTabs();
  initReveals();
  update();
  document.documentElement.classList.add("reveals-ready");

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  reducedMotion.addEventListener("change", function () {
    initReveals();
    update();
  });
})();
