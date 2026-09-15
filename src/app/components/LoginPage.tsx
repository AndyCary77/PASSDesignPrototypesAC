import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './buttons/Button';

/**
 * A dummy recreation of PASS's real login screen
 * (https://pen.passgenius.com/logon), rebuilt with this prototype's own
 * established card/button/input conventions rather than pixel-cloning the
 * production markup — same white rounded-[10px] + border-gray-200 +
 * shadow-sm card and purple-focus-ring input treatment already used by
 * auth.tsx's password gate, same shared Button component. The wordmark
 * (`/PASSLogo.png`) and the news panel graphic (`/schedule-hero-promo.png`)
 * are both real production assets — the logo was already sitting unused in
 * `public/`, the promo graphic was fetched from the live site's own upload
 * (elpassportal.wpenginepowered.com) and saved locally rather than
 * hotlinked, so this prototype doesn't depend on that site staying up.
 *
 * Standalone route (no AppShell/Header) since a login screen has no app
 * chrome to sit inside. Not wired to anything real — this repo has no
 * backend (see CLAUDE.md) — so "Log in" just navigates through to the
 * customers list, the same way a real successful login would land you
 * somewhere. Forgot password / Not a customer / Terms are inert `href="#"`
 * placeholders, same convention already used for other not-yet-built links
 * elsewhere (e.g. CustomerInfoNav's own inactive tabs).
 *
 * The news panel links through to this prototype's own `/schedule` page
 * rather than a dead end — the real graphic is promoting "Schedule Hero"
 * (AI-powered scheduling), so that's the one existing page here it
 * actually matches.
 *
 * Left/right panels — 2026-09-15: each panel has a muted caption below it
 * (no label above any more — an earlier version had one on each side, but
 * it read as redundant next to the panel's own obvious content/heading and
 * was removed). Both captions mirror the *same* [two plain lines + one
 * link line] shape (the copyright/terms block on the left, a matching
 * news/help blurb + link on the right), which is what keeps the two panels
 * genuinely equal height below (see next paragraph) — not just similar
 * copy for its own sake.
 *
 * The two panels are equal height via the row's default `items-stretch`
 * (removed an earlier `items-start`) plus `flex-1` on both the form and
 * the image link — the shorter one grows to match the taller one. That
 * only comes out *exactly* equal because the caption blocks below each
 * panel are the same height too (same line count/size on both sides) —
 * a 1-line caption on one side and a 3-line one on the other leaves
 * unequal space for flex-1 to fill even though the columns themselves are
 * stretched equal. The image crops (`object-cover`) to fit rather than
 * distorting; the form's own content is split into a top group and an
 * `mt-auto` bottom group so any extra height reads as intentional
 * breathing room before the support/sign-up line, not a stray gap.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate('/customers/list');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row justify-center gap-10">
        {/* Login card */}
        <div className="w-full max-w-sm flex flex-col mx-auto lg:mx-0">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col bg-white rounded-[10px] border border-gray-200 shadow-sm p-8">
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
                  Click here!
                </a>
              </p>
            </div>
          </form>

          <div className="text-center mt-6 text-sm text-gray-400 space-y-0.5">
            <p>Copyright © 2026 everyLIFE Technologies Ltd.</p>
            <p>All rights reserved.</p>
            <a href="#" className="text-[rgb(109,27,152)] hover:underline">Terms and Conditions</a>
          </div>
        </div>

        {/* Promo panel */}
        <div className="w-full max-w-sm lg:max-w-none lg:flex-1 flex flex-col mx-auto lg:mx-0 min-w-0">
          <Link
            to="/schedule"
            className="flex-1 block rounded-[10px] overflow-hidden border border-gray-200 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <img
              src="/schedule-hero-promo.png"
              alt="Schedule Hero — AI-powered scheduling built for home care teams. Explore now."
              className="w-full h-full object-cover block"
            />
          </Link>

          {/* Mirrors the login card's caption line-for-line (two plain
              lines + one link line) rather than just approximating its
              height — that's what keeps the two flex-1 panels above
              genuinely equal height, not just visually close. */}
          <div className="text-center mt-6 text-sm text-gray-400 space-y-0.5">
            <p>Discover more product news and updates.</p>
            <p>New features roll out regularly.</p>
            <a href="#" className="text-[rgb(109,27,152)] hover:underline">Visit the Help Centre</a>
          </div>
        </div>
      </div>
    </div>
  );
}
