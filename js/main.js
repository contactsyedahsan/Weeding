/* =============================================================
   main.js — environment, music, boot
   -------------------------------------------------------------
     1. environment + the shared resize / pointer buses
     2. render the screens from config
     3. music (starts on the guest's first touch)
     4. hand over to the router in screens.js
   ============================================================= */

(function (WI) {
  'use strict';

  /* =========================================================
     1 · ENVIRONMENT
     ========================================================= */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches ||
               ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  WI.env = {
    isTouch: coarse,
    isMobile: window.innerWidth < 768 || coarse,
    reduced: reduced,
    motion: !reduced,
    hasGSAP: false
  };

  /* ---------- shared resize bus (one listener, debounced) ---- */
  var resizeSubs = [];
  var resizeTimer = null;
  var lastW = window.innerWidth;

  WI.onResize = function (fn) { resizeSubs.push(fn); };

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      /* ignore the mobile URL bar growing and shrinking */
      if (WI.env.isTouch && window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      WI.env.isMobile = window.innerWidth < 768 || coarse;
      resizeSubs.forEach(function (fn) { try { fn(); } catch (e) { /* keep the others alive */ } });
    }, 180);
  }, { passive: true });

  /* ---------- shared pointer bus (used by 3D assets) -------- */
  var pointerSubs = [];
  WI.pointer = {
    subscribe: function (fn) { pointerSubs.push(fn); },
    x: 0, y: 0
  };
  if (!coarse) {
    window.addEventListener('pointermove', function (e) {
      var nx = (e.clientX / window.innerWidth) * 2 - 1;
      var ny = (e.clientY / window.innerHeight) * 2 - 1;
      WI.pointer.x = nx; WI.pointer.y = ny;
      for (var i = 0; i < pointerSubs.length; i++) pointerSubs[i](nx, ny);
    }, { passive: true });
  }

  /* Screens scroll inside themselves, so nothing else needs to. */
  WI.scrollTo = function (target) {
    if (target && target.scrollIntoView) target.scrollIntoView({ block: 'start' });
  };

  /* =========================================================
     2 · MUSIC
     -------------------------------------------------------------
     No browser lets a page start sound on its own. So: try, and if
     we are refused, wait for the guest's very first touch anywhere
     and start then. In practice that is a second or two in and they
     never notice the difference.
     ========================================================= */
  function initAudio() {
    var cfg = WI.audio || {};
    var btn = document.getElementById('audio-btn');
    if (!btn || !cfg.src) return;          // no file → no player, no broken UI

    var audio = new Audio(cfg.src);
    audio.loop = cfg.loop !== false;
    audio.preload = 'auto';
    audio.volume = 0;

    var target = cfg.volume != null ? cfg.volume : 1.0;
    var failed = false, playing = false, fade = null;

    audio.addEventListener('error', function () {
      failed = true;
      btn.hidden = true;
      console.warn('[WI] Music could not be loaded: ' + cfg.src);
    });

    function fadeTo(to, done) {
      if (fade) clearInterval(fade);
      var step = target / ((cfg.fadeSeconds || 2) * 20);
      fade = setInterval(function () {
        var v = audio.volume + (to > audio.volume ? step : -step);
        if ((to > audio.volume && v >= to) || (to <= audio.volume && v <= to)) {
          audio.volume = Math.max(0, Math.min(1, to));
          clearInterval(fade); fade = null;
          if (done) done();
        } else {
          audio.volume = Math.max(0, Math.min(1, v));
        }
      }, 50);
    }

    function show() {
      btn.hidden = false;
      requestAnimationFrame(function () { btn.classList.add('is-in'); });
    }

    function start() {
      if (failed || playing) return;
      var p = audio.play();
      if (p && p.catch) { p.catch(function () { /* still blocked; the arm below waits */ }); }
      playing = true;
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', 'Turn the music off');
      show();
      fadeTo(target);
    }

    function stop() {
      playing = false;
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Turn the music on');
      fadeTo(0, function () { audio.pause(); });
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (failed) return;
      playing ? stop() : start();
    });

    /* try immediately … */
    audio.play().then(function () {
      playing = true;
      btn.setAttribute('aria-pressed', 'true');
      show();
      fadeTo(target);
    }).catch(function () {
      /* … refused, as expected. Arm the first touch. */
      show();
      var arm = function () {
        document.removeEventListener('pointerdown', arm);
        document.removeEventListener('touchstart', arm);
        document.removeEventListener('keydown', arm);
        start();
      };
      document.addEventListener('pointerdown', arm, { once: true });
      document.addEventListener('touchstart', arm, { once: true, passive: true });
      document.addEventListener('keydown', arm, { once: true });
    });
  }

  /* =========================================================
     3 · BOOT
     ========================================================= */
  function boot() {
    if (WI.render) WI.render();                  // screens exist before anything binds
    if (WI.countdownInit) WI.countdownInit();
    if (WI.animations) WI.animations.prepare();

    WI.env.hasGSAP = !!window.gsap;

    if (WI.env.hasGSAP && WI.env.motion) {
      WI.animations.init();
    } else {
      /* No GSAP (the CDN is unreachable) or reduced motion: show
         everything, skip the films, keep it entirely usable. */
      WI.animations.staticFallback();
    }

    if (WI.assets) WI.assets.init();
    initAudio();
    if (WI.router) WI.router.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window.WI = window.WI || {});
