/*
  Story 1 scroll behavior
  -----------------------
  Loaded only by article1.html.

  The page scrolls vertically, like any other page.
  This file never listens to the mouse wheel.
  It never calls preventDefault().
  It only reads how far the reader has scrolled, then
  updates a few CSS variables.

  Pinned scenes: hook, chart, AfD phrases, expert quote, ending.
  On a narrow screen the chart, phrases, and quote are not pinned.
  They still fade in as they enter the screen, and fade back
  if you scroll up.

  If the visitor has asked for reduced motion, the scrubbing
  is skipped. The CSS shows every line at full size.
*/

(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 800px)");

  const header = document.querySelector(".site-header");
  const hook = document.querySelector('[data-scene="hook"]');
  const chartScene = document.querySelector('[data-scene="chart"]');
  const chart = chartScene ? chartScene.querySelector(".chart") : null;
  const policy = document.querySelector('[data-scene="policy"]');
  const timeline = document.querySelector('[data-scene="timeline"]');
  const expert = document.querySelector('[data-scene="expert"]');
  const ending = document.querySelector('[data-scene="ending"]');

  const hookLines = hook ? hook.querySelectorAll(".hook__line") : [];
  const policyWords = policy ? policy.querySelectorAll(".policy__word") : [];
  const timelineItems = timeline ? timeline.querySelectorAll("[data-step]") : [];
  const expertLines = expert ? expert.querySelectorAll("[data-line]") : [];
  const fades = document.querySelectorAll("[data-fade]");
  const portraits = document.querySelectorAll("[data-parallax]");

  /*
    0 when the section's top edge hits the top of the screen.
    1 when the section is about to leave the screen.
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

  /* 0 before `start`, 1 after `end`. */
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
    Used by the hook, where one line replaces the previous one.
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
    How far an element has come into view.
    0 while it is still low on the screen, 1 once it has settled.
    Scrolling back down reverses it.
  */
  function visibility(element, startRatio, endRatio) {
    const rect = element.getBoundingClientRect();
    const viewH = window.innerHeight || 1;
    const start = viewH * startRatio;
    const end = viewH * endRatio;
    if (rect.top >= start) {
      return 0;
    }
    if (rect.top <= end) {
      return 1;
    }
    return (start - rect.top) / (start - end);
  }

  /*
    Hook timing, as a fraction of the dark opening.
    The number is already on screen. Each later line replaces it.
    "Hvorfor?" stays until the next section scrolls up.
  */
  const hookBeats = [
    { inStart: 0, inEnd: 0, outStart: 0.2, outEnd: 0.32 },
    { inStart: 0.2, inEnd: 0.32, outStart: 0.44, outEnd: 0.56 },
    { inStart: 0.44, inEnd: 0.56, outStart: 0.68, outEnd: 0.8 },
    { inStart: 0.68, inEnd: 0.8 }
  ];

  function updateHook() {
    if (!hook) {
      return;
    }
    const progress = getScrollProgress(hook);
    hookLines.forEach(function (line, index) {
      const beat = hookBeats[index];
      if (!beat) {
        return;
      }
      const shown = hold(progress, beat.inStart, beat.inEnd, beat.outStart, beat.outEnd);
      line.style.setProperty("--shown", shown.toFixed(3));
    });
  }

  function updateChart() {
    if (!chart) {
      return;
    }
    let grow;
    if (compact.matches) {
      grow = visibility(chart, 0.95, 0.2);
    } else {
      grow = segment(getScrollProgress(chartScene), 0.06, 0.7);
    }
    chart.style.setProperty("--grow", grow.toFixed(3));
  }

  function updatePolicy() {
    if (!policy) {
      return;
    }
    if (compact.matches) {
      policyWords.forEach(function (word) {
        word.style.setProperty("--shown", visibility(word, 0.92, 0.62).toFixed(3));
      });
      return;
    }
    const progress = getScrollProgress(policy.querySelector(".policy__scroll") || policy);
    policyWords.forEach(function (word, index) {
      const start = 0.06 + index * 0.15;
      word.style.setProperty("--shown", segment(progress, start, start + 0.1).toFixed(3));
    });
  }

  function updateTimeline() {
    if (!timeline) {
      return;
    }
    const rect = timeline.getBoundingClientRect();
    const viewH = window.innerHeight || 1;
    const passed = (viewH * 0.72 - rect.top) / Math.max(rect.height, 1);
    timeline.style.setProperty("--p", Math.min(1, Math.max(0, passed)).toFixed(3));

    timelineItems.forEach(function (item) {
      item.style.setProperty("--shown", visibility(item, 0.9, 0.62).toFixed(3));
    });
  }

  function updateExpert() {
    if (!expert) {
      return;
    }
    if (compact.matches) {
      expertLines.forEach(function (line) {
        line.style.setProperty("--shown", visibility(line, 0.9, 0.58).toFixed(3));
      });
      return;
    }
    const progress = getScrollProgress(expert.querySelector(".expert__scroll") || expert);
    expertLines.forEach(function (line, index) {
      const start = 0.04 + index * 0.3;
      line.style.setProperty("--shown", segment(progress, start, start + 0.18).toFixed(3));
    });
  }

  function updateEnding() {
    if (!ending) {
      return;
    }
    const stage = ending.querySelector(".ending__scroll");
    const progress = getScrollProgress(stage || ending);
    const why = ending.querySelector(".ending__why");
    const num = ending.querySelector(".ending__num");
    const shown = segment(progress, 0.22, 0.48);
    if (why) {
      why.style.setProperty("--shown", shown.toFixed(3));
    }
    if (num) {
      num.style.setProperty("--dim", shown.toFixed(3));
    }
  }

  function updateFades() {
    fades.forEach(function (node) {
      node.style.setProperty("--shown", visibility(node, 0.94, 0.68).toFixed(3));
    });
  }

  function updateParallax() {
    portraits.forEach(function (frame) {
      const rect = frame.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      if (rect.bottom < 0 || rect.top > viewH) {
        return;
      }
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const shift = (progress - 0.5) * 18;
      frame.style.setProperty("--shift", shift.toFixed(2) + "px");
    });
  }

  /*
    Light header text over the dark scenes, dark text over the light ones.
    data-header is set on each section in the HTML.
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
    updateHook();
    updateChart();
    updatePolicy();
    updateTimeline();
    updateExpert();
    updateEnding();
    updateFades();
    updateParallax();
  }

  function update() {
    updateHeader();
    if (reducedMotion.matches) {
      return;
    }
    updateScrollScenes();
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

  update();

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  reducedMotion.addEventListener("change", requestUpdate);
  compact.addEventListener("change", requestUpdate);
})();
