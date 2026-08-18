/* =============================================================
   screens.js — the router, the films, and the bottom bar
   -------------------------------------------------------------
   The invitation is five fixed screens. One is visible at a time.
   Opening a screen plays its film — every time, including on the way
   back — and when the film ends the screen scrolls itself down to the
   text, which animates in. The guest can scroll back up to watch the
   film again at any point.
   ============================================================= */

(function (WI) {
  'use strict';

  var current = null;
  var runToken = {};        // guards against listeners from an interrupted visit
  var nav, pill, links = [];

  function cfgFor(id) { return (WI.screens || {})[id] || {}; }
  function screenEl(id) { return document.querySelector('[data-screen="' + id + '"]'); }

  /* =========================================================
     1 · THE BOTTOM BAR
     ========================================================= */
  function buildNav() {
    nav = document.getElementById('evnav');
    if (!nav) return;
    pill = nav.querySelector('.evnav__pill');

    (WI.nav || []).forEach(function (item, i) {
      var a = document.createElement('button');
      a.type = 'button';
      a.className = 'evnav__link' + (item.icon ? ' evnav__link--icon' : '');
      a.dataset.nav = item.id;
      a.style.setProperty('--nav-i', i);

      if (item.icon) {
        /* Home is the couple's monogram — icon-only keeps five items
           inside a 320px bar without shrinking anyone's label. */
        a.innerHTML = '<span class="evnav__mono" aria-hidden="true">M<i>&amp;</i>D</span>';
        a.setAttribute('aria-label', item.label);
      } else {
        a.textContent = item.label;
      }

      a.addEventListener('click', function () { WI.router.go(item.id); });
      nav.appendChild(a);
      links.push(a);
    });

    requestAnimationFrame(function () {
      nav.classList.add('is-bloomed');
    });
  }

  function markNav(id) {
    var active = null;
    links.forEach(function (l) {
      var on = l.dataset.nav === id;
      l.classList.toggle('is-active', on);
      l.setAttribute('aria-current', on ? 'true' : 'false');
      if (on) active = l;
    });
    if (!active || !pill) return;
    /* measured against the bar's own box so the pill lands exactly
       under the label whatever the padding or font metrics do */
    var nr = nav.getBoundingClientRect();
    var lr = active.getBoundingClientRect();
    nav.classList.add('has-active');
    pill.style.width = lr.width + 'px';
    pill.style.transform = 'translateX(' + (lr.left - nr.left) + 'px)';
  }

  /* =========================================================
     2 · THE REVEAL
     -------------------------------------------------------------
     One routine for every screen: the text rises from below,
     staggered, in the order it appears in the markup.
     ========================================================= */
  function revealBody(sec) {
    var body = sec.querySelector('.screen__body');
    if (!body) return;
    body.classList.add('is-revealed');

    var gsap = window.gsap;
    if (!gsap || !WI.env.motion) return;      // CSS already shows it

    var els = Array.prototype.slice.call(body.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    els.forEach(function (el, i) {
      var kind = el.getAttribute('data-reveal');
      var at = i * 0.13;

      if (kind === 'mask') {
        var inner = el.querySelector('.mask-inner') || el;
        tl.set(el, { opacity: 1 }, at);
        tl.fromTo(inner, { yPercent: 112, opacity: 0 },
                         { yPercent: 0, opacity: 1, duration: 1.15 }, at);
      } else if (kind === 'scale') {
        tl.fromTo(el, { opacity: 0, scale: .86 },
                      { opacity: 1, scale: 1, duration: .95, ease: 'back.out(1.4)' }, at);
      } else if (kind === 'fade') {
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.1 }, at);
      } else {
        tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .95 }, at);
      }
    });

    tl.add(function () {
      body.querySelectorAll('.foil').forEach(function (f) { f.classList.add('is-shimmering'); });
    }, 0.6);
  }

  /* =========================================================
     3 · THE FILM
     -------------------------------------------------------------
     The film plays every single time a screen is opened — including
     coming back to one — and when it finishes the screen scrolls
     itself down to the text. The guest can always scroll back up to
     watch it again.
     ========================================================= */
  function smoothScrollTo(el, top, ms) {
    var start = el.scrollTop;
    var delta = top - start;
    if (Math.abs(delta) < 2) return;
    if (!WI.env.motion) { el.scrollTop = top; return; }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / ms);
      /* the same easeOutExpo the rest of the motion uses */
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.scrollTop = start + delta * e;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function playFilm(sec, id) {
    var cfg = cfgFor(id);
    var film = sec.querySelector('[data-film]');
    var video = film && film.querySelector('video');
    var body = sec.querySelector('.screen__body');

    /* A looping film is a backdrop, not an act: it runs behind the
       text and the text does not wait for it. */
    if (cfg.loop) {
      if (video && cfg.video) startBackgroundFilm(video, cfg);
      revealBody(sec);
      return;
    }

    /* Nothing to play at all — show the text where the film would be. */
    if (!film || !video || !cfg.video) {
      if (film) film.classList.add('is-gone');
      revealBody(sec);
      return;
    }

    film.classList.remove('is-gone');
    sec.scrollTop = 0;

    /* Each visit gets its own token. A guest who taps away mid-film
       leaves an unconsumed `ended` listener behind; without this it
       would fire into the next visit and scroll the screen for no
       reason. */
    var token = (runToken[id] = (runToken[id] || 0) + 1);
    var handedOver = false;
    function handOver() {
      if (handedOver || runToken[id] !== token) return;
      handedOver = true;
      try { video.pause(); } catch (e) {}
      revealBody(sec);
      /* scroll past the film to the text — this is the "then it
         scrolls down by itself" half of the sequence */
      if (body) smoothScrollTo(sec, body.offsetTop, 1400);
    }

    /* If the file is missing, the codec is refused, or autoplay is
       blocked, the guest gets the text instead of a stalled frame. */
    video.addEventListener('error', function () {
      if (runToken[id] !== token) return;
      console.warn('[WI] Film unavailable for "' + id + '" — showing its text.');
      film.classList.add('is-gone');
      handOver();
    }, { once: true });
    video.addEventListener('ended', handOver, { once: true });

    if (cfg.poster) video.poster = cfg.poster;
    video.muted = true;
    video.playsInline = true;
    if (!video.src) { video.src = cfg.video; video.load(); }

    try { video.currentTime = 0; } catch (e) { /* not seekable yet */ }
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        console.warn('[WI] Autoplay blocked on "' + id + '" — showing its text.');
        handOver();
      });
    }

    /* Belt and braces: never strand anyone on a film that stops
       reporting. Duration is unknown until metadata lands, so wait
       generously and check. */
    setTimeout(function () {
      if (!handedOver && (video.paused || !video.duration)) handOver();
    }, 16000);
  }

  function startBackgroundFilm(video, cfg) {
    if (video.src) { var r = video.play(); if (r && r.catch) r.catch(function () {}); return; }
    if (cfg.poster) video.poster = cfg.poster;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.src = cfg.video;
    video.load();
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* a still poster is fine */ });
  }

  /* Quietly warm up a film so tapping its button is instant. */
  function prefetch(id) {
    var cfg = cfgFor(id);
    var sec = screenEl(id);
    if (!cfg.video || !sec) return;
    var v = sec.querySelector('[data-film] video');
    if (v && !v.src) { v.preload = 'auto'; v.src = cfg.video; v.load(); }
  }

  /* =========================================================
     4 · ROUTING
     -------------------------------------------------------------
     WI.screens stays the data from config.js. The API lives on
     WI.router so the two never collide.
     ========================================================= */
  WI.router = {

    go: function (id, opts) {
      opts = opts || {};
      if (!screenEl(id)) id = 'home';
      if (id === current) return;

      var next = screenEl(id);
      var prev = current ? screenEl(current) : null;

      if (prev) {
        prev.classList.remove('is-active');
        var pv = prev.querySelector('[data-film] video');
        if (pv) { try { pv.pause(); pv.currentTime = 0; } catch (e) {} }
      }

      next.classList.add('is-active');
      next.scrollTop = 0;
      current = id;
      markNav(id);

      if (!opts.silent) {
        try { history.replaceState(null, '', '#' + id); } catch (e) {}
      }

      playFilm(next, id);
    },

    current: function () { return current; },

    init: function () {
      buildNav();

      /* Deep link: …/#shalima opens straight to that event, which is
         handy when one family is sent one event. */
      var want = (location.hash || '').replace('#', '');
      if (!screenEl(want)) want = '';

      WI.router.go(want || 'home', { silent: !want });

      window.addEventListener('hashchange', function () {
        var id = (location.hash || '').replace('#', '');
        if (id && screenEl(id)) WI.router.go(id);
      });

      WI.onResize(function () { if (current) markNav(current); });

      /* Once home has had its moment, pull the rest down quietly so
         the first tap on a button is instant. */
      setTimeout(function () {
        Object.keys(WI.screens || {}).forEach(function (id) {
          if (id !== current) prefetch(id);
        });
      }, 6000);
    }
  };

})(window.WI = window.WI || {});
