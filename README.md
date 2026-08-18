# Meezab & Dua — Wedding Invitation

A screen-based, app-like wedding invitation. Plain HTML, CSS and JavaScript —
open `index.html` and it runs. No build step, no framework, no install.

```
Syed Meezab E Rehmat Ali Hyderi   &   Dua Sarwar
S/O Syed Mazher Ali Hyderi            D/O Late Ghulam Sarwar
```

| Event    | Date             | Time            | Venue                    |
|----------|------------------|-----------------|--------------------------|
| Mehndi   | 29 August 2026   | 8:00 PM onwards | Mid Wicket Indoor Ground |
| Rukhsati | 1 September 2026 | 7:00 PM onwards | Bride's Home             |
| Shalima  | 3 September 2026 | 7:30 PM onwards | ZS Royal Banquet         |

---

## How it works

Five screens, one visible at a time, with a permanent bar along the bottom:

**Home · Mehndi · Rukhsati · Shalima · Locations**

Opening a screen plays its own short film — **every time**, including on the
way back. When the film ends the screen scrolls itself down to the text, which
animates in. The guest can scroll back up to watch the film again at any point.

All five screens share **one theme**: the ivory paper of the Home screen. The
three events used to have separate grounds (burgundy, ivory, deep burgundy);
tapping between them now feels like turning pages of one card rather than
jumping between three designs.

Home also carries the countdown, below the names.

Locations is different: its film loops quietly as a blurred backdrop behind
three pins, one per event, each opening Google Maps.

`…/index.html#shalima` opens straight to that screen — handy when one family is
sent one event.

---

## Quick start

Double-click `index.html`, or in VS Code right-click it → **Open with Live
Server**. Both work: the site uses classic `<script>` tags rather than ES
modules, so it also runs straight from the file system.

---

## The only file you need to edit: `js/config.js`

Names, dates, venues, map links, the films and the music all live there.

### Replacing the Google Maps links

The three `locationUrl` values are **temporary search links**. Open the venue in
Google Maps → **Share** → copy the link, and paste it in:

```js
locationUrl: 'https://maps.app.goo.gl/YOUR-REAL-LINK'
```

That is the whole change. Nothing in `index.html` hard-codes a venue, a time or
a map link — the event screens and the pins are both generated from
`WI.events`.

* `locationUrl: ''` → the **VIEW LOCATION** button is not rendered at all.
* `address: ''` → no address line. Nothing is ever invented.

### The films

```js
WI.screens = {
  home:      { video: 'assets/video/home.mp4',      poster: '…', preload: true },
  mehndi:    { video: 'assets/video/mehndi.mp4',    poster: '…' },
  rukhsati:  { video: 'assets/video/rukhsati.mp4',  poster: '…' },
  shalima:   { video: 'assets/video/shalima.mp4',   poster: '…' },
  locations: { video: 'assets/video/locations.mp4', poster: '…', loop: true }
};
```

Set any `video` to `''` and that screen simply shows its text — no blank frame,
no error. The same happens automatically if a file is missing, the codec is
refused, or autoplay is blocked.

The film is a full-height block at the **top** of each screen, with the text
below it in normal flow. That is what makes "play, then scroll down" literal —
and it is why scrolling back up replays nothing, it just shows the film again.

Only **home** preloads. The rest download the first time a guest opens that
screen, then quietly prefetch in the background, so the QR link opens fast on
mobile data.

**Two things browsers decide, not us:**

- Every film is **muted**. No browser autoplays video with sound; that is a
  hard rule, not a setting. All five had their audio stripped at encode time.
- The **music waits for the guest's first tap** — anywhere on the screen
  counts. See below.

### Music

```js
WI.audio = { src: 'assets/audio/music.mp3', volume: 0.32, fadeSeconds: 2.2, loop: true };
```

It tries to start on load, is refused (as every browser will), and then starts
on the first tap. The ♪ button in the corner turns it off. Set `src: ''` and
both the music and its button disappear.

On an iPhone the physical silent switch still wins — nothing a web page can do
changes that.

### Re-encoding a film

Drop the raw file anywhere and run it through ffmpeg:

```
ffmpeg -i source.mp4 -an -c:v libx264 -crf 25 -preset slow \
       -profile:v main -level 3.1 -pix_fmt yuv420p -movflags +faststart out.mp4
ffmpeg -ss 0 -i out.mp4 -frames:v 1 -q:v 4 out.jpg
```

H.264 MP4 plays on every phone, so no second format is needed. Originals are
kept in `assets/video/source/`. Current sizes: 19 MB → 1.57 MB (home), and
under 1 MB each for the rest.

The locations film additionally has a blur and darkening **baked in**
(`gblur=sigma=22,eq=brightness=-0.16:saturation=0.55`), so its text is
unreadable behind the pins. Baking it in is far cheaper than a CSS blur running
every frame on a phone.

---

## Adding your 3D PNG assets

Drop the file in, flip one flag.

**1.** Put the PNG in `assets/3d/`, `assets/flowers/` or `assets/ribbons/`.

**2.** In `js/config.js`, find the entry in `WI.assets3d` (or copy one), point
`src` at your file, and set `enabled: true`:

```js
{
  enabled: true,
  src: 'assets/3d/ring.png',
  layer: 'home',                       // a screen id
  position: { bottom: '10%', right: '4%' },
  width: '180px',
  animation: 'reveal-rotate',
  float: true, speed: 0.45, rotation: 10, scale: 1, opacity: 1,
  depth: 3, hover: true, mobile: false, alt: ''
}
```

`layer` matches a screen id — `home`, `mehndi`, `rukhsati`, `shalima`,
`locations`. Entries ship `enabled: false` so the page never requests a file
that isn't there.

| Field | What it does |
|---|---|
| `position` | Any of `top`/`right`/`bottom`/`left`, any CSS length |
| `animation` | `slide-left`, `slide-right`, `rise`, `drop`, `reveal-rotate`, `fade`, `none` |
| `float` | `true` adds an endless subtle bob and sway |
| `speed` | Drift strength |
| `rotation` / `scale` / `opacity` | Resting values |
| `depth` | z-index within its layer |
| `hover` | `true` = follows the pointer a few px (desktop only) |
| `mobile` | `false` = skipped entirely on phones |

---

## Project structure

```
wedding-invitation/
├── index.html          five screens + the inline SVG ornament library
├── css/
│   ├── style.css       tokens, typography, screen layout, components
│   ├── depth.css       the 3D / relief layer — all shadows and bevels
│   ├── animations.css  keyframes, pre-animation states, motion policy
│   └── responsive.css  breakpoints (mobile-first, upward)
├── js/
│   ├── config.js       ← ALL content, venues, map links, films, music
│   ├── screens.js      the router, the films, the bottom bar
│   ├── events.js       builds the event screens and the location pins
│   ├── countdown.js    countdown + "the celebrations have begun"
│   ├── animations.js   gold dust, drifting ornaments, desktop polish
│   ├── assets.js       the 3D PNG engine
│   └── main.js         environment, music, boot
├── assets/
│   ├── video/          the five films + posters (originals in source/)
│   ├── audio/          music.mp3
│   └── 3d/ flowers/ ribbons/ images/ icons/
└── README.md
```

Load order is set in `index.html`: `config → assets → events → countdown →
animations → screens → main`. `main.js` renders the screens first, then binds
everything to them.

Only **GSAP** is loaded from a CDN. Lenis was removed with the long page —
each screen scrolls on its own now, and native scroll inside a short screen
beats a smooth-scroll library on a phone.

---

## Design notes

**The 3D / relief layer** lives entirely in `css/depth.css`, so it can be tuned
— or switched off by removing one `<link>` — without touching anything else.
The vocabulary is real luxury stationery: gold foil sits *proud* of the paper
(highlight on the top edge, shadow beneath), while rules and frames are
*debossed* into it. Each theme has its own lighting — on ivory the highlight is
white and the shadow warm brown; on burgundy the highlight is champagne and the
shadow near-black. Two knobs at the top: `--lift-*` for how far a surface
floats, `--foil-relief` / `--line-relief` for how raised the gold sits.

**Ornaments** — branches, blossoms, the pointed arch, corner filigree, the
satin ribbons — are all inline SVG. No image files to load or lose, and they
recolour per screen through `currentColor`.

**Screens centre their content with `margin-block:auto`, not
`justify-content:center`.** Once content is taller than the screen, centring
overflows in *both* directions and the top becomes unreachable. Auto margins
centre when there is room and top-align when there is not.

**Only masked headings breathe.** The continuous type animation is applied to
`.couple__name`, `.event__title` and `.section-title` only. Anything GSAP moves
on the way in must not also carry a CSS transform animation — the keyframes
would override GSAP's inline transform and the reveal would break. Masked
headings are safe because GSAP moves their inner span, never the element.

**VIEW LOCATION buttons carry `min-height: 44px`.** They are deliberately small
— tight tracking, compact padding, natural width rather than a full-width bar —
but 44px is the floor a thumb needs, and these are the only things a guest taps
besides the bar.

---

## Mobile

Nearly every guest opens this from a QR code on a phone, so mobile is the
primary target. Verified on nine real widths — **320, 344 (Galaxy Fold folded),
360, 375, 390, 393, 412, 414, 430** — plus landscape:

* No horizontal scroll and no clipped text at any width.
* Nothing smaller than ~10px.
* Every tap target clears 44×44. The bottom bar gets its hit area from an
  invisible `::after`, which is what lets five items fit a 320px bar — Home is
  the couple's monogram, icon-only, rather than a sixth word.
* Landscape is capped separately so a sideways phone doesn't get one name
  filling the screen.
* Particle counts and drift distance scale down on phones; blur is minimal.

## Behaviour you can rely on

* **No JavaScript errors, no broken images, no horizontal scroll** — 320px
  through 1440px.
* **A missing or blocked film** → that screen shows its text immediately.
  Verified by blocking two films outright.
* **`prefers-reduced-motion`** → films are skipped, every screen renders as a
  still, readable document. Console clean.
* **CDN unreachable / fully offline** → GSAP's absence is detected, the hidden
  states are dropped, all five screens stay readable and navigable.
* **Keyboard** — every bar item is a real button; visible gold focus rings.
* **Print** — each screen prints in turn, films and overlays dropped, gold
  becomes solid ink.

---

## Deploying (and the QR code)

Upload the folder as-is to any static host — Netlify (drag and drop), Vercel,
GitHub Pages, Cloudflare Pages, or plain shared hosting. Nothing to compile.

Then turn the resulting URL into a QR code with any generator.

Before printing the QR:

1. Replace the three `locationUrl` values with the real Google Maps links.
2. Open the deployed URL on an actual phone and tap through all five screens.
3. Test the QR from a printed sheet at the real size.

## Browser support

Current Chrome, Edge, Safari, Firefox, plus iOS Safari and Android Chrome.
Older engines without `background-clip: text` fall back to solid antique gold
for the foil headings.
