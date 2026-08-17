/* =============================================================
   main.js — boot, environment, smooth scroll, opening sequence
   -------------------------------------------------------------
   Order of operations
     1. environment + shared buses (resize / pointer)
     2. render content from config
     3. smooth scroll (Lenis) + motion system (GSAP)
     4. hold on the envelope until the visitor opens it
     5. cinematic opening → hero → scroll unlocked
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
      /* ignore mobile URL-bar height changes */
      if (WI.env.isTouch && window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      WI.env.isMobile = window.innerWidth < 768 || coarse;
      resizeSubs.forEach(function (fn) { try { fn(); } catch (e) { /* keep others alive */ } });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
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

  /* =========================================================
     2 · SMOOTH SCROLL
     ========================================================= */
  var lenis = null;

  function initSmoothScroll() {
    if (!window.Lenis || reduced || !window.gsap) return;

    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false,          // native momentum feels better on phones
      touchMultiplier: 1.4,
      wheelMultiplier: 0.95
    });

    if (window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function loop(t) { lenis.raf(t); requestAnimationFrame(loop); });
    }
    WI.lenis = lenis;
  }

  WI.scrollTo = function (target, opts) {
    opts = opts || {};
    if (lenis) { lenis.scrollTo(target, { duration: opts.duration || 1.5, offset: opts.offset || 0 }); return; }
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  function lockScroll(on) {
    document.body.classList.toggle('is-locked', !!on);
    if (lenis) { on ? lenis.stop() : lenis.start(); }
  }

  /* =========================================================
     3 · AUDIO (only if a file is configured)
     ========================================================= */
  function initAudio() {
    var cfg = WI.audio || {};
    var btn = document.getElementById('audio-btn');
    if (!btn || !cfg.src) return;            // no file → no player, no broken UI

    var audio = new Audio(cfg.src);
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0;

    var failed = false;
    audio.addEventListener('error', function () {
      failed = true;
      btn.hidden = true;
      console.warn('[WI] Audio file could not be loaded: ' + cfg.src);
    });

    btn.hidden = false;
    requestAnimationFrame(function () { btn.classList.add('is-in'); });

    var playing = false;
    var fade = null;

    function fadeTo(target, done) {
      if (fade) clearInterval(fade);
      var step = (cfg.volume || 0.35) / ((cfg.fadeSeconds || 1.5) * 20);
      fade = setInterval(function () {
        var v = audio.volume + (target > audio.volume ? step : -step);
        if ((target > audio.volume && v >= target) || (target <= audio.volume && v <= target)) {
          audio.volume = Math.max(0, Math.min(1, target));
          clearInterval(fade); fade = null;
          if (done) done();
        } else {
          audio.volume = Math.max(0, Math.min(1, v));
        }
      }, 50);
    }

    btn.addEventListener('click', function () {
      if (failed) return;
      if (!playing) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { /* browser refused — leave the button off */ });
        playing = true;
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Pause ambient music');
        fadeTo(cfg.volume || 0.35);
      } else {
        playing = false;
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Play ambient music');
        fadeTo(0, function () { audio.pause(); });
      }
    });

    WI.startAudio = function () {
      if (!failed && !playing) btn.click();
    };
  }

  /* =========================================================
     4 · OPENING SEQUENCE
     ========================================================= */
  function initIntroAnimation() {
    var intro = document.getElementById('intro');
    var btn = document.getElementById('btn-open');
    var site = document.getElementById('site');
    var sweep = document.getElementById('sweep');
    var gsap = window.gsap;

    if (!intro || !btn) { finish(); return; }

    /* intro particles */
    if (WI.env.motion && WI.GoldDust) {
      WI.GoldDust(intro.querySelector('.intro__dust'), {
        count: WI.env.isMobile ? 34 : 90,
        tint: [235, 208, 152], maxR: 2.2, speed: 0.3
      });
    }

    /* the envelope settles in */
    if (gsap && WI.env.motion) {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('.envelope', { opacity: 0, y: 46, scale: .92, rotateX: 12 },
                { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.8 }, 0.15)
        .fromTo('.seal', { opacity: 0, scale: .4 },
                { opacity: 1, scale: 1, duration: 1.2, ease: 'back.out(1.7)' }, 0.9)
        .fromTo('.intro__eyebrow', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1 }, 0.7)
        .fromTo('.intro__title', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.1 }, 0.85)
        .fromTo('.intro__names', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.3 }, 1.0)
        .fromTo('.intro__div', { opacity: 0, scaleX: .3 }, { opacity: 1, scaleX: 1, duration: 1 }, 1.2)
        .fromTo(btn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.1 }, 1.35)
        .fromTo('.intro__hint', { opacity: 0 }, { opacity: 1, duration: .9 }, 1.7)
        .add(function () { btn.focus({ preventScroll: true }); });
    }

    var opened = false;

    function open() {
      if (opened) return;
      opened = true;
      btn.disabled = true;

      if (!gsap || !WI.env.motion) {
        intro.style.transition = 'opacity .5s ease';
        intro.style.opacity = '0';
        setTimeout(function () { intro.remove(); finish(); }, 500);
        return;
      }

      if (sweep) sweep.style.visibility = 'visible';

      var tl = gsap.timeline({ onComplete: finish });

      /* 1 · the screen settles and darkens */
      tl.to([btn, '.intro__hint', '.intro__eyebrow', '.intro__title', '.intro__names', '.intro__div'],
            { opacity: 0, y: -12, duration: .5, stagger: .035, ease: 'power2.in' }, 0)
        .to('.intro__glow', { opacity: .35, scale: .8, duration: .8, ease: 'power2.inOut' }, 0)
        .to(intro, { backgroundColor: '#2a0710', duration: .9, ease: 'power2.inOut' }, 0)

      /* 2 · the wax seal breaks away */
        .to('.seal', { scale: 1.12, duration: .3, ease: 'power2.out' }, .25)
        .to('.seal', { y: 30, rotate: -22, scale: .85, opacity: 0, duration: .75, ease: 'power3.in' }, .5)

      /* 3 · the flap opens */
        .to('.envelope__flap', { rotateX: -172, duration: 1.1, ease: 'power3.inOut',
                                 transformOrigin: 'top center' }, .75)
        .to('.envelope__flap', { zIndex: 1, duration: 0 }, 1.25)

      /* 4 · the inner card rises */
        .to('.envelope__card', { yPercent: -78, duration: 1.3, ease: 'expo.out' }, 1.25)
        .to('.envelope', { y: -18, scale: 1.04, duration: 1.3, ease: 'expo.out' }, 1.25)

      /* 5 · the satin ribbon sweeps the frame */
        .fromTo('.sweep__ribbon',
                { opacity: 0, xPercent: -55, rotate: -8, yPercent: 20 },
                { opacity: .95, xPercent: 12, rotate: 4, yPercent: -6, duration: 1.6, ease: 'power3.inOut' }, 1.35)
        .to('.sweep__ribbon', { opacity: 0, xPercent: 60, duration: 1, ease: 'power2.in' }, 2.5)

      /* 6 · gold lifts through the frame */
        .to('.intro__dust', { opacity: 1, duration: .4 }, 1.5)
        .to('.envelope', { opacity: 0, scale: 1.16, filter: 'blur(6px)', duration: .9, ease: 'power2.in' }, 2.35)

      /* 7 · burgundy gives way to ivory */
        .to('.sweep__panel', { scaleY: 1, transformOrigin: 'bottom center', duration: .8,
                               ease: 'power4.inOut' }, 2.35)
        .set(site, { opacity: 1 }, 3.0)
        .add(function () {
          intro.style.display = 'none';
          document.body.classList.remove('is-locked');
          /* the page was position:fixed until now — remeasure before scrolling */
          if (lenis) {
            if (lenis.resize) lenis.resize();
            lenis.start();
            lenis.scrollTo(0, { immediate: true });
          } else {
            window.scrollTo(0, 0);
          }
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        }, 3.02)
        .to('.sweep__panel', { scaleY: 0, transformOrigin: 'top center', duration: 1,
                               ease: 'power4.inOut' }, 3.08)
        .add(function () { if (sweep) sweep.style.visibility = 'hidden'; }, 4.1)

      /* 8-10 · Bismillah, the names, and the invitation proper */
        .add(WI.playHero(), 3.25);

      /* offer the music once the visitor has interacted */
      var audioBtn = document.getElementById('audio-btn');
      if (audioBtn && !audioBtn.hidden) {
        gsap.delayedCall(3.6, function () { audioBtn.classList.add('is-in'); });
      }
    }

    function finish() {
      var el = document.getElementById('intro');
      if (el) el.style.display = 'none';
      if (site) { site.style.opacity = '1'; site.classList.add('is-revealed'); }
      document.body.classList.remove('is-locked');
      if (lenis) { if (lenis.resize) lenis.resize(); lenis.start(); }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      /* hand focus to the invitation for keyboard and screen-reader users */
      if (site) site.focus({ preventScroll: true });
    }

    btn.addEventListener('click', open);

    /* Enter / Space anywhere on the intro also opens it */
    intro.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  }

  /* =========================================================
     5 · BOOT
     ========================================================= */
  function boot() {
    /* content first — everything else binds to the rendered DOM */
    if (WI.render) WI.render();
    if (WI.countdownInit) WI.countdownInit();
    if (WI.animations) WI.animations.prepare();

    WI.env.hasGSAP = !!(window.gsap && window.ScrollTrigger);

    if (WI.env.hasGSAP && WI.env.motion) {
      initSmoothScroll();
      WI.animations.init();
      if (WI.assets) WI.assets.init();
      initAudio();
      lockScroll(true);
      initIntroAnimation();
    } else {
      /* No GSAP (offline CDN) or reduced motion: show everything, keep it usable */
      WI.animations.staticFallback();
      if (WI.assets) WI.assets.init();
      initAudio();
      initIntroAnimation();
    }

    /* skip-the-intro escape hatch for anyone who lands mid-scroll */
    window.addEventListener('hashchange', function () {
      var el = document.querySelector(window.location.hash || '#nope');
      if (el) WI.scrollTo(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Refresh measurements once webfonts have swapped in */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }

})(window.WI = window.WI || {});
