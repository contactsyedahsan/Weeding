/* =============================================================
   events.js — renders every content block from WI.events
   -------------------------------------------------------------
   Event panels, the vertical timeline, the venue grid and the
   save-the-dates list are all generated here. No venue name,
   time or Google Maps URL is written in index.html, so replacing
   a `locationUrl` in config.js is the only edit ever needed.
   ============================================================= */

(function (WI) {
  'use strict';

  /* ---------- helpers --------------------------------------- */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function svgIcon(id, cls) {
    return '<svg class="' + cls + '" aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }

  /**
   * The VIEW LOCATION button.
   * An empty `locationUrl` produces nothing at all — no dead link,
   * no empty button, no placeholder.
   */
  function locationButton(ev, extraClass) {
    if (!ev.locationUrl) return '';
    var label = ev.mapLabel || 'View Location';
    return '' +
      '<a class="btn-loc' + (extraClass ? ' ' + extraClass : '') + '" ' +
         'href="' + esc(ev.locationUrl) + '" ' +
         'target="_blank" rel="noopener noreferrer" ' +
         'aria-label="' + esc(label + ' for ' + ev.title + ' at ' + ev.venue) + ' (opens in a new tab)">' +
        svgIcon('i-pin', '') +
        '<span>' + esc(label) + '</span>' +
      '</a>';
  }

  /* ---------- 1 · EVENT PANELS ------------------------------ */
  function eventSection(ev, i) {
    var sec = document.createElement('section');
    sec.className = 'event event--' + ev.theme;
    sec.id = ev.id;
    sec.setAttribute('aria-labelledby', ev.id + '-title');
    sec.dataset.event = ev.id;

    sec.innerHTML = '' +
      '<div class="event__bg" aria-hidden="true"></div>' +
      '<div class="event__curtain" aria-hidden="true"></div>' +
      '<canvas class="event__dust" aria-hidden="true"></canvas>' +

      '<div class="event__decor" aria-hidden="true">' +
        '<svg class="ornament sprig sprig--a" data-parallax="0.15"><use href="#i-sprig"></use></svg>' +
        '<svg class="ornament sprig sprig--b" data-parallax="0.15"><use href="#i-sprig"></use></svg>' +
        '<svg class="ribbon ribbon--a" data-parallax="0.28"><use href="#i-ribbon' +
          (ev.theme === 'rukhsati' ? '-gold' : '') + '"></use></svg>' +
        '<svg class="ornament bloom bloom--a float-slow" data-parallax="0.45"><use href="#i-bloom"></use></svg>' +
        '<svg class="ornament bloom bloom--b float-slower" data-parallax="0.4"><use href="#i-bloom"></use></svg>' +
        '<div class="asset-layer" data-asset-layer="' + ev.id + '"></div>' +
      '</div>' +

      '<div class="shell">' +
        '<article class="event__panel">' +
          '<div class="event__frame" aria-hidden="true">' +
            svgIcon('i-corner', 'ornament corner corner--tl') +
            svgIcon('i-corner', 'ornament corner corner--tr') +
            svgIcon('i-corner', 'ornament corner corner--bl') +
            svgIcon('i-corner', 'ornament corner corner--br') +
          '</div>' +

          svgIcon(ev.motif || 'i-bloom', 'event__motif') +

          '<p class="label event__index" data-reveal="up">' + esc(ev.index) + '</p>' +
          '<h2 class="event__title" id="' + ev.id + '-title" data-reveal="mask">' + esc(ev.title) + '</h2>' +
          '<p class="event__subtitle" data-reveal="up">' + esc(ev.subtitle) + '</p>' +

          svgIcon('i-divider', 'ornament event__rule') +

          '<div class="event__when">' +
            '<time class="event__date" datetime="' + esc(ev.iso) + '" data-reveal="up">' + esc(ev.date) + '</time>' +
            '<span class="event__time" data-reveal="up">' + esc(ev.time) + '</span>' +
          '</div>' +

          (ev.description
            ? '<p class="event__desc" data-reveal="up">' + esc(ev.description) + '</p>'
            : '') +

          '<div class="event__venue" data-reveal="up">' +
            svgIcon('i-reticle', 'event__pin') +
            '<p class="event__venue-name">' + esc(ev.venue) + '</p>' +
            (ev.address ? '<p class="event__address">' + esc(ev.address) + '</p>' : '') +
            locationButton(ev) +
          '</div>' +
        '</article>' +
      '</div>';

    return sec;
  }

  /* ---------- 2 · TIMELINE ---------------------------------- */
  function timelineItem(ev) {
    var li = document.createElement('li');
    li.className = 'tl__item';
    li.dataset.event = ev.id;
    li.innerHTML = '' +
      '<span class="tl__node" aria-hidden="true"></span>' +
      '<p class="tl__date">' + esc(ev.day) + ' ' + esc(ev.month.slice(0, 3)) + '</p>' +
      '<h3 class="tl__title">' + esc(ev.title) + '</h3>' +
      '<p class="tl__time">' + esc(ev.time) + '</p>' +
      '<p class="tl__venue">' + esc(ev.venue) + '</p>';
    return li;
  }

  /* ---------- 3 · VENUE CARDS ------------------------------- */
  function venueCard(ev) {
    var card = document.createElement('div');
    card.className = 'venue-card';
    card.dataset.event = ev.id;
    card.setAttribute('data-reveal', 'up');
    card.innerHTML = '' +
      svgIcon('i-reticle', 'venue-card__pin') +
      '<p class="venue-card__event">' + esc(ev.title) + '</p>' +
      '<p class="venue-card__name">' + esc(ev.venue) + '</p>' +
      (ev.address ? '<p class="venue-card__meta">' + esc(ev.address) + '</p>' : '') +
      '<p class="venue-card__meta">' + esc(ev.dateShort) + ' · ' + esc(ev.time) + '</p>' +
      locationButton(ev);
    return card;
  }

  /* ---------- 4 · SAVE THE DATES ---------------------------- */
  function saveDate(ev) {
    var li = document.createElement('li');
    li.setAttribute('data-reveal', 'up');
    li.innerHTML = '<b>' + esc(ev.day) + ' ' + esc(ev.month) + '</b><i>' + esc(ev.title) + '</i>';
    return li;
  }

  /* ---------- render ---------------------------------------- */
  WI.render = function () {
    var events = WI.events || [];

    var eventsRoot = document.getElementById('events-root');
    var tlRoot = document.getElementById('tl-root');
    var venuesRoot = document.getElementById('venues-root');
    var savesRoot = document.getElementById('save-dates');

    if (tlRoot) {
      var draw = document.createElement('span');
      draw.className = 'tl__draw';
      draw.setAttribute('aria-hidden', 'true');
      tlRoot.appendChild(draw);
    }

    events.forEach(function (ev, i) {
      if (eventsRoot) eventsRoot.appendChild(eventSection(ev, i));
      if (tlRoot)     tlRoot.appendChild(timelineItem(ev));
      if (venuesRoot) venuesRoot.appendChild(venueCard(ev));
      if (savesRoot)  savesRoot.appendChild(saveDate(ev));
    });

    /* tap feedback for coarse pointers */
    if (WI.env && WI.env.isTouch) {
      document.addEventListener('touchstart', function (e) {
        var btn = e.target.closest && e.target.closest('.btn-loc');
        if (btn) btn.classList.add('is-tapped');
      }, { passive: true });
      document.addEventListener('touchend', function () {
        document.querySelectorAll('.btn-loc.is-tapped')
          .forEach(function (b) { b.classList.remove('is-tapped'); });
      }, { passive: true });
    }

    return events.length;
  };

})(window.WI = window.WI || {});
