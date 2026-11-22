/*
  XL story map
  ------------
  Loaded only by xl-story.html.

  The visible map is images/halden-map-dark.png.
  images/halden-map-reference.png is not shown. It was only used to read
  the pin positions below.

  Edit the three fire stations in the list below.
  - left / top: the pin tip, as a percentage of the map image
  - image: photograph in the popup. Leave "" to show the placeholder.
  - alt: description of that photograph. Leave "" when image is "".
  - name: location shown under the photograph
  - years: years the station was in operation
*/

(function () {
  const stations = [
    {
      name: "Wiels plass 4",
      years: "1911–2018",
      image: "images/IMG_7768.jpeg",
      alt: "Den gamle brannstasjonen i Halden sentrum, med slangetårn og porter ut mot plassen.",
      // Oldest station. Tip of the orange marker on the reference image.
      left: 89.3,
      top: 73.1
    },
    {
      name: "Vestgårdveien 19",
      years: "2018–2024",
      image: "images/vestgard.jpg",
      alt: "Det midlertidige lokalet på Vestgård, en lav bygning med Scania-skilt og porter langs fasaden.",
      // The photograph is mostly sky. Keep the building in the popup.
      position: "center bottom",
      // Tip of the black marker on the reference image.
      left: 4.6,
      top: 43.1
    },
    {
      name: "Svinesundsveien 65",
      years: "2024–nå",
      image: "images/IMG_7676.jpeg",
      alt: "Den nye brannstasjonen i Halden, en mørk bygning med skiltet Halden brannstasjon, porter og Sivilforsvaret.",
      // Current station. Tip of the pink marker on the reference image.
      left: 60.4,
      top: 57.1
    }
  ];

  const map = document.getElementById("station-map");
  const scroll = map ? map.querySelector(".station-map__scroll") : null;
  const stage = map ? map.querySelector(".station-map__stage") : null;
  const image = map ? map.querySelector(".station-map__image") : null;
  const hoverMedia = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (!map || !scroll || !stage || !image) {
    return;
  }

  const pin =
    '<svg class="station-marker__shape" viewBox="0 0 28 40" width="28" height="40" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M14 39.2C14 39.2 3.6 27.4 3.6 18.4a10.4 10.4 0 1 1 20.8 0C24.4 27.4 14 39.2 14 39.2z"/>' +
      '<circle cx="14" cy="18" r="3.3" fill="#fff"/>' +
    "</svg>";

  const popup = document.createElement("div");
  popup.className = "station-popup";
  popup.hidden = true;
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "false");
  popup.innerHTML =
    '<div class="station-popup__photo">' +
      '<img alt="">' +
      '<p class="station-popup__placeholder">Foto kommer</p>' +
    "</div>" +
    '<div class="station-popup__body">' +
      '<h3 class="station-popup__name"></h3>' +
      '<p class="station-popup__years"></p>' +
    "</div>";
  map.appendChild(popup);

  const popupImage = popup.querySelector("img");
  const popupName = popup.querySelector(".station-popup__name");
  const popupYears = popup.querySelector(".station-popup__years");
  const popupPlaceholder = popup.querySelector(".station-popup__placeholder");

  popupImage.addEventListener("error", function () {
    popupImage.classList.add("is-broken");
    popup.classList.add("is-placeholder");
    popupPlaceholder.textContent = "Bildet kunne ikke lastes";
    popupPlaceholder.setAttribute("aria-hidden", "true");
  });

  let openMarker = null;
  let pinned = false;
  let closeTimer = null;
  let cityAligned = false;
  const buttons = [];

  function cancelClose() {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function closePopup() {
    cancelClose();
    pinned = false;
    openMarker = null;
    popup.hidden = true;
    buttons.forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });
  }

  function scheduleClose() {
    cancelClose();
    closeTimer = window.setTimeout(function () {
      closeTimer = null;
      if (!pinned) {
        closePopup();
      }
    }, 180);
  }

  function markerOnScreen(button) {
    const rect = button.getBoundingClientRect();
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  function placePopup() {
    if (!openMarker || popup.hidden) {
      return;
    }
    if (!markerOnScreen(openMarker)) {
      closePopup();
      return;
    }

    const pinRect = openMarker.getBoundingClientRect();
    const tipX = pinRect.left + pinRect.width / 2;
    const header = document.querySelector(".site-header");
    const topLimit = (header ? header.getBoundingClientRect().bottom : 0) + 8;
    const margin = 10;
    const gap = 8;
    const width = popup.offsetWidth;
    const height = popup.offsetHeight;

    let left = tipX - width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    let top = pinRect.top - height - gap;
    let below = false;
    if (top < topLimit) {
      below = true;
      top = pinRect.bottom + gap;
    }
    if (top + height > window.innerHeight - margin) {
      top = Math.max(topLimit, window.innerHeight - height - margin);
    }

    popup.style.left = left + "px";
    popup.style.top = top + "px";
    popup.style.setProperty("--arrow", Math.max(16, Math.min(width - 16, tipX - left)) + "px");
    popup.classList.toggle("is-below", below);
  }

  function openPopup(button, station) {
    const file = station.image || "";
    if (popupImage.dataset.file !== file) {
      popupImage.dataset.file = file;
      popupImage.classList.remove("is-missing", "is-broken");
      delete popupImage.dataset.broken;
      popupPlaceholder.textContent = "Foto kommer";
      popupPlaceholder.removeAttribute("aria-hidden");
      if (file) {
        popup.classList.remove("is-placeholder");
        popupImage.hidden = false;
        popupImage.alt = station.alt || "";
        popupImage.style.objectPosition = station.position || "center";
        popupImage.src = file;
      } else {
        popup.classList.add("is-placeholder");
        popupImage.hidden = true;
        popupImage.alt = "";
        popupImage.removeAttribute("src");
      }
    }
    popupName.textContent = station.name;
    popupYears.textContent = station.years;
    popup.setAttribute("aria-label", station.name + ". " + station.years);
    openMarker = button;
    buttons.forEach(function (item) {
      item.setAttribute("aria-expanded", item === button ? "true" : "false");
    });
    popup.hidden = false;
    placePopup();
  }

  stations.forEach(function (station) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "station-marker";
    button.style.setProperty("--x", station.left + "%");
    button.style.setProperty("--y", station.top + "%");
    button.setAttribute("aria-label", station.name + ". " + station.years);
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = pin;

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      cancelClose();
      if (openMarker === button && pinned) {
        closePopup();
        return;
      }
      pinned = true;
      openPopup(button, station);
    });

    button.addEventListener("mouseenter", function () {
      if (!hoverMedia.matches || (pinned && openMarker !== button)) {
        return;
      }
      cancelClose();
      openPopup(button, station);
    });

    button.addEventListener("mouseleave", function () {
      if (!hoverMedia.matches || pinned) {
        return;
      }
      scheduleClose();
    });

    stage.appendChild(button);
    buttons.push(button);
  });

  popup.addEventListener("mouseenter", cancelClose);
  popup.addEventListener("mouseleave", function () {
    if (!hoverMedia.matches || pinned) {
      return;
    }
    scheduleClose();
  });

  document.addEventListener("click", function (event) {
    if (!openMarker) {
      return;
    }
    if (popup.contains(event.target) || event.target.closest(".station-marker")) {
      return;
    }
    closePopup();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closePopup();
    }
  });

  /*
    On a phone the map is wider than the screen.
    Start at Halden, on the right, so the city is in view.
    Swiping left reaches the intermediate station.
  */
  function showCity() {
    const overflows = scroll.scrollWidth > scroll.clientWidth + 4;
    if (!overflows) {
      cityAligned = false;
      return;
    }
    if (cityAligned) {
      return;
    }
    scroll.scrollLeft = scroll.scrollWidth - scroll.clientWidth;
    cityAligned = true;
  }

  let frame = 0;

  function requestPlace() {
    if (frame) {
      return;
    }
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      showCity();
      placePopup();
    });
  }

  image.addEventListener("load", requestPlace);
  window.addEventListener("resize", requestPlace);
  window.addEventListener("scroll", requestPlace, { passive: true });
  scroll.addEventListener("scroll", requestPlace, { passive: true });

  if (image.complete) {
    requestPlace();
  }
})();
