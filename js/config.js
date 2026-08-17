/* =============================================================
   config.js — THE ONLY FILE YOU NEED TO EDIT FOR CONTENT
   -------------------------------------------------------------
   Names, dates, venues, Google Maps links, audio and the 3D PNG
   asset registry all live here. Nothing below this file needs to
   change when you swap a venue, a time, or a map URL.
   ============================================================= */

window.WI = window.WI || {};

/* -------------------------------------------------------------
   1 · COUPLE
   ------------------------------------------------------------- */
WI.couple = {
  groom: { name: 'Syed Meezab E Rehmat Ali Hyderi', parent: 'S/O Syed Mazher Ali Hyderi', short: 'Meezab' },
  bride: { name: 'Dua Sarwar',                      parent: 'D/O Late Ghulam Sarwar',     short: 'Dua'    },
  monogram: { left: 'M', right: 'D' }
};

/* -------------------------------------------------------------
   2 · EVENTS
   -------------------------------------------------------------
   locationUrl : leave "" to hide the VIEW LOCATION button entirely.
                 Paste the real Google Maps share link here later —
                 nothing else has to change.
   address     : leave "" if unknown. Nothing is invented for you.
   theme       : 'mehndi' | 'rukhsati' | 'shalima'  (visual identity)
   iso         : machine-readable start time, used by <time> + timeline
   ------------------------------------------------------------- */
WI.events = [
  {
    id: 'mehndi',
    index: 'Event One',
    title: 'Mehndi',
    subtitle: 'A Night of Celebration & Qawwali',
    date: '29 August 2026',
    dateShort: '29 Aug',
    day: '29',
    month: 'August',
    iso: '2026-08-29T20:00:00+05:00',
    time: '8:00 PM onwards',
    description: 'Qawwali Night till 3:00 – 4:00 AM',
    venue: 'Mid Wicket Indoor Ground',
    address: '',
    // TEMPORARY search link — replace with the exact Google Maps URL.
    locationUrl: 'https://www.google.com/maps/search/?api=1&query=Mid+Wicket+Indoor+Ground',
    mapLabel: 'View Location',
    theme: 'mehndi',
    motif: 'i-qawwali'
  },
  {
    id: 'rukhsati',
    index: 'Event Two',
    title: 'Rukhsati',
    subtitle: 'A Beautiful Beginning',
    date: '1 September 2026',
    dateShort: '01 Sep',
    day: '01',
    month: 'September',
    iso: '2026-09-01T19:00:00+05:00',
    time: '7:00 PM onwards',
    description: '',
    venue: "Bride's Home",
    address: '',
    // TEMPORARY search link — replace with the exact Google Maps URL.
    locationUrl: 'https://www.google.com/maps/search/?api=1&query=Bride+Home',
    mapLabel: 'View Location',
    theme: 'rukhsati',
    motif: 'i-bloom'
  },
  {
    id: 'shalima',
    index: 'Event Three',
    title: 'Shalima',
    subtitle: 'An Evening of Elegance & Celebration',
    date: '3 September 2026',
    dateShort: '03 Sep',
    day: '03',
    month: 'September',
    iso: '2026-09-03T19:30:00+05:00',
    time: '7:30 PM onwards',
    description: '',
    venue: 'ZS Royal Banquet',
    address: '',
    // TEMPORARY search link — replace with the exact Google Maps URL.
    locationUrl: 'https://www.google.com/maps/search/?api=1&query=ZS+Royal+Banquet',
    mapLabel: 'View Location',
    theme: 'shalima',
    motif: 'i-wreath'
  }
];

/* -------------------------------------------------------------
   3 · COUNTDOWN
   Counts to the Mehndi. +05:00 = Pakistan Standard Time, so the
   countdown is correct for guests in any timezone.
   ------------------------------------------------------------- */
WI.countdown = {
  target: '2026-08-29T20:00:00+05:00',
  caption: 'Until the Mehndi · 29 August 2026, 8:00 PM',
  finishedMessage: 'The celebrations have begun.'
};

/* -------------------------------------------------------------
   4 · AUDIO  (optional)
   Drop an mp3 into assets/audio/ and put its path in `src`.
   While `src` is "" the music button stays hidden — no broken
   player, no console errors.
   ------------------------------------------------------------- */
WI.audio = {
  src: '',                       // e.g. 'assets/audio/ambient.mp3'
  volume: 0.35,
  fadeSeconds: 1.6
};

/* -------------------------------------------------------------
   5 · 3D PNG ASSET REGISTRY
   -------------------------------------------------------------
   HOW TO ADD A PNG (three steps, no code changes anywhere else):

     1. Drop the file into  assets/3d/   (or /flowers, /ribbons)
     2. Find its entry below — or copy one and edit it
     3. Set  enabled: true

   Entries stay `enabled: false` until the file actually exists so
   the page never requests a missing image.

   FIELDS
     src        path to the PNG
     layer      which section it belongs to. Must match a
                data-asset-layer="…" in index.html:
                hero · celebrations · mehndi · rukhsati · shalima
                countdown · venues · closing · finale
     position   { top,right,bottom,left } — any CSS length, e.g. '8%'
                or 'calc(50% - 120px)'. Omit what you don't need.
     width      CSS width of the asset, e.g. '220px' or '28vw'
     animation  'slide-left' | 'slide-right' | 'rise' | 'drop'
                | 'reveal-rotate' | 'fade' | 'none'
     float      true  → adds an endless subtle bob + sway
     speed      parallax strength, 0 = pinned to page, 1 = very fast
     rotation   resting rotation in degrees
     scale      resting scale multiplier
     opacity    resting opacity
     depth      z-index within its layer (higher = in front)
     hover      true → follows the pointer a few px on desktop
     mobile     false → the asset is skipped entirely on phones
     alt        '' keeps it decorative (correct for ornaments)
   ------------------------------------------------------------- */
WI.assets3d = [
  {
    enabled: false,
    src: 'assets/ribbons/ribbon.png',
    layer: 'hero',
    position: { top: '4%', left: '-12%' },
    width: '46vw',
    animation: 'slide-left',
    float: true, speed: 0.30, rotation: -6, scale: 1, opacity: 0.95,
    depth: 2, hover: false, mobile: true, alt: ''
  },
  {
    enabled: false,
    src: 'assets/3d/ring.png',
    layer: 'hero',
    position: { bottom: '10%', right: '4%' },
    width: '180px',
    animation: 'reveal-rotate',
    float: true, speed: 0.45, rotation: 10, scale: 1, opacity: 1,
    depth: 3, hover: true, mobile: false, alt: ''
  },
  {
    enabled: false,
    src: 'assets/flowers/flowers.png',
    layer: 'mehndi',
    position: { bottom: '-6%', left: '-8%' },
    width: '38vw',
    animation: 'rise',
    float: true, speed: 0.18, rotation: 0, scale: 1, opacity: 0.9,
    depth: 1, hover: false, mobile: true, alt: ''
  },
  {
    enabled: false,
    src: 'assets/3d/perfume.png',
    layer: 'rukhsati',
    position: { top: '18%', right: '-4%' },
    width: '200px',
    animation: 'slide-right',
    float: true, speed: 0.40, rotation: 8, scale: 1, opacity: 1,
    depth: 2, hover: true, mobile: false, alt: ''
  },
  {
    enabled: false,
    src: 'assets/3d/wedding-object-01.png',
    layer: 'shalima',
    position: { top: '10%', left: '-6%' },
    width: '32vw',
    animation: 'slide-left',
    float: true, speed: 0.35, rotation: -10, scale: 1, opacity: 1,
    depth: 2, hover: false, mobile: true, alt: ''
  },
  {
    enabled: false,
    src: 'assets/3d/wedding-object-02.png',
    layer: 'finale',
    position: { bottom: '6%', right: '-4%' },
    width: '26vw',
    animation: 'drop',
    float: true, speed: 0.30, rotation: 6, scale: 1, opacity: 0.95,
    depth: 2, hover: false, mobile: true, alt: ''
  }
];

/* -------------------------------------------------------------
   6 · MOTION TUNING
   ------------------------------------------------------------- */
WI.motion = {
  ease: 'power3.out',
  easeSoft: 'power2.out',
  easeCinematic: 'expo.out',
  dustDesktop: 70,     // particle counts — lowered automatically on phones
  dustMobile: 26,
  parallaxMobileFactor: 0.45
};
