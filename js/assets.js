/* =============================================================
   assets.js — THE 3D PNG ASSET ENGINE
   -------------------------------------------------------------
   Reads WI.assets3d from config.js and turns each entry into a
   positioned, parallaxed, animated <img>. Adding a PNG later is
   a config edit only — nothing in this file needs to change.

   Pipeline per asset:
     position → entrance → float → parallax → hover → depth
   ============================================================= */

(function (WI) {
  'use strict';

  var registry = [];   // live asset instances

  /* ---------- entrance presets ------------------------------
     Each returns the "from" state; GSAP tweens to the resting
     values that come out of the asset's own config.
     ---------------------------------------------------------- */
  var ENTRANCES = {
    'slide-left':    function (a) { return { xPercent: -60, opacity: 0, rotate: a.rotation - 15 }; },
    'slide-right':   function (a) { return { xPercent:  60, opacity: 0, rotate: a.rotation + 15 }; },
    'rise':          function (a) { return { yPercent:  35, opacity: 0, scale: a.scale * 0.92, rotate: a.rotation }; },
    'drop':          function (a) { return { yPercent: -35, opacity: 0, scale: a.scale * 0.94, rotate: a.rotation }; },
    'reveal-rotate': function (a) { return { opacity: 0, scale: a.scale * 0.72, rotate: a.rotation - 28 }; },
    'fade':          function (a) { return { opacity: 0, scale: a.scale * 0.98, rotate: a.rotation }; },
    'none':          function (a) { return { opacity: a.opacity, rotate: a.rotation, scale: a.scale }; }
  };

  var DEFAULTS = {
    enabled: false, src: '', layer: 'hero', position: {}, width: '220px',
    animation: 'fade', float: false, speed: 0.25, rotation: 0, scale: 1,
    opacity: 1, depth: 2, hover: false, mobile: true, alt: ''
  };

  function merge(cfg) {
    var out = {}, k;
    for (k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) out[k] = DEFAULTS[k];
    for (k in cfg) if (Object.prototype.hasOwnProperty.call(cfg, k)) out[k] = cfg[k];
    return out;
  }

  /* ---------- build one asset element ----------------------- */
  function build(cfg) {
    var a = merge(cfg);
    if (!a.enabled || !a.src) return null;
    if (!a.mobile && WI.env.isMobile) return null;

    var layer = document.querySelector('[data-asset-layer="' + a.layer + '"]');
    if (!layer) {
      console.warn('[WI] No asset layer named "' + a.layer + '" — skipping ' + a.src);
      return null;
    }

    var img = document.createElement('img');
    img.className = 'asset-3d';
    img.src = a.src;
    img.alt = a.alt || '';
    if (!a.alt) img.setAttribute('aria-hidden', 'true');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.dataset.anim = a.animation;
    img.dataset.hover = String(a.hover);

    img.style.width = a.width;
    img.style.zIndex = String(a.depth);
    ['top', 'right', 'bottom', 'left'].forEach(function (side) {
      if (a.position && a.position[side] != null) img.style[side] = a.position[side];
    });

    // A missing file must never leave a broken icon on the page.
    img.addEventListener('error', function () {
      if (img.parentNode) img.parentNode.removeChild(img);
      console.warn('[WI] Asset not found, removed from page: ' + a.src);
    });

    layer.appendChild(img);
    return { el: img, cfg: a };
  }

  /* ---------- animate one asset ----------------------------- */
  function animate(item) {
    var el = item.el, a = item.cfg;
    var gsap = window.gsap;

    if (!gsap || !WI.env.motion) {
      el.style.opacity = a.opacity;
      el.style.transform = 'rotate(' + a.rotation + 'deg) scale(' + a.scale + ')';
      return;
    }

    var from = (ENTRANCES[a.animation] || ENTRANCES.fade)(a);
    var to = {
      xPercent: 0, yPercent: 0,
      opacity: a.opacity, rotate: a.rotation, scale: a.scale,
      duration: 1.5, ease: WI.motion.easeCinematic, overwrite: 'auto'
    };

    gsap.set(el, from);

    if (window.ScrollTrigger) {
      to.scrollTrigger = { trigger: el.closest('section, header') || el, start: 'top 82%', once: true };
    }
    gsap.to(el, to);

    /* endless float — applied to a wrapper property so it never
       fights the entrance or the parallax transform */
    if (a.float) {
      var amp = WI.env.isMobile ? 8 : 14;
      gsap.to(el, {
        y: '-=' + amp,
        rotate: a.rotation + 2,
        duration: 4.5 + Math.random() * 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.6
      });
    }

    /* scroll parallax */
    if (a.speed > 0 && window.ScrollTrigger) {
      var strength = a.speed * (WI.env.isMobile ? WI.motion.parallaxMobileFactor : 1);
      gsap.to(el, {
        yPercent: -strength * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section, header') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    /* pointer depth — desktop only */
    if (a.hover && !WI.env.isTouch) {
      var quickX = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' });
      var quickY = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' });
      WI.pointer.subscribe(function (nx, ny) {
        quickX(nx * 26 * a.speed * 2);
        quickY(ny * 20 * a.speed * 2);
      });
    }
  }

  /* ---------- public API ------------------------------------ */
  WI.assets = {
    /** Build + animate everything in WI.assets3d. */
    init: function () {
      (WI.assets3d || []).forEach(function (cfg) {
        var item = build(cfg);
        if (item) { registry.push(item); animate(item); }
      });
      return registry.length;
    },

    /** Add one asset at runtime (handy while positioning a new PNG). */
    add: function (cfg) {
      var item = build(cfg);
      if (item) { registry.push(item); animate(item); }
      return item;
    },

    /** Everything currently on the page. */
    all: function () { return registry.slice(); },

    /** Available entrance names, for reference. */
    entrances: Object.keys(ENTRANCES)
  };

})(window.WI = window.WI || {});
