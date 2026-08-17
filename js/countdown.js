/* =============================================================
   countdown.js — luxury countdown to the Mehndi
   -------------------------------------------------------------
   Ticks once per second on a single interval, writes only when a
   digit actually changes, and swaps to the closing message once
   the date has passed.
   ============================================================= */

(function (WI) {
  'use strict';

  var timer = null;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  WI.countdownInit = function () {
    var cfg = WI.countdown || {};
    var clock = document.getElementById('clock');
    var done = document.getElementById('clock-done');
    var caption = document.getElementById('clock-target');
    if (!clock) return;

    var target = new Date(cfg.target).getTime();
    if (isNaN(target)) {
      console.warn('[WI] Invalid countdown target: ' + cfg.target);
      return;
    }

    if (caption && cfg.caption) caption.textContent = cfg.caption;

    var fields = {};
    ['days', 'hours', 'minutes', 'seconds'].forEach(function (k) {
      fields[k] = clock.querySelector('[data-cd="' + k + '"]');
    });
    var last = {};

    function write(key, value) {
      if (last[key] === value) return;
      last[key] = value;
      if (fields[key]) fields[key].textContent = value;
    }

    function finish() {
      if (timer) { clearInterval(timer); timer = null; }
      clock.hidden = true;
      if (caption) caption.hidden = true;
      if (done) {
        done.hidden = false;
        done.textContent = cfg.finishedMessage || 'The celebrations have begun.';
        if (window.gsap && WI.env && WI.env.motion) {
          window.gsap.fromTo(done, { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' });
        }
      }
    }

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) { finish(); return; }

      var s = Math.floor(diff / 1000);
      write('days', pad(Math.floor(s / 86400)));
      write('hours', pad(Math.floor(s / 3600) % 24));
      write('minutes', pad(Math.floor(s / 60) % 60));
      write('seconds', pad(s % 60));
    }

    tick();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);

    /* Stop ticking while the tab is hidden; resync on return. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (timer) { clearInterval(timer); timer = null; }
      } else if (!timer && !clock.hidden) {
        tick();
        timer = setInterval(tick, 1000);
      }
    });
  };

})(window.WI = window.WI || {});
