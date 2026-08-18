/* =============================================================
   animations.js — the ambient motion
   -------------------------------------------------------------
   Gold dust, the drifting ornaments, text-mask preparation and the
   desktop micro-interactions.

   Screen entrances live in screens.js; this file no longer owns any
   scroll-driven work, because the invitation is now five fixed
   screens rather than one long page. ScrollTrigger and Lenis are
   gone with it.
   ============================================================= */

(function (WI) {
  'use strict';

  var gsap;

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

    resize(); seed(); start();

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    WI.onResize(function () { resize(); seed(); });

    return { start: start, stop: stop };
  }
  WI.GoldDust = GoldDust;

  /* =========================================================
     1b Â· PETAL RAIN
     ---------------------------------------------------------
     A light mehndi-style shower: petals and leaves drift down the
     screen, with enough variation to feel handmade but not noisy.
     ========================================================= */
  function PetalRain() {
    if (!WI.env.motion) return null;

    var canvas = document.createElement('canvas');
    canvas.className = 'petal-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    var dpr = Math.min(window.devicePixelRatio || 1, WI.env.isMobile ? 1.4 : 2);
    var w = 0, h = 0, parts = [], raf = null, running = false;
    var count = WI.env.isMobile ? 9 : 16;
    var palette = [
      { deep: [134, 0, 38], mid: [221, 14, 75], pale: [255, 205, 188] },
      { deep: [158, 0, 46], mid: [238, 38, 94], pale: [255, 222, 204] },
      { deep: [112, 0, 34], mid: [196, 10, 63], pale: [255, 190, 178] },
      { deep: [185, 8, 59], mid: [246, 60, 111], pale: [255, 232, 212] }
    ];

    function resize() {
      w = window.innerWidth || 1;
      h = window.innerHeight || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makePetal(y) {
      var c = palette[Math.floor(Math.random() * palette.length)];
      return {
        x: Math.random() * w,
        y: y == null ? -40 - Math.random() * h : y,
        r: 9 + Math.random() * (WI.env.isMobile ? 10 : 15),
        vx: (Math.random() - 0.5) * 0.22,
        vy: 0.18 + Math.random() * (WI.env.isMobile ? 0.34 : 0.48),
        sway: 12 + Math.random() * 24,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.025,
        rot: Math.random() * Math.PI * 2,
        color: c,
        alpha: 0.24 + Math.random() * 0.22,
        flip: Math.random() > 0.5 ? 1 : -1,
        curl: 0.78 + Math.random() * 0.45,
        squash: 0.72 + Math.random() * 0.36
      };
    }

    function seed() {
      parts.length = 0;
      for (var i = 0; i < count; i++) parts.push(makePetal(Math.random() * h));
    }

    function drawPetal(p) {
      var wobble = Math.sin(p.phase) * p.sway;
      var x = p.x + wobble;
      var deep = p.color.deep;
      var mid = p.color.mid;
      var pale = p.color.pale;
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.scale(p.flip * p.curl, p.squash);

      var grad = ctx.createRadialGradient(-p.r * .32, p.r * .72, p.r * .06, p.r * .1, -p.r * .08, p.r * 1.75);
      grad.addColorStop(0, 'rgba(' + pale[0] + ',' + pale[1] + ',' + pale[2] + ',.98)');
      grad.addColorStop(.22, 'rgba(' + mid[0] + ',' + mid[1] + ',' + mid[2] + ',.94)');
      grad.addColorStop(.68, 'rgba(' + deep[0] + ',' + deep[1] + ',' + deep[2] + ',.92)');
      grad.addColorStop(1, 'rgba(58,0,21,.72)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(-p.r * .98, -p.r * .42);
      ctx.bezierCurveTo(-p.r * .56, -p.r * 1.34, p.r * .48, -p.r * 1.28, p.r * .98, -p.r * .5);
      ctx.bezierCurveTo(p.r * 1.26, -p.r * .08, p.r * 1.18, p.r * .58, p.r * .38, p.r * 1.25);
      ctx.bezierCurveTo(-p.r * .1, p.r * 1.64, -p.r * 1.2, p.r * .78, -p.r * 1.08, p.r * .08);
      ctx.bezierCurveTo(-p.r * 1.06, -p.r * .12, -p.r * 1.08, -p.r * .28, -p.r * .98, -p.r * .42);
      ctx.fill();

      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = p.alpha * .18;
      ctx.strokeStyle = 'rgba(255,240,224,1)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-p.r * .68, -p.r * .12);
      ctx.bezierCurveTo(-p.r * .2, p.r * .05, p.r * .12, p.r * .45, p.r * .2, p.r * 1.02);
      ctx.stroke();

      ctx.globalAlpha = p.alpha * .22;
      ctx.fillStyle = 'rgba(255,248,232,1)';
      ctx.beginPath();
      ctx.ellipse(-p.r * .23, p.r * .62, p.r * .5, p.r * .2, -.4, 0, 6.2832);
      ctx.fill();

      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = p.alpha * .2;
      ctx.fillStyle = 'rgba(80,0,30,1)';
      ctx.beginPath();
      ctx.ellipse(p.r * .42, -p.r * .18, p.r * .42, p.r * .14, .85, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y += p.vy;
        p.x += p.vx;
        p.phase += 0.015 + p.vy * 0.012;
        p.rot += p.spin;
        if (p.y > h + 44 || p.x < -90 || p.x > w + 90) parts[i] = makePetal();
        else drawPetal(p);
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    resize(); seed(); start();
    WI.onResize(function () { resize(); seed(); });
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    return { start: start, stop: stop };
  }

  function initScrollBlooms() {
    if (!WI.env.motion) return;

    var layer = document.createElement('div');
    layer.className = 'ceremony-blooms';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = [
      '<svg class="ceremony-bloom"><use href="#i-bloom"></use></svg>',
      '<svg class="ceremony-bloom ceremony-bloom--leaf"><use href="#i-sprig"></use></svg>',
      '<svg class="ceremony-bloom"><use href="#i-bloom"></use></svg>',
      '<svg class="ceremony-bloom ceremony-bloom--leaf"><use href="#i-sprig"></use></svg>',
      '<svg class="ceremony-bloom"><use href="#i-bloom"></use></svg>'
    ].join('');
    document.body.appendChild(layer);

    var blooms = Array.prototype.slice.call(layer.children);
    var ticking = false;

    function activeScreen() {
      return document.querySelector('.screen.is-active');
    }

    function update() {
      ticking = false;
      var sec = activeScreen();
      var max = sec ? Math.max(1, sec.scrollHeight - sec.clientHeight) : 1;
      var p = sec ? Math.max(0, Math.min(1, sec.scrollTop / max)) : 0;
      var mid = Math.sin(p * Math.PI);

      blooms.forEach(function (el, i) {
        var side = i % 2 ? -1 : 1;
        var depth = (i + 1) * 18;
        el.style.setProperty('--cb-x', (side * (p * (26 + i * 9) + mid * 12)) + 'px');
        el.style.setProperty('--cb-y', ((p - 0.5) * (90 + i * 24)) + 'px');
        el.style.setProperty('--cb-z', (mid * depth) + 'px');
        el.style.setProperty('--cb-rx', (p * 42 + i * 8) + 'deg');
        el.style.setProperty('--cb-ry', (side * (p * 55 + 12)) + 'deg');
        el.style.setProperty('--cb-r', (side * (p * 110 + i * 24)) + 'deg');
        el.style.setProperty('--cb-s', (0.86 + mid * 0.28) .toFixed(3));
      });
    }

    function requestUpdate() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    document.addEventListener('scroll', requestUpdate, true);
    WI.onResize(requestUpdate);
    setInterval(requestUpdate, 900);
    update();
  }

  /* =========================================================
     2 · TEXT MASK WRAPPING
     Every [data-reveal="mask"] gets an inner span so the reveal in
     screens.js can slide it up from behind a clipped edge.
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
     3 · DRIFTING ORNAMENTS
     -------------------------------------------------------------
     The branches and ribbons used to move with the page scroll.
     With fixed screens there is no scroll to read, so they simply
     breathe instead — on --pfy, which each ornament's transform
     already composes (see --plxT in style.css).
     ========================================================= */
  function initDrift() {
    if (!gsap || !WI.env.motion) return;
    document.querySelectorAll('.sprig, .ribbon, .bloom, .arch').forEach(function (el) {
      el.classList.remove('float-slow', 'float-slower');
      gsap.to(el, {
        '--pfy': (WI.env.isMobile ? -7 : -13) + 'px',
        duration: 5 + Math.random() * 4,
        ease: 'sine.inOut',
        yoyo: true, repeat: -1, delay: Math.random() * 2
      });
    });
  }

  /* =========================================================
     4 · MICRO-INTERACTIONS (desktop only)
     ========================================================= */
  function initMicro() {
    if (WI.env.isTouch || !gsap) return;

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

    /* Buttons pull toward the cursor, tilt in perspective and press
       back in z. GSAP owns the whole transform, so the lift lives
       here rather than in CSS. */
    bindMagnetic(document.querySelectorAll('.btn-loc'));
  }

  function initTextLux() {
    if (!gsap || !WI.env.motion) return;
    document.querySelectorAll('.event__panel, .pin').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        gsap.to(el, { y: -4, duration: .45, ease: 'power3.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { y: 0, duration: .55, ease: 'power3.out', overwrite: 'auto' });
      });
    });
  }

  function bindMagnetic(list) {
    list.forEach(function (btn) {
      if (btn.dataset.magnetic) return;
      btn.dataset.magnetic = '1';
      var o = { duration: .5, ease: 'power3.out' };
      var qx = gsap.quickTo(btn, 'x', o), qy = gsap.quickTo(btn, 'y', o);
      var qrx = gsap.quickTo(btn, 'rotationX', o), qry = gsap.quickTo(btn, 'rotationY', o);
      gsap.set(btn, { transformPerspective: 620, transformOrigin: '50% 50%' });

      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        qx(nx * 10); qy(ny * 6 - 4);
        qry(nx * 8); qrx(-ny * 8);
      });
      btn.addEventListener('pointerleave', function () { qx(0); qy(0); qrx(0); qry(0); });
      btn.addEventListener('pointerdown', function () {
        gsap.to(btn, { z: -14, duration: .12, ease: 'power2.out' });
      });
      ['pointerup', 'pointerleave'].forEach(function (ev) {
        btn.addEventListener(ev, function () {
          gsap.to(btn, { z: 0, duration: .35, ease: 'power2.out' });
        });
      });
    });
  }

  /* =========================================================
     PUBLIC ENTRY POINTS
     ========================================================= */
  WI.animations = {
    prepare: function () { wrapMasks(); },

    init: function () {
      gsap = window.gsap;
      if (!gsap) return false;
      gsap.defaults({ ease: (WI.motion && WI.motion.ease) || 'power3.out' });

      if (WI.env.motion) {
        GoldDust(document.getElementById('dust-global'), {
          count: WI.env.isMobile ? 14 : 34,
          tint: [190, 152, 78], maxR: 1.4, speed: 0.14
        });
        PetalRain();
        initScrollBlooms();
      }
      initDrift();
      initMicro();
      initTextLux();
      return true;
    },

    /** Static fallback when GSAP is unavailable or motion is reduced. */
    staticFallback: function () {
      document.documentElement.classList.remove('has-motion');
      document.querySelectorAll('.screen__body').forEach(function (b) {
        b.classList.add('is-revealed');
      });
      document.querySelectorAll('[data-film]').forEach(function (f) {
        f.classList.add('is-gone');
      });
    }
  };

})(window.WI = window.WI || {});
