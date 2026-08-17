/* =============================================================
   animations.js — the motion system
   -------------------------------------------------------------
   Gold dust canvases, scroll reveals, multi-layer parallax,
   per-event cinematic timelines, the drawing timeline, floating
   nav, curtain transitions and desktop micro-interactions.

   Parallax is driven through the CSS custom property --plx so it
   composes with an element's own CSS transform (mirrors, tilts)
   instead of overwriting it.
   ============================================================= */

(function (WI) {
  'use strict';

  var gsap, ST;

  /* =========================================================
     1 · GOLD DUST (canvas particles)
     ========================================================= */
  function GoldDust(canvas, opts) {
    if (!canvas || !canvas.getContext) return null;
    opts = opts || {};

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    var dpr = Math.min(window.devicePixelRatio || 1, WI.env.isMobile ? 1.5 : 2);
    var count = opts.count || 40;
    var tint = opts.tint || [231, 206, 155];
    var maxR = opts.maxR || 1.9;
    var speed = opts.speed || 0.22;
    var parts = [];
    var w = 0, h = 0, raf = null, running = false;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      parts.length = 0;
      for (var i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.35 + Math.random() * maxR,
          vy: -(0.12 + Math.random() * speed),
          vx: (Math.random() - 0.5) * 0.16,
          a: 0.12 + Math.random() * 0.55,
          tw: Math.random() * Math.PI * 2,
          ts: 0.008 + Math.random() * 0.02
        });
      }
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y += p.vy; p.x += p.vx; p.tw += p.ts;
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        if (p.x < -6) p.x = w + 6;
        if (p.x > w + 6) p.x = -6;
        var alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + alpha.toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    resize(); seed();

    /* only burn frames while the canvas is actually on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { rootMargin: '120px' }).observe(canvas);
    } else { start(); }

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    WI.onResize(function () { resize(); seed(); });

    return { start: start, stop: stop, burst: function (n) { count += n; seed(); } };
  }
  WI.GoldDust = GoldDust;

  /* =========================================================
     2 · TEXT MASK WRAPPING
     ========================================================= */
  function wrapMasks() {
    document.querySelectorAll('[data-reveal="mask"]').forEach(function (el) {
      if (el.dataset.masked) return;
      el.dataset.masked = '1';
      var inner = document.createElement('span');
      inner.className = 'mask-inner';
      while (el.firstChild) inner.appendChild(el.firstChild);
      var line = document.createElement('span');
      line.className = 'mask-line';
      line.appendChild(inner);
      el.appendChild(line);
    });
  }

  /* =========================================================
     3 · REVEAL TIMELINES
     ========================================================= */
  function revealTween(el) {
    var kind = el.getAttribute('data-reveal');
    if (kind === 'mask') {
      var inner = el.querySelector('.mask-inner');
      return {
        targets: inner || el,
        from: { yPercent: 108, opacity: 0 },
        to: { yPercent: 0, opacity: 1, duration: 1.25, ease: 'expo.out' },
        parent: el
      };
    }
    if (kind === 'scale') {
      return { targets: el, from: { opacity: 0, scale: 0.86 },
               to: { opacity: 1, scale: 1, duration: 1.05, ease: 'power3.out' } };
    }
    if (kind === 'fade') {
      return { targets: el, from: { opacity: 0 },
               to: { opacity: 1, duration: 1.2, ease: 'power2.out' } };
    }
    return { targets: el, from: { opacity: 0, y: 26 },
             to: { opacity: 1, y: 0, duration: 1, ease: 'power3.out' } };
  }

  function buildReveals(scope, stagger) {
    var els = Array.prototype.slice.call(scope.querySelectorAll('[data-reveal]'));
    if (!els.length) return null;

    var step = stagger || 0.14;
    var tl = gsap.timeline({
      scrollTrigger: { trigger: scope, start: 'top 74%', once: true },
      defaults: { overwrite: 'auto' },
      onComplete: function () {
        els.forEach(function (el) { el.classList.add('is-revealed-el'); });
      }
    });

    els.forEach(function (el, i) {
      var spec = revealTween(el);
      if (spec.parent) gsap.set(spec.parent, { opacity: 1 });
      tl.fromTo(spec.targets, spec.from, spec.to, i * step);
    });
    return tl;
  }

  /* =========================================================
     4 · PARALLAX (via --plx)
     ========================================================= */
  function initParallax() {
    var factor = WI.env.isMobile ? WI.motion.parallaxMobileFactor : 1;

    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      if (!speed) return;

      /* A CSS keyframe float writes the whole transform and would wipe
         out the parallax offset, so GSAP takes the float over too —
         on --pfy, which the element's transform already composes. */
      var floats = el.classList.contains('float-slow') || el.classList.contains('float-slower');
      if (floats) {
        el.classList.remove('float-slow', 'float-slower');
        gsap.to(el, {
          '--pfy': (WI.env.isMobile ? -8 : -15) + 'px',
          duration: 5 + Math.random() * 4,
          ease: 'sine.inOut', yoyo: true, repeat: -1, delay: Math.random()
        });
      }

      var host = el.closest('section, header') || document.body;
      var travel = Math.round(host.offsetHeight * speed * 0.55 * factor);

      gsap.fromTo(el,
        { '--plx': travel + 'px' },
        {
          '--plx': (-travel) + 'px',
          ease: 'none',
          scrollTrigger: {
            trigger: host,
            start: 'top bottom',
            end: 'bottom top',
            scrub: WI.env.isMobile ? 0.6 : true,
            invalidateOnRefresh: true
          }
        });
    });
  }

  /* =========================================================
     5 · HERO
     ========================================================= */
  function initHero() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    /* The hero reveal itself is played by the opening sequence
       (see WI.playHero), not on scroll. */

    /* names lift and soften as the hero leaves */
    gsap.to(hero.querySelector('.hero__inner'), {
      yPercent: -8, opacity: 0.35, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'center center', end: 'bottom top', scrub: true }
    });
  }

  /** Plays the hero content in — called at the end of the envelope opening. */
  WI.playHero = function () {
    var hero = document.getElementById('hero');
    if (!hero) return gsap.timeline();

    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    /* Decorative layers drift in behind the type, on their own track so
       their long durations never push the typography sequence around.
       They ride --pfx / --pfy, leaving scroll parallax intact. */
    var decor = gsap.timeline();
    decor.fromTo(hero.querySelector('.arch'),
        { opacity: 0 }, { opacity: .22, duration: 2.4, ease: 'power2.out' }, 0)
      .fromTo(hero.querySelectorAll('.sprig--hero-l, .sprig--hero-r'),
        { opacity: 0, '--pfy': '46px' },
        { opacity: .4, '--pfy': '0px', duration: 2, stagger: .18, ease: 'power3.out' }, 0.1)
      .fromTo(hero.querySelector('.ribbon--hero'),
        { opacity: 0, '--pfx': '-90px' },
        { opacity: .72, '--pfx': '0px', duration: 2.4, ease: 'power3.out' }, 0.2);

    /* Absolute cue points, not relative offsets — the whole reveal has to
       land inside ~5s so nobody waits on the bride's name. */
    var type = gsap.timeline({ defaults: { ease: 'expo.out' } });

    type.fromTo(hero.querySelector('.bismillah'),
        { opacity: 0, y: 16, filter: 'blur(5px)' },
        { opacity: 0.9, y: 0, filter: 'blur(0px)', duration: 1.3 }, 0)
      .fromTo(hero.querySelector('.bismillah__latin'),
        { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .8 }, 0.6)
      .fromTo(hero.querySelector('.ornament--divider'),
        { opacity: 0, scaleX: 0.3 }, { opacity: .85, scaleX: 1, duration: .9 }, 0.9)
      .fromTo(hero.querySelector('.hero__lead'),
        { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .7 }, 1.15)

      .set('#name-groom', { opacity: 1 }, 1.4)
      .fromTo(hero.querySelector('#name-groom .mask-inner'),
        { yPercent: 112, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.25 }, 1.4)
      .fromTo(hero.querySelectorAll('.couple__meta')[0],
        { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: .6 }, 2.0)

      .fromTo(hero.querySelector('.couple__amp'),
        { opacity: 0, scale: .5 }, { opacity: 1, scale: 1, duration: .8, ease: 'back.out(1.6)' }, 2.25)

      .set('#name-bride', { opacity: 1 }, 2.6)
      .fromTo(hero.querySelector('#name-bride .mask-inner'),
        { yPercent: 112, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.25 }, 2.6)
      .fromTo(hero.querySelectorAll('.couple__meta')[1],
        { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: .6 }, 3.2)

      .fromTo(hero.querySelector('.hero__invite'),
        { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .8 }, 3.45)
      .fromTo(hero.querySelector('.hero__dates'),
        { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .8 }, 3.75)
      .add(function () {
        hero.querySelectorAll('.foil').forEach(function (f) { f.classList.add('is-shimmering'); });
      }, 3.9)
      .fromTo('.scroll-cue', { opacity: 0 }, { opacity: 1, duration: .7 }, 4.1);

    tl.add(decor, 0).add(type, 0.2);
    return tl;
  };

  /* =========================================================
     6 · EVENT SECTIONS
     ========================================================= */
  function initEventSections() {
    document.querySelectorAll('.event').forEach(function (sec) {
      var panel = sec.querySelector('.event__panel');
      var frame = sec.querySelector('.event__frame');
      var motif = sec.querySelector('.event__motif');
      var rule = sec.querySelector('.event__rule');
      var ribbon = sec.querySelector('.ribbon--a');
      var sprigs = sec.querySelectorAll('.sprig--a, .sprig--b');
      var venue = sec.querySelector('.event__venue');
      var pace = sec.classList.contains('event--rukhsati') ? 1.35 : 1;   // rukhsati breathes slower

      /* burgundy curtain wipes off the top of the section */
      var curtain = sec.querySelector('.event__curtain');
      if (curtain) {
        gsap.fromTo(curtain, { scaleY: 1, opacity: 1 }, {
          scaleY: 0, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 40%', scrub: true }
        });
      }

      /* ribbon sweeps across as the section arrives */
      if (ribbon) {
        gsap.fromTo(ribbon,
          { '--pfx': '-160px', opacity: 0 },
          { '--pfx': '0px', opacity: .6, duration: 2.2 * pace, ease: 'power3.out',
            scrollTrigger: { trigger: sec, start: 'top 85%', once: true } });
      }

      /* botanicals grow into place */
      if (sprigs.length) {
        gsap.fromTo(sprigs,
          { opacity: 0, '--pfy': '52px' },
          { opacity: .3, '--pfy': '0px', duration: 2 * pace, stagger: .2, ease: 'power3.out',
            scrollTrigger: { trigger: sec, start: 'top 80%', once: true } });
      }

      /* the panel itself */
      var tl = gsap.timeline({
        scrollTrigger: { trigger: panel, start: 'top 78%', once: true },
        defaults: { ease: 'expo.out' }
      });

      if (panel) tl.fromTo(panel, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.4 * pace }, 0);
      if (frame) tl.fromTo(frame, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 1.6 * pace }, 0.1);
      if (motif) tl.fromTo(motif, { opacity: 0, y: 14, scale: .8 }, { opacity: .75, y: 0, scale: 1, duration: 1.1 * pace }, 0.25);

      var index = panel && panel.querySelector('.event__index');
      var title = panel && panel.querySelector('.event__title .mask-inner');
      var sub = panel && panel.querySelector('.event__subtitle');
      var date = panel && panel.querySelector('.event__date');
      var time = panel && panel.querySelector('.event__time');
      var desc = panel && panel.querySelector('.event__desc');

      if (index) tl.fromTo(index, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9 * pace }, 0.3);
      if (title) {
        tl.set(panel.querySelector('.event__title'), { opacity: 1 }, 0.35);
        tl.fromTo(title, { yPercent: 112, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.5 * pace }, 0.35);
      }
      if (sub) tl.fromTo(sub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.1 * pace }, 0.7);
      if (rule) tl.fromTo(rule, { opacity: 0, scaleX: .3 }, { opacity: .8, scaleX: 1, duration: 1.1 * pace }, 0.8);
      if (date) tl.fromTo(date, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.2 * pace }, 0.95);
      if (time) tl.fromTo(time, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 * pace }, 1.12);
      if (desc) tl.fromTo(desc, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 * pace }, 1.24);
      if (venue) tl.fromTo(venue, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.2 * pace }, 1.36);

      /* gold dust, densest in Shalima */
      var canvas = sec.querySelector('.event__dust');
      if (canvas && WI.env.motion) {
        var base = WI.env.isMobile ? WI.motion.dustMobile : WI.motion.dustDesktop;
        var density = sec.classList.contains('event--shalima') ? 1
                    : sec.classList.contains('event--mehndi') ? 0.7 : 0.32;
        var tint = sec.classList.contains('event--rukhsati') ? [196, 160, 96] : [240, 220, 176];
        GoldDust(canvas, { count: Math.round(base * density), tint: tint, maxR: 1.8, speed: 0.24 });
      }

      /* Shalima deepens as you reach it */
      if (sec.classList.contains('event--shalima')) {
        gsap.fromTo(sec.querySelector('.event__bg'),
          { filter: 'brightness(1.18)' },
          { filter: 'brightness(0.92)', ease: 'none',
            scrollTrigger: { trigger: sec, start: 'top bottom', end: 'center center', scrub: true } });
      }
    });
  }

  /* =========================================================
     7 · TIMELINE DRAW
     ========================================================= */
  function initTimeline() {
    var list = document.getElementById('tl-root');
    if (!list) return;
    var draw = list.querySelector('.tl__draw');
    var items = list.querySelectorAll('.tl__item');

    if (draw) {
      gsap.to(draw, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: list, start: 'top 72%', end: 'bottom 68%', scrub: 0.5 }
      });
    }

    items.forEach(function (item) {
      gsap.fromTo(item, { opacity: 0, x: 24 }, {
        opacity: 1, x: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: item, start: 'top 82%', once: true }
      });
      ST.create({
        trigger: item, start: 'top 70%', end: 'bottom 40%',
        onEnter: function () { item.classList.add('is-on'); },
        onEnterBack: function () { item.classList.add('is-on'); }
      });
    });
  }

  /* =========================================================
     8 · FLOATING EVENT NAV
     ========================================================= */
  function initNavigation() {
    var nav = document.getElementById('evnav');
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('.evnav__link'));
    var pill = nav.querySelector('.evnav__pill');
    var current = null;

    function setActive(id) {
      if (current === id) return;
      current = id;
      links.forEach(function (l) { l.classList.toggle('is-active', l.dataset.nav === id); });
      var active = links.filter(function (l) { return l.dataset.nav === id; })[0];
      if (active && pill) {
        /* measured against the nav's own box so the pill lands exactly
           under the label regardless of padding or font metrics */
        var navRect = nav.getBoundingClientRect();
        var linkRect = active.getBoundingClientRect();
        nav.classList.add('has-active');
        pill.style.width = linkRect.width + 'px';
        pill.style.transform = 'translateX(' + (linkRect.left - navRect.left) + 'px)';
      } else if (pill) {
        nav.classList.remove('has-active');
      }
    }

    (WI.events || []).forEach(function (ev) {
      var sec = document.getElementById(ev.id);
      if (!sec) return;
      ST.create({
        trigger: sec, start: 'top 55%', end: 'bottom 45%',
        onEnter: function () { setActive(ev.id); },
        onEnterBack: function () { setActive(ev.id); },
        onLeave: function () { if (current === ev.id) { current = null; links.forEach(function (l) { l.classList.remove('is-active'); }); nav.classList.remove('has-active'); } },
        onLeaveBack: function () { if (current === ev.id) { current = null; links.forEach(function (l) { l.classList.remove('is-active'); }); nav.classList.remove('has-active'); } }
      });
    });

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(link.getAttribute('href'));
        if (target) WI.scrollTo(target);
      });
    });

    /* the nav appears once the hero is behind you */
    ST.create({
      trigger: '#celebrations', start: 'top 70%',
      onEnter: function () { nav.classList.add('is-in'); },
      onLeaveBack: function () { nav.classList.remove('is-in'); }
    });

    /* On phones the nav sits where a thumb reaches — which is also where
       a VIEW LOCATION button ends up. Tuck it away while the visitor is
       reading downward, bring it straight back the moment they scroll up. */
    if (WI.env.isTouch) {
      var lastY = window.pageYOffset || 0;
      var settle = null;
      window.addEventListener('scroll', function () {
        var y = window.pageYOffset || 0;
        var delta = y - lastY;
        if (Math.abs(delta) < 8) return;
        nav.classList.toggle('is-tucked', delta > 0 && y > 240);
        lastY = y;
        clearTimeout(settle);
        settle = setTimeout(function () { nav.classList.remove('is-tucked'); }, 1400);
      }, { passive: true });
    }

    WI.onResize(function () { var c = current; current = null; if (c) setActive(c); });
  }

  /* =========================================================
     9 · MICRO-INTERACTIONS (desktop)
     ========================================================= */
  function initMicro() {
    if (WI.env.isTouch) return;

    /* cursor glow */
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    var gx = gsap.quickTo(glow, 'x', { duration: 0.75, ease: 'power3.out' });
    var gy = gsap.quickTo(glow, 'y', { duration: 0.75, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) {
      gx(e.clientX); gy(e.clientY);
      gsap.to(glow, { opacity: 1, duration: .6, overwrite: 'auto' });
    }, { passive: true });
    window.addEventListener('pointerleave', function () {
      gsap.to(glow, { opacity: 0, duration: .5 });
    });

    /* Magnetic buttons that also tilt in 3D toward the pointer and lift
       off the page. GSAP owns the transform here, so the whole gesture —
       pull, tilt and lift — has to live in one place; the CSS only
       supplies the bevel and the shadow that sells the height. */
    document.querySelectorAll('.btn-open, .btn-loc').forEach(function (btn) {
      var o = { duration: .5, ease: 'power3.out' };
      var qx = gsap.quickTo(btn, 'x', o), qy = gsap.quickTo(btn, 'y', o);
      var qrx = gsap.quickTo(btn, 'rotationX', o), qry = gsap.quickTo(btn, 'rotationY', o);
      gsap.set(btn, { transformPerspective: 620, transformOrigin: '50% 50%' });

      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        qx(nx * 10); qy(ny * 6 - 4);      /* -4 = the resting lift */
        qry(nx * 8); qrx(-ny * 8);
      });
      btn.addEventListener('pointerleave', function () {
        qx(0); qy(0); qrx(0); qry(0);
      });
      btn.addEventListener('pointerdown', function () {
        gsap.to(btn, { z: -14, duration: .12, ease: 'power2.out' });
      });
      ['pointerup', 'pointerleave'].forEach(function (ev) {
        btn.addEventListener(ev, function () {
          gsap.to(btn, { z: 0, duration: .35, ease: 'power2.out' });
        });
      });
    });

    /* Venue cards tilt as solid tiles, with the gloss shifting across them */
    document.querySelectorAll('.venue-card').forEach(function (card) {
      var gloss = card.querySelector('.btn-loc');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        gsap.to(card, {
          rotationY: nx * 5, rotationX: -ny * 5, y: -8, z: 30,
          duration: .6, ease: 'power3.out', transformPerspective: 1000
        });
        if (gloss) gsap.to(gloss, { z: 22, duration: .6, ease: 'power3.out' });
      });
      card.addEventListener('pointerleave', function () {
        gsap.to(card, { rotationY: 0, rotationX: 0, y: 0, z: 0, duration: .8, ease: 'power3.out' });
        if (gloss) gsap.to(gloss, { z: 0, duration: .8, ease: 'power3.out' });
      });
    });
  }

  /* =========================================================
     10 · SECTION REVEALS + FINALE
     ========================================================= */
  function initSectionReveals() {
    ['#celebrations', '#countdown', '#timeline', '#venues', '#closing', '#finale']
      .forEach(function (sel) {
        var sec = document.querySelector(sel);
        if (sec) buildReveals(sec, 0.16);
      });

    document.querySelectorAll('#celebrations .foil, #countdown .foil, #venues .foil, #finale .foil')
      .forEach(function (f) {
        ST.create({ trigger: f, start: 'top 80%', once: true,
          onEnter: function () { f.classList.add('is-shimmering'); } });
      });

    /* finale: the frame closes in, dust thickens */
    var finale = document.getElementById('finale');
    if (finale) {
      gsap.fromTo(finale.querySelector('.finale__frame'),
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 2, ease: 'expo.out',
          scrollTrigger: { trigger: finale, start: 'top 75%', once: true } });

      /* opacity only — these corners carry their own mirror transforms */
      gsap.fromTo(finale.querySelectorAll('.finale__frame .corner'),
        { opacity: 0 },
        { opacity: .75, duration: 1.4, stagger: .12, ease: 'power2.out',
          scrollTrigger: { trigger: finale, start: 'top 70%', once: true } });

      gsap.fromTo(finale.querySelector('.finale__seal'),
        { opacity: 0, scale: .7, rotate: -12 },
        { opacity: 1, scale: 1, rotate: 0, duration: 1.8, ease: 'expo.out',
          scrollTrigger: { trigger: finale.querySelector('.finale__seal'), start: 'top 88%', once: true } });

      var canvas = finale.querySelector('.finale__dust');
      if (canvas && WI.env.motion) {
        GoldDust(canvas, {
          count: WI.env.isMobile ? WI.motion.dustMobile : WI.motion.dustDesktop,
          tint: [240, 220, 176], maxR: 2.1, speed: 0.2
        });
      }
    }
  }

  /* =========================================================
     11 · GLOBAL DUST
     ========================================================= */
  function initGlobalDust() {
    if (!WI.env.motion) return;
    var canvas = document.getElementById('dust-global');
    if (!canvas) return;
    GoldDust(canvas, {
      count: Math.round((WI.env.isMobile ? WI.motion.dustMobile : WI.motion.dustDesktop) * 0.45),
      tint: [190, 152, 78], maxR: 1.4, speed: 0.14
    });
  }

  /* =========================================================
     PUBLIC ENTRY POINTS
     ========================================================= */
  WI.animations = {
    prepare: function () { wrapMasks(); },

    init: function () {
      gsap = window.gsap;
      ST = window.ScrollTrigger;
      if (!gsap || !ST) return false;

      gsap.registerPlugin(ST);
      gsap.defaults({ ease: WI.motion.ease });

      initGlobalDust();
      initParallax();
      initHero();
      initEventSections();
      initSectionReveals();
      initTimeline();
      initNavigation();
      initMicro();

      ST.refresh();
      return true;
    },

    /** Static fallback when GSAP is unavailable or motion is reduced. */
    staticFallback: function () {
      document.documentElement.classList.remove('has-motion');
      var nav = document.getElementById('evnav');
      if (nav) nav.classList.add('is-in');
      document.querySelectorAll('.tl__item').forEach(function (i) { i.classList.add('is-on'); });
      var draw = document.querySelector('.tl__draw');
      if (draw) draw.style.transform = 'scaleY(1)';
      document.querySelectorAll('.evnav__link').forEach(function (l) {
        l.addEventListener('click', function () { /* native anchor jump */ });
      });
    }
  };

})(window.WI = window.WI || {});
