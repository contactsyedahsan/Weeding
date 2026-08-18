/* =============================================================
   events.js — builds the three event screens and the location pins
   -------------------------------------------------------------
   No venue name, time or Google Maps URL is written in index.html,
   so replacing a `locationUrl` in config.js is the only edit ever
   needed.
   ============================================================= */

(function (WI) {
  'use strict';

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

  function filmOverlay(ev) {
    if (ev.id !== 'mehndi') return '';
    return '' +
      '<div class="film-copy film-copy--mehndi" aria-hidden="true">' +
        '<p class="film-copy__title">Mehndi</p>' +
        '<p class="film-copy__subtitle">A Night of Celebration &amp; Qawwali</p>' +
      '</div>';
  }

  /* ---------- 1 · EVENT SCREEN ------------------------------ */
  function eventScreen(ev) {
    var sec = document.createElement('section');
    sec.className = 'screen event event--' + ev.theme;
    sec.id = 'screen-' + ev.id;
    sec.dataset.screen = ev.id;
    sec.setAttribute('aria-labelledby', ev.id + '-title');

    sec.innerHTML = '' +
      '<div class="screen__film" data-film aria-hidden="true">' +
        '<video class="screen__video" playsinline muted preload="none" disablepictureinpicture></video>' +
        '<div class="screen__scrim"></div>' +
        filmOverlay(ev) +
      '</div>' +

      '<div class="screen__body">' +
        '<div class="event__bg" aria-hidden="true"></div>' +
        '<div class="screen__decor" aria-hidden="true">' +
          '<svg class="ornament sprig sprig--l"><use href="#i-sprig"></use></svg>' +
          '<svg class="ornament sprig sprig--r"><use href="#i-sprig"></use></svg>' +
          '<svg class="ribbon ribbon--foot"><use href="#i-ribbon' +
            (ev.theme === 'rukhsati' ? '-gold' : '') + '"></use></svg>' +
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

            '<svg class="ornament event__rule" data-reveal="scale"><use href="#i-divider"></use></svg>' +

            '<div class="event__when" data-reveal="up">' +
              '<time class="event__date" datetime="' + esc(ev.iso) + '">' + esc(ev.date) + '</time>' +
              '<span class="event__time">' + esc(ev.time) + '</span>' +
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
        '</div>' +
      '</div>';

    return sec;
  }

  /* ---------- 2 · LOCATION PIN ------------------------------ */
  function locationPin(ev) {
    var row = document.createElement('div');
    row.className = 'pin pin--' + ev.theme;
    row.setAttribute('data-reveal', 'up');
    row.innerHTML = '' +
      svgIcon('i-pin', 'pin__icon') +
      '<div class="pin__text">' +
        '<p class="pin__event">' + esc(ev.title) + '</p>' +
        '<p class="pin__venue">' + esc(ev.venue) + '</p>' +
        (ev.address ? '<p class="pin__meta">' + esc(ev.address) + '</p>' : '') +
        '<p class="pin__meta">' + esc(ev.dateShort) + ' · ' + esc(ev.time) + '</p>' +
      '</div>' +
      locationButton(ev, 'btn-loc--pin');
    return row;
  }

  /* ---------- render --------------------------------------- */
  WI.render = function () {
    var events = WI.events || [];
    var eventsRoot = document.getElementById('events-root');
    var pinsRoot = document.getElementById('pins-root');

    events.forEach(function (ev) {
      if (eventsRoot) eventsRoot.appendChild(eventScreen(ev));
      if (pinsRoot)   pinsRoot.appendChild(locationPin(ev));
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
