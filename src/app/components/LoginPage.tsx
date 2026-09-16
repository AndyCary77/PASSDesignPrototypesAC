import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './buttons/Button';

type Layout = 'card' | 'full';
// Which promo panel to render in the full-bleed layout — 'component' is
// the CSS-recreated SchedulePromo built in this repo; 'iframe' embeds the
// actual WordPress campaign page marketing is building, to check it looks
// right once it's really the thing being embedded rather than a
// recreation of it. Session-only, like `layout` — see PromoSourceToggle.
type PromoSource = 'component' | 'iframe';

/**
 * A dummy recreation of PASS's real login screen
 * (https://pen.passgenius.com/logon), rebuilt with this prototype's own
 * established card/button/input conventions rather than pixel-cloning the
 * production markup — same white rounded-[10px] + border-gray-200 +
 * shadow-sm card and purple-focus-ring input treatment already used by
 * auth.tsx's password gate, same shared Button component. The wordmark
 * (`/PASSLogo.png`) is a real production asset that was already sitting
 * unused in `public/`. The news panel graphic started the same way —
 * fetched whole from the live site's own upload
 * (elpassportal.wpenginepowered.com) and saved locally as
 * `/schedule-hero-promo.png` rather than hotlinked — but see
 * `SchedulePromo` below for why it's since been split into a CSS-recreated
 * header plus a cropped screenshot (`/schedule-hero-mockup.png`) instead of
 * used as one flat image.
 *
 * Standalone route (no AppShell/Header) since a login screen has no app
 * chrome to sit inside. Not wired to anything real — this repo has no
 * backend (see CLAUDE.md) — so "Log in" just navigates through to the
 * customers list, the same way a real successful login would land you
 * somewhere. Forgot password / Not a customer / Terms are inert `href="#"`
 * placeholders, same convention already used for other not-yet-built links
 * elsewhere (e.g. CustomerInfoNav's own inactive tabs).
 *
 * 2026-09-16: added a second layout, `full` — a full-bleed split screen
 * inspired by breathehr's login page (login.breathehr.com/login): the
 * promo graphic fills an entire half of the viewport top-to-bottom rather
 * than sitting in its own bordered card, and the form sits directly on a
 * plain white half with no card chrome of its own. Reuses the *same*
 * PASS logo/promo assets and the same PASS purple (rgb(154,38,214)) rather
 * than introducing new colours/art — the request was specifically to
 * reuse what already exists, just laid out differently. A few field
 * details deliberately follow breathe's own
 * pattern rather than the card layout's (visible field labels, "Forgot
 * password" inline next to the Password label instead of its own button)
 * since this is meant to read as a genuine alternative treatment, not the
 * card design reflowed into two columns.
 *
 * `layout` is plain component state (not persisted) — a small fixed
 * toggle in the corner (`LayoutToggle`) flips between the two so both can
 * be reviewed on the same page. Deliberately not the same track+thumb
 * switch as `NavModeToggle` (that one's tooltip/portal/localStorage-mode
 * machinery is built for a persistent, app-wide setting) — this is a
 * lightweight, session-only compare tool for two design directions, so a
 * plain two-segment pill is enough.
 */
export function LoginPage() {
  const navigate = useNavigate();
  // 'full' (the breathehr-inspired full-bleed layout) is now the default
  // — 'card' is still there as the alternative, just a toggle click away.
  const [layout, setLayout] = useState<Layout>('full');
  const [promoSource, setPromoSource] = useState<PromoSource>('component');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate('/customers/list');
  };

  return (
    <>
      {layout === 'card' ? (
        <CardLayout showPassword={showPassword} setShowPassword={setShowPassword} onSubmit={handleSubmit} />
      ) : (
        <FullBleedLayout
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onSubmit={handleSubmit}
          promoSource={promoSource}
        />
      )}
      <LayoutToggle layout={layout} onChange={setLayout} />
      {/* Only meaningful for the full-bleed layout — Card's own promo
          panel isn't part of this comparison. */}
      {layout === 'full' && <PromoSourceToggle source={promoSource} onChange={setPromoSource} />}
    </>
  );
}

interface FormLayoutProps {
  showPassword: boolean;
  setShowPassword: (fn: (v: boolean) => boolean) => void;
  onSubmit: (e: FormEvent) => void;
}

// PASS's exact brand hex for this graphic's background (not a sampled
// approximation — flat, not a gradient). Corrected a couple of times as
// sampling got more precise (PNG compression made eyeballing it
// unreliable) — this final value came from blurring a swatch of the flat
// background area to average out compression noise, rather than reading
// a single pixel.
const SCHEDULE_HERO_BG = '#392250';

// The "Explore now" pill's own fill — sampled directly from the source
// PNG (a flat, well-inside-the-shape pixel, avoiding anti-aliasing): a
// distinctly more vibrant/lighter purple than either this app's usual
// primary (rgb(154,38,214)) or the panel's own dark background, with
// white text — not the pale bg-purple-100 + dark-purple-text combination
// an earlier version used, which read as washed out next to the real
// graphic.
const SCHEDULE_HERO_BUTTON_BG = '#9966e3';

// Sizing/position/border for the promo panel in FullBleedLayout, shared
// between both `promoSource` options (see PromoSourceToggle) so swapping
// between the CSS recreation and the real WordPress iframe never changes
// the shape of the box, only what renders inside it. Excludes the
// `hidden md:flex`/`hidden md:block` display utility, since that's the
// one thing that genuinely differs between an element with children to
// arrange (SchedulePromo) and a childless iframe (SchedulePromoIframe).
const PROMO_SIZE_CLASSES =
  'md:max-lg:h-80 md:max-lg:w-full md:max-lg:border-t md:max-lg:border-gray-200 lg:min-h-screen lg:w-1/2 flex-shrink-0 lg:border-l lg:border-gray-200';

/**
 * The "Schedule Hero" promo graphic, split into a CSS-recreated top half
 * (heading/subtitle/CTA, real DOM text) and a cropped raster image for the
 * bottom half (the "Suggested plan" app mockup screenshot) — 2026-09-16,
 * replacing what was previously one single flat PNG for the whole thing.
 *
 * The original flat image (still at `/schedule-hero-promo.png`, unused
 * now) baked its heading/subtitle/button text directly into the pixels,
 * so displaying it at anything other than its own 1120:1160 aspect ratio
 * meant either distorting it or `object-cover` cropping it — which,
 * depending on the container's actual proportions, could clip the
 * headline, the "Explore now" pill, or both. Text doesn't have this
 * problem: it just reflows. So only the part of the source image that
 * *is* a genuine screenshot (the app mockup, `/schedule-hero-mockup.png`)
 * stays a raster image; the rest is real HTML.
 *
 * Cropped at y=380 of the original 1120×1160 PNG — found by sampling
 * pixel colour with Pillow rather than eyeballing it, since the first
 * attempt (y=400) sliced straight through the decorative sparkle that
 * sits just above the mockup, clipping its top point. y=380 sits just
 * below the "Explore now" pill's lowest edge (~y=361, so no duplicate
 * sliver of the CSS-recreated pill above) and just above the sparkle's
 * topmost pixel (~y=389, so it's kept whole).
 *
 * Fluid type: the header is a container-query context (`@container`,
 * Tailwind v4's `container-type: inline-size`) so it scales with *this
 * component's own* rendered width, not the viewport's — needed because
 * the two layouts hand it very different widths for the same viewport
 * (the full-bleed layout's half-viewport panel vs. the card layout's
 * `max-w-sm`-ish column).
 *
 * 2026-09-17: heading/subtitle/button used to each carry their *own*
 * independent `clamp(min, Ncqw, max)`, tuned separately — which meant
 * their relative proportions actually drifted as the container resized
 * (whichever hit its own min/max bound first would stop scaling while the
 * others kept going). Fixed by giving the whole header block ONE fluid
 * base size (`clamp(0.7rem, 3.4cqw, 1.75rem)`, on the wrapping `<div>`)
 * and sizing the heading/subtitle/button/gaps/padding/radius all in `em`
 * off that single value — `em` always resolves relative to the *inherited*
 * font-size, so multiplying the one shared base by fixed ratios (2.6em
 * for the heading, 1em for the subtitle, 0.9em for the button) guarantees
 * they scale in lockstep at every width, the way one flat image naturally
 * would. The only thing that changes their *relationship* now is the
 * `@lg:flex-row` breakpoint below, which is exactly the "wrap when it gets
 * too narrow" behaviour asked for — not a side effect of mismatched clamps.
 *
 * Layout: a flex column with the header pinned to the top and the mockup
 * image pushed to the bottom via `mt-auto` — so on a tall container (the
 * full-bleed layout's entire viewport-height half) any extra space
 * between them just shows more of the flat brand-purple background,
 * exactly like breathehr's own reference has open space above its bottom
 * wave graphic. On a shorter container (the card layout, height-matched
 * to the login card) there's usually little or no gap at all. Either way
 * nothing crops or distorts — the two parts simply reflow/stack
 * independently.
 *
 * Hidden below `lg` in both layouts, mirroring breathehr's own mobile
 * behaviour (its promo panel disappears entirely below its own mobile
 * breakpoint, leaving just the form) — see each layout's own call site
 * for how that's applied (a `hidden lg:flex` wrapper in CardLayout, since
 * its caption underneath needs to disappear with it; directly on this
 * component in FullBleedLayout, which has no such caption).
 *
 * 2026-09-16: `tabletRow` (opt-in, off by default — CardLayout doesn't
 * pass it, so it's unaffected) adds a tablet-portrait band (`md` up to
 * just below `lg`, via Tailwind's `md:max-lg:` range variant) where this
 * switches from its usual top/bottom stack to a left/right split: header
 * (heading/subtitle/CTA) on the left half, the mockup image on the right
 * half — the same two children, just laid out as a row instead of a
 * column, so no JSX reordering needed. Below `md` it's still hidden
 * entirely (FullBleedLayout's own caller className), matching the
 * instruction to keep the phone breakpoint image-free; at `lg`+ it's
 * back to the normal full-height column.
 *
 * The header's own `@container` (nested inside the root's) is what keeps
 * the subtitle/CTA row's `@lg:flex-row` decision correct in this mode —
 * without it, that breakpoint would still measure the *root's* full
 * width even though the header itself only has half of it at tablet,
 * and would wrongly go side-by-side in a space too cramped for it. A
 * nested container only changes what *its own descendants* measure
 * against for `cqw`/`@`-variants — the header's own `text-[clamp(cqw)]`
 * base size still resolves against the root (an element can't be a
 * container for its own properties), so heading/subtitle/button scale
 * stays exactly as it was; only the inner row's wrap decision narrows.
 */
function SchedulePromo({ className = '', tabletRow = false }: { className?: string; tabletRow?: boolean }) {
  return (
    <Link
      to="/schedule"
      // No bare `flex` here — callers supply their own display utility
      // (e.g. `hidden lg:flex`) since whether/when this shows at all is
      // now a per-layout, per-breakpoint decision (see the mobile note
      // above) rather than something this component should force.
      // duration-500 ease-out (not the 150ms Tailwind default) — the lift
      // was reading as an abrupt snap rather than a hover, at the default
      // speed.
      className={`@container group flex-col ${tabletRow ? 'md:max-lg:flex-row' : ''} overflow-hidden transition-transform duration-500 ease-out hover:-translate-y-0.5 ${className}`}
      style={{ backgroundColor: SCHEDULE_HERO_BG }}
    >
      {/* text-[clamp(...)] here is the ONE fluid base every size below
          derives from via em — see the note above. @container here too
          (harmless when tabletRow is off, since the header is always
          full-width then anyway) so the subtitle/CTA row's own @lg break
          measures *this* element's width, not the root's — see the
          file-level note.
          md:max-lg:text-base overrides the cqw-fluid base with a flat
          one for the tablet band specifically: that clamp is keyed to
          the *root's* width (an element can't be a cqw container for its
          own font-size), which is still the full banner width even once
          this div itself drops to half of it — so left uncorrected, the
          heading rendered at full-banner size squeezed into a half-width
          column and overflowed the banner's fixed height. Still one
          shared base the heading/subtitle/button/spacing all derive from
          via the same em ratios, so they stay proportional to *each
          other* here too — just a smaller flat number appropriate for
          this narrower band, not a fluid one (768–1023px is a much
          narrower range than the full desktop/card spread this clamp was
          tuned for, so a fixed value is a reasonable simplification). */}
      <div className={`@container p-8 sm:p-10 text-[clamp(0.7rem,3.4cqw,1.75rem)] ${tabletRow ? 'md:max-lg:w-1/2 md:max-lg:flex-shrink-0 md:max-lg:text-base' : ''}`}>
        <h3 className="text-[2.6em] font-extrabold text-white leading-[1.05]">
          Schedule Hero
        </h3>
        {/* Subtitle + CTA sit stacked by default, but become a row —
            button right-aligned, level with the strapline — once the
            container's actually wide enough (`@lg`, this component's own
            container-query breakpoint, not the viewport's) to hold both
            side by side without cramping either. Mirrors the real
            production graphic's own layout, which sits the button beside
            the strapline rather than below it. */}
        <div className="mt-[0.6em] flex flex-col gap-[0.5em] @lg:flex-row @lg:items-center @lg:justify-between @lg:gap-[1em]">
          {/* text-balance (not text-pretty) — this is a short, ~2-line
              strapline where an uneven wrap can easily strand a single
              word on its own line; balancing the two lines' lengths
              avoids that reliably, unlike relying on max-w tuning per
              breakpoint. */}
          <p className="text-balance text-[1em] font-semibold text-purple-100 max-w-[80cqw] sm:max-w-[60cqw] @lg:max-w-[45cqw]">
            AI-powered scheduling built for home care teams
          </p>
          {/* Vibrant fill + white text (sampled from the source graphic —
              see SCHEDULE_HERO_BUTTON_BG), and a moderate `em`-based
              radius rather than `rounded-full` — the reference button is
              a rounded rectangle, not a stadium/pill; radius scales with
              the button's own text size so it stays proportionally "less
              rounded" at every size rather than reading as a pill once
              the button grows large. */}
          <span
            className="self-start @lg:self-auto @lg:flex-shrink-0 inline-block -rotate-3 rounded-[0.5em] px-[1em] py-[0.5em] text-[0.9em] font-bold text-white shadow-sm transition-transform duration-500 ease-out group-hover:scale-105"
            style={{ backgroundColor: SCHEDULE_HERO_BUTTON_BG }}
          >
            Explore now
          </span>
        </div>
      </div>
      <img
        src="/schedule-hero-mockup.png"
        alt="Suggested plan — 8/8 covered, 4 carers, 17 min extra travel in total"
        className={`w-full h-auto mt-auto block ${tabletRow ? 'md:max-lg:w-1/2 md:max-lg:h-full md:max-lg:mt-0 md:max-lg:flex-shrink-0 md:max-lg:object-cover' : ''}`}
      />
    </Link>
  );
}

// The real campaign page marketing is building in WordPress (see
// AIOP-24311's implementation note) — a plain HTML/CSS page, not
// something built here, that's meant to be embedded via iframe rather
// than recreated in this codebase.
const SCHEDULE_HERO_WORDPRESS_URL = 'https://elpassportal.wpenginepowered.com/?page_id=93';

/**
 * The actual embed, for testing the real WordPress page in place of
 * `SchedulePromo`'s CSS recreation — see `PromoSourceToggle`. Takes the
 * *exact same* `className` (sizing/position/border/visibility per
 * breakpoint) as `SchedulePromo` does, so switching between the two never
 * changes the shape of the box itself, only what's rendered inside it —
 * that's what makes it a fair like-for-like comparison rather than two
 * differently-sized things.
 *
 * Unlike `SchedulePromo`, there's no `flex`/`flex-col` here: an iframe is
 * a leaf/replaced element with no children of ours to arrange, so it only
 * ever needs `block` (vs. `hidden`) for its own display, not `flex` — the
 * WordPress page's *own* internal layout (desktop column vs. tablet-banner
 * split) is entirely its own responsibility once embedded, per the spec
 * on AIOP-24311; this component only controls the size/position of the
 * box it's shown in, same as SchedulePromo's className already did.
 */
function SchedulePromoIframe({ className = '' }: { className?: string }) {
  return (
    <iframe
      src={SCHEDULE_HERO_WORDPRESS_URL}
      title="Schedule Hero campaign (WordPress)"
      className={`border-0 ${className}`}
      style={{ backgroundColor: SCHEDULE_HERO_BG }}
    />
  );
}

/**
 * Left/right panels — each has a muted caption below it (no label above —
 * an earlier version had one on each side, but it read as redundant next
 * to the panel's own obvious content and was removed). Both captions
 * mirror the *same* [two plain lines + one link line] shape (the
 * copyright/terms block on the left, a matching news/help blurb + link on
 * the right), which is what keeps the two panels genuinely equal height
 * (see below) — not just similar copy for its own sake.
 *
 * The two panels are equal height via the row's default `items-stretch`
 * plus `flex-1` on both the form and the image link — the shorter one
 * grows to match the taller one. That only comes out *exactly* equal
 * because the caption blocks below each panel are the same height too
 * (same line count/size on both sides) — a 1-line caption on one side and
 * a 3-line one on the other leaves unequal space for flex-1 to fill even
 * though the columns themselves are stretched equal. The image crops
 * (`object-cover`) to fit rather than distorting; the form's own content
 * is split into a top group and an `mt-auto` bottom group so any extra
 * height reads as intentional breathing room before the support/sign-up
 * line, not a stray gap.
 */
function CardLayout({ showPassword, setShowPassword, onSubmit }: FormLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row justify-center gap-10">
        {/* Login card — same width classes as the promo column below
            (max-w-sm on mobile, lg:flex-1 once side-by-side) so the two
            panels split the row evenly instead of the card staying a
            fixed, narrower width next to a wider image. */}
        <div className="w-full max-w-sm lg:max-w-none lg:flex-1 flex flex-col mx-auto lg:mx-0">
          <form onSubmit={onSubmit} className="flex-1 flex flex-col bg-white rounded-[10px] border border-gray-200 shadow-sm p-8">
            <div>
              <img src="/PASSLogo.png" alt="PASS" className="h-14 w-auto mb-5" />
              <div className="border-t border-gray-200 mb-5" />

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Username"
                  autoComplete="username"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] focus:border-[rgb(154,38,214)] transition-colors"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] focus:border-[rgb(154,38,214)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <Button type="button" variant="tertiary" className="flex-1">Forgot password</Button>
                <Button type="submit" className="flex-1">Log in</Button>
              </div>
            </div>

            {/* Pinned to the bottom of the card via mt-auto, whatever extra
                height flex-1/items-stretch ends up giving this card to
                match the promo panel's — reads as deliberate breathing
                room above the support/sign-up line, not a stray gap. */}
            <div className="mt-auto pt-5">
              <div className="border-t border-gray-200 mb-5" />
              <p className="text-sm text-gray-500 text-center">Customer Support 0330 094 0122</p>
              <p className="text-sm text-gray-500 text-center mt-1">
                Not a customer yet?{' '}
                <a href="#" className="text-[rgb(109,27,152)] hover:text-[rgb(154,38,214)] hover:underline">
                  Book a free tour
                </a>
              </p>
            </div>
          </form>

          {/* `text-sm` repeated directly on each <p> here (not just relied
              on from this wrapping div) — globals.css has a base-layer
              `p, div, span { font-size: var(--text-base) }` reset that's
              meant to back off once an element has an ancestor with its
              own text-* class, but empirically that opt-out doesn't
              reliably reach a bare-text <p> with no class of its own two
              levels down; it was quietly rendering these at 16px instead
              of the intended 14px (confirmed via computed styles) while
              the `<a>`/directly-classed `<p>` elements elsewhere on this
              page were unaffected. Putting text-sm on the element itself,
              same as "Customer Support"/"Not a customer yet?" above
              already do, sidesteps it reliably. */}
          <div className="text-center mt-6 text-sm text-gray-400 space-y-0.5">
            <p className="text-sm">Copyright © 2026 everyLIFE Technologies Ltd.</p>
            <p className="text-sm">All rights reserved.</p>
            <a href="#" className="text-[rgb(109,27,152)] hover:underline">Terms and Conditions</a>
          </div>
        </div>

        {/* Promo panel — hidden below lg, mirroring breathehr's own mobile
            treatment (see the note on SchedulePromo); the caption
            underneath is part of the same "panel" so it disappears with
            it rather than being left stranded on its own. */}
        <div className="hidden lg:flex w-full max-w-sm lg:max-w-none lg:flex-1 flex-col mx-auto lg:mx-0 min-w-0">
          <SchedulePromo className="flex flex-1 rounded-[10px] border border-gray-200 shadow-sm" />

          {/* Mirrors the login card's caption line-for-line (two plain
              lines + one link line) rather than just approximating its
              height — that's what keeps the two flex-1 panels above
              genuinely equal height, not just visually close. */}
          <div className="text-center mt-6 text-sm text-gray-400 space-y-0.5">
            <p className="text-sm">Discover more product news and updates.</p>
            <p className="text-sm">New features roll out regularly.</p>
            <a href="#" className="text-[rgb(109,27,152)] hover:underline">Visit the Help Centre</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full-bleed alternative — the promo graphic fills an entire half of the
 * viewport (edge to edge, no page margin/card around it) at desktop
 * widths, the form sits directly on a plain white half with no card of
 * its own. Same assets and colours as CardLayout, just without the
 * padded, bordered-card treatment — the point of this variant is the
 * graphic reading as full-screen brand/marketing real estate, the way
 * breathehr's login does.
 *
 * 2026-09-16: form half first (left), promo half second (right) — an
 * earlier version had the promo on the left; flipped on request, so the
 * divider border moved from the promo's right edge to its left (`lg:border-l`)
 * since that's the shared seam now.
 *
 * 2026-09-16, later — a third, tablet-portrait treatment: below `lg` this
 * container is `flex-col`, so the promo (SchedulePromo, now with
 * `tabletRow`) simply becomes the next sibling under the form rather than
 * beside it — no restructuring needed there, it falls out of the existing
 * column layout. From `md` up to just below `lg` it's shown as a wide
 * banner (fixed height, not the full viewport) with its own internal
 * header-left/mockup-right split. Below `md` (phone) it's still `hidden`
 * entirely, keeping that breakpoint image-free as asked. See
 * SchedulePromo's own file-level note for how `tabletRow` achieves the
 * internal split.
 */
function FullBleedLayout({ showPassword, setShowPassword, onSubmit, promoSource }: FormLayoutProps & { promoSource: PromoSource }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Form half — plain white, no card/border/shadow: the whole half
          already reads as the "panel", so the fields don't need a second,
          nested box around them.
          flex-col rather than a single items-center/justify-center block:
          the form itself sits in a flex-1 centering wrapper, and the
          copyright/terms footer is a separate sibling below it — that's
          what "docks" the footer to the very bottom of the half (any
          extra vertical space is absorbed above it, by the centering
          wrapper) instead of it just trailing the form wherever the
          form's own centered position happens to end. */}
      <div className="flex-1 flex flex-col bg-white px-6 py-16">
        <div className="flex-1 flex items-center justify-center">
          <form onSubmit={onSubmit} className="w-full max-w-sm">
            <img src="/PASSLogo.png" alt="PASS" className="h-14 w-auto mb-8" />

            <div className="space-y-4">
              <div>
                <label htmlFor="full-username" className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input
                  id="full-username"
                  type="text"
                  autoComplete="username"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] focus:border-[rgb(154,38,214)] transition-colors"
                />
              </div>

              <div>
                {/* "Forgot password" sits inline with the label, mirroring
                    breathehr's own row — deliberately not the second button
                    CardLayout uses, so this reads as its own treatment. */}
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="full-password" className="block text-sm font-medium text-gray-700">Password</label>
                  <a href="#" className="text-sm font-medium text-[rgb(109,27,152)] hover:text-[rgb(154,38,214)] hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="full-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[rgb(154,38,214)] focus:border-[rgb(154,38,214)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6">Log in</Button>

            <p className="text-sm text-gray-500 text-center mt-4">
              Not a customer yet?{' '}
              <a href="#" className="text-[rgb(109,27,152)] hover:text-[rgb(154,38,214)] hover:underline">
                Book a free tour
              </a>
            </p>
            <p className="text-sm text-gray-500 text-center mt-1">Customer Support 0330 094 0122</p>
          </form>
        </div>

        {/* Docked to the bottom of the half via the flex-1 wrapper above
            absorbing the extra space, not by being part of the form's own
            centered flow. Two lines, same as CardLayout's own footer
            reads once combined: the copyright/rights sentence, then Terms
            and Conditions. */}
        <div className="text-center text-sm text-gray-400 space-y-0.5">
          <p className="text-sm">Copyright © 2026 everyLIFE Technologies Ltd. All rights reserved.</p>
          <a href="#" className="text-sm text-[rgb(109,27,152)] hover:underline">Terms and Conditions</a>
        </div>
      </div>

      {/* Promo — three distinct treatments by breakpoint:
          - below md (phone): hidden entirely, kept image-free.
          - md up to just below lg (tablet portrait): a wide banner under
            the form (this is just the next sibling in a flex-col
            container, so it naturally stacks below rather than beside),
            `tabletRow` switching its internal layout to header-left/
            mockup-right, split 50/50, within its own dark-purple box. A
            fixed banner height rather than lg's min-h-screen — this
            isn't meant to fill the viewport, just read as a strip.
          - lg+ (desktop): the original full-height side-by-side half,
            header stacked above the mockup. A hairline border marks the
            seam either way — border-t under the tablet banner (it sits
            below the form there), border-l beside it at lg (it sits to
            the form's right there) — otherwise the purple panel just
            runs straight into the white form with no edge at all.

          The sizing/position/border/visibility classes are identical
          between the two `promoSource` options (only the `flex`/`block`
          display utility differs — see SchedulePromoIframe's own note),
          so switching the toggle never changes the shape of the box,
          only what's rendered inside it. */}
      {promoSource === 'component' ? (
        <SchedulePromo
          tabletRow
          className={`hidden md:flex ${PROMO_SIZE_CLASSES}`}
        />
      ) : (
        <SchedulePromoIframe className={`hidden md:block ${PROMO_SIZE_CLASSES}`} />
      )}
    </div>
  );
}

/**
 * Subtle, session-only layout switch — fixed to a corner, small and
 * unobtrusive, so it reads as a design-review aid rather than part of
 * either design itself. Plain two-segment pill rather than NavModeToggle's
 * track+thumb switch (see the file-level note) since this isn't a
 * persistent app setting.
 *
 * 2026-09-16: full opacity always now — the earlier opacity-60-until-hover
 * treatment made it hard to make out sitting over the full-bleed layout's
 * own promo image in that corner (the image's own colours/contrast bled
 * through it). The white bg/border/shadow still keep it visually light,
 * just no longer semi-transparent on top of a busy background.
 */
function LayoutToggle({ layout, onChange }: { layout: Layout; onChange: (l: Layout) => void }) {
  const segment = (value: Layout, label: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
        layout === value ? 'bg-[rgb(154,38,214)] text-white' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
      {segment('card', 'Card')}
      {segment('full', 'Full screen')}
    </div>
  );
}

/**
 * A second, stacked-above-`LayoutToggle` corner pill — only shown while
 * the full-bleed layout is active, since Card's own promo panel isn't
 * part of this comparison. Lets the real WordPress campaign page (once
 * marketing has it live at AIOP-24311's URL) be checked in place
 * side by side with the CSS recreation, in the *exact* box it'll actually
 * occupy on the real page, rather than only ever viewing it standalone.
 * Session-only, same as `layout` — not persisted, not a real product
 * setting.
 */
function PromoSourceToggle({ source, onChange }: { source: PromoSource; onChange: (s: PromoSource) => void }) {
  const segment = (value: PromoSource, label: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
        source === value ? 'bg-[rgb(154,38,214)] text-white' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed bottom-16 right-4 z-50 inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
      {segment('component', 'Component')}
      {segment('iframe', 'WordPress')}
    </div>
  );
}
