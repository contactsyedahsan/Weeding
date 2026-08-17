# Meezab & Dua — Wedding Invitation

A cinematic, mobile-first digital wedding invitation.
Plain HTML, CSS and JavaScript — open `index.html` and it runs. No build step,
no framework, no install.

```
Syed Meezab E Rehmat Ali Hyderi   &   Dua Sarwar
S/O Syed Mazher Ali Hyderi            D/O Late Ghulam Sarwar
```

| Event    | Date             | Time            | Venue                   |
|----------|------------------|-----------------|-------------------------|
| Mehndi   | 29 August 2026   | 8:00 PM onwards | Mid Wicket Indoor Ground |
| Rukhsati | 1 September 2026 | 7:00 PM onwards | Bride's Home            |
| Shalima  | 3 September 2026 | 7:30 PM onwards | ZS Royal Banquet        |

---

## Quick start

Double-click `index.html`, or in VS Code right-click it → **Open with Live Server**.

Both work. The site deliberately uses classic `<script>` tags instead of ES
modules so it also runs straight from the file system (`file:///…`) without a
local server.

---

## The only file you need to edit: `js/config.js`

Everything a person would want to change lives there, at the top, commented.

```js
WI.events = [
  {
    id: 'mehndi',
    title: 'Mehndi',
    date: '29 August 2026',
    time: '8:00 PM onwards',
    venue: 'Mid Wicket Indoor Ground',
    address: '',
    locationUrl: 'https://www.google.com/maps/search/?api=1&query=Mid+Wicket+Indoor+Ground',
    mapLabel: 'View Location',
    …
  },
  …
];
```

Nothing in `index.html` hard-codes a venue, a time or a map link. The event
panels, the timeline, the venue cards and the save-the-dates list are all
generated from this array by `js/events.js`.

### Replacing the Google Maps links

The three `locationUrl` values are **temporary search links**. To use the real
ones, open the venue in Google Maps → **Share** → copy the link, and paste it in:

```js
locationUrl: 'https://maps.app.goo.gl/YOUR-REAL-LINK'
```

That is the whole change. No HTML, no JavaScript.

Rules the button already follows:

* `locationUrl: ''` → the **VIEW LOCATION** button is not rendered at all
  (no dead link, no empty box).
* A non-empty `locationUrl` → the button appears in both the event panel and
  the venue card, opening in a new tab with `rel="noopener noreferrer"`.
* `address: ''` → no address line is shown. Nothing is ever invented.

### Countdown

```js
WI.countdown = { target: '2026-08-29T20:00:00+05:00', … };
```

`+05:00` is Pakistan Standard Time, so the countdown is correct for guests in
any timezone. Once the date passes it swaps itself for
*"The celebrations have begun."*

---

## Adding your 3D PNG assets

Drop the file in, flip one flag. That's it.

**1.** Put the PNG in the matching folder:

```
assets/3d/        ring.png, perfume.png, wedding-object-01.png …
assets/flowers/   flowers.png …
assets/ribbons/   ribbon.png …
```

**2.** Open `js/config.js`, find the entry in `WI.assets3d` (or copy one), point
`src` at your file, and set `enabled: true`:

```js
{
  enabled: true,                       // ← the flag
  src: 'assets/3d/ring.png',
  layer: 'hero',                       // which section it belongs to
  position: { bottom: '10%', right: '4%' },
  width: '180px',
  animation: 'reveal-rotate',
  float: true, speed: 0.45, rotation: 10, scale: 1, opacity: 1,
  depth: 3, hover: true, mobile: false, alt: ''
}
```

Entries ship as `enabled: false` so the page never requests a file that isn't
there yet. (If a file does go missing, `js/assets.js` removes the element
instead of leaving a broken image.)

### Field reference

| Field | What it does |
|---|---|
| `layer` | Section to attach to: `hero`, `celebrations`, `mehndi`, `rukhsati`, `shalima`, `countdown`, `venues`, `closing`, `finale` |
| `position` | Any of `top` / `right` / `bottom` / `left`, any CSS length (`'8%'`, `'-40px'`, `'calc(50% - 120px)'`) |
| `width` | CSS width — `'220px'` or `'28vw'` |
| `animation` | `slide-left`, `slide-right`, `rise`, `drop`, `reveal-rotate`, `fade`, `none` |
| `float` | `true` adds an endless subtle bob and sway |
| `speed` | Parallax strength. `0` = pinned to the page, `1` = very fast |
| `rotation` | Resting rotation, in degrees |
| `scale` / `opacity` | Resting scale and opacity |
| `depth` | z-index within its layer — higher sits in front |
| `hover` | `true` = follows the pointer a few px (desktop only) |
| `mobile` | `false` = skipped entirely on phones |
| `alt` | Leave `''` for decoration; screen readers will ignore it |

Each asset runs through the same pipeline —
**position → entrance → float → parallax → hover → depth** — so new artwork
never requires touching the animation engine.

To experiment with placement without editing files, use the console:

```js
WI.assets.add({ enabled: true, src: 'assets/3d/ring.png', layer: 'shalima',
                position: { top: '12%', right: '6%' }, width: '160px',
                animation: 'slide-right', float: true, speed: 0.4 });
```

---

## Adding music (optional)

Put an MP3 in `assets/audio/` and set its path:

```js
WI.audio = { src: 'assets/audio/ambient.mp3', volume: 0.35, fadeSeconds: 1.6 };
```

The ♪ button then appears in the top-right corner and fades the track in and
out. While `src` is `''` the button stays hidden — there is no broken player and
nothing ever autoplays.

---

## Project structure

```
wedding-invitation/
├── index.html          markup + the inline SVG ornament library
├── css/
│   ├── style.css       design tokens, typography, layout, components
│   ├── depth.css       the 3D / relief layer — all shadows and bevels
│   ├── animations.css  keyframes, pre-animation states, motion policy
│   └── responsive.css  breakpoints (mobile-first, upward)
├── js/
│   ├── config.js       ← ALL content, venues, map links, asset registry
│   ├── assets.js       the 3D PNG engine
│   ├── events.js       renders panels, timeline, venue cards, dates
│   ├── countdown.js    countdown + "the celebrations have begun"
│   ├── animations.js   gold dust, reveals, parallax, nav, micro-interactions
│   └── main.js         boot, smooth scroll, the envelope opening sequence
├── assets/
│   ├── 3d/  flowers/  ribbons/  images/  audio/  icons/
└── README.md
```

Load order matters and is set in `index.html`: `config → assets → events →
countdown → animations → main`. `main.js` renders the content first, then binds
the motion system to the rendered DOM.

---

## How the experience is built

**The opening.** The page holds on a full-screen burgundy envelope with a wax
seal. On **OPEN INVITATION**: the screen darkens, the seal breaks away, the flap
opens, the inner card rises, a satin ribbon sweeps the frame, gold dust lifts,
burgundy gives way to ivory, and the Bismillah, the names and the invitation
reveal in sequence. Roughly 3s for the envelope, ~5s for the reveal.

**Scrolling.** Lenis drives smooth scroll and feeds GSAP ScrollTrigger. Every
section has its own entrance; nothing animates all at once.

**Parallax.** Driven through two CSS custom properties, `--plx` (scroll) and
`--pfy` / `--pfx` (float and entrance), which compose into each element's own
transform:

```css
--plxT: translate3d(var(--pfx,0px), calc(var(--plx,0px) + var(--pfy,0px)), 0);
.sprig--hero-r { transform: var(--plxT) scaleX(-1) rotate(14deg); }
```

That is why a mirrored branch can parallax without losing its mirror — a plain
GSAP `y` tween would overwrite the whole transform.

**Ornaments.** Every flourish — branches, blossoms, the pointed arch, corner
filigree, the satin ribbons, the wax seal, the monogram wreath — is inline SVG
or CSS. There are no image files to load or lose, and they recolour per section
through `currentColor`.

---

## The 3D / relief layer

All of it lives in one file, [`css/depth.css`](css/depth.css), so it can be
tuned — or switched off, by removing one `<link>` — without touching anything
else. It only ever sets shadow, filter, gradient and 3D properties, so it never
fights the layout or the parallax transforms.

The vocabulary is real luxury stationery rather than generic drop-shadows:

* **Gold foil sits proud of the paper** — highlight on the top edge, shadow
  beneath, then a soft cast shadow. Applied with `filter: drop-shadow()` so it
  follows the glyph shape of the `background-clip: text` headings.
* **Rules, frames and the timeline rail are debossed** — the same lighting,
  inverted, so they read as pressed into the sheet.
* **Panels are layered paper**: a bevelled top edge, a stacked second sheet
  peeking out below, and a three-stage shadow (contact → mid → ambient).
* **Controls are physical.** Buttons have a bevel and a real shadow, and they
  press *in* on `:active` — the lift shadow swaps for an inset one.
* **On desktop the depth is live**: buttons tilt in perspective toward the
  cursor while being pulled magnetically and lifted off the page, and they push
  back in `z` when you press them. Venue cards tilt as solid tiles (5°) with
  their button floating above the surface in `z`.
* **Each theme has its own lighting.** On ivory the highlight is white and the
  shadow is warm brown; on burgundy the highlight is champagne and the shadow is
  near-black. Both token sets are at the top of the file.

Two tuning knobs at the top of `depth.css`: `--lift-*` for how far a surface
floats, `--foil-relief` / `--line-relief` for how raised the gold sits.

**Cost control:** chained `drop-shadow` filters are the expensive part, so on
phones the relief drops to a single pass and the large parallaxing background
art (branches, ribbons, arch) loses its filter entirely — it sits behind the
content and nobody reads depth from it. Ribbon shadows are desktop-only for the
same reason: those elements re-transform every frame, and a filter on top of
that is the one combination that actually costs frames on a phone.

## Mobile

Roughly every guest will open this from a QR code on a phone, so mobile is the
primary target, not an adaptation. Verified on nine real phone widths —
**320, 344 (Galaxy Fold folded), 360, 375, 390, 393, 412, 414, 430** — plus
landscape:

* **No horizontal scroll and no clipped text at any width.**
* **Nothing smaller than ~10px.** Tracked uppercase labels used to bottom out
  at 7px; every one has been raised, with letter-spacing giving way instead of
  size on the narrowest screens.
* **Every tap target clears 44×44.** The event nav gets its hit area from an
  invisible `::after` so the pill keeps its slim proportions.
* **The floating nav tucks away while you scroll down** and returns the instant
  you scroll up — it can never end up sitting on a VIEW LOCATION button.
* **Landscape is capped separately** (`max-height: 520px and (orientation: landscape)`),
  so a sideways phone doesn't get one name filling the screen. Landscape
  tablets are unaffected.
* Particle counts, parallax strength and float distance all scale down on
  phones; blur is kept minimal.

## Behaviour you can rely on

* **No JavaScript errors, no broken images, no horizontal scroll** — verified
  from 320px through 1440px.
* **`prefers-reduced-motion`** — the whole animation system stands down and the
  invitation renders as a still, fully readable document.
* **CDN unreachable / fully offline** — if GSAP and Lenis fail to load, the page
  detects it, drops the hidden-until-revealed states, and shows everything.
  The invitation is never blank because a script didn't arrive.
* **Keyboard** — the Open button takes focus on load; Enter or Space opens;
  focus moves into the invitation; every link has a visible gold focus ring.
* **Print** — decoration and overlays are dropped, gold becomes solid ink.

## Performance notes

* Particles are canvas-drawn, not DOM nodes: ~26 on phones, ~70 on desktop,
  paused by `IntersectionObserver` when off-screen and when the tab is hidden.
* Animation is limited to `transform` and `opacity`.
* Parallax intensity, particle counts and float distance all scale down on
  phones (`WI.motion` in `config.js`).
* Total page weight is dominated by the two CDN scripts and the webfonts;
  everything else is inline or generated.

---

## Deploying (and the QR code)

Upload the folder as-is to any static host — Netlify (drag and drop),
Vercel, GitHub Pages, Cloudflare Pages, or plain shared hosting. There is
nothing to compile.

Then turn the resulting URL into a QR code with any generator. Point it at the
site root; the invitation is mobile-first and opens straight into the envelope.

Before printing the QR:

1. Replace the three `locationUrl` values with the real Google Maps links.
2. Open the deployed URL on an actual phone and walk through all three events.
3. Test the QR from a printed sheet at the real size.

---

## Browser support

Current Chrome, Edge, Safari, Firefox, plus iOS Safari and Android Chrome.
Older engines without `background-clip: text` fall back to solid antique gold
for the foil headings.
