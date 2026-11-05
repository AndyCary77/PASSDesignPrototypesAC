import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import assessmentHeroIconUrl from '../icons/assessment-hero.svg';
import scheduleHeroIconUrl from '../icons/schedule-hero.svg';
import { AssessmentHeroFlow } from './AssessmentHeroFlow';
import { PlanTeaserVisual } from './PlanTeaserVisual';

// The explainer videos live in /public (served as-is), so the spaces in their names need encoding. Each is
// ~20 MB, so it is only requested once someone clicks See more, not when the dialog opens.
const SCHEDULE_HERO_VIDEO = encodeURI('/Schedule Hero workflow explainer v2.mp4');
const ASSESSMENT_HERO_VIDEO = encodeURI('/AH Walkthrough explainer.mp4');

/**
 * The explainer video. It starts as soon as it appears, with sound if the video has an audio track: the click on
 * See more counts as the user's go-ahead, which is what browsers require for unmuted autoplay. If a browser
 * refuses anyway, it starts muted instead, so it still plays, and the player's controls let people unmute.
 */
function ExplainerVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      className="h-full w-full"
      controls
      playsInline
      preload="auto"
      aria-label={label}
    />
  );
}

// Placeholder upgrade teasers for the "Hero" features. All copy here is placeholder wording for the
// prototype, not agreed marketing text, and nothing is wired up: the buttons just close the dialog.

type HeroFeature = {
  /** The feature's own mascot, shown beside its name. */
  icon: string;
  name: string;
  tagline: string;
  points: string[];
  /** Optional banner shown across the top of the feature's card. */
  image?: { src: string; alt: string };
  /** The explainer video opened by See more. */
  video: string;
  /** Optional animated banner, used instead of an image. */
  renderMedia?: (hovered: boolean) => ReactNode;
};

const SCHEDULE_HERO: HeroFeature = {
  icon: scheduleHeroIconUrl,
  video: SCHEDULE_HERO_VIDEO,
  renderMedia: (hovered) => <PlanTeaserVisual active={hovered} />,
  name: 'Schedule Hero',
  tagline: 'Fill your roster faster, with fewer conflicts.',
  points: [
    'Generate ranked plans in seconds, for you to review and publish',
    'Balances availability, travel, care needs and continuity, with strengths and trade-offs',
    'Works across your rota, whenever visits need assigning',
  ],
};

const ASSESSMENT_HERO: HeroFeature = {
  icon: assessmentHeroIconUrl,
  video: ASSESSMENT_HERO_VIDEO,
  renderMedia: (hovered) => <AssessmentHeroFlow active={hovered} />,
  name: 'Assessment Hero',
  tagline: 'Turn assessment recordings into draft care documents.',
  points: [
    'Pick your templates, press record, and talk to your client, not your notepad',
    'Drafts your documents and flags anything that wasn’t discussed',
    'Check each answer against what was said, then publish and approve suggested care plan tasks',
  ],
};

export type HeroTeaserMode = 'schedule-hero' | 'explore';

function UpgradePill() {
  // A static status label, deliberately lighter than the See more button beside it (thin border, no arrow, smaller)
  // so the two read as "what this is" and "what to do", not as two competing buttons.
  return (
    <span className="inline-flex items-center rounded-full bg-white border border-purple-300 px-2.5 py-0.5 text-sm font-medium text-[rgb(154,38,214)]">
      Upgrade
    </span>
  );
}

function FeatureCard({ feature, showImage = true, onSeeMore }: { feature: HeroFeature; showImage?: boolean; onSeeMore?: () => void }) {
  // The whole card opens the teaser video, and hovering anywhere on it highlights the border; a card with an
  // animated banner also plays that animation.
  const [hovered, setHovered] = useState(false);
  const clickable = !!onSeeMore;
  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[rgb(154,38,214)]/50 ${
        clickable && hovered ? 'border-[rgb(154,38,214)] shadow-md' : 'border-gray-200'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showImage && feature.image && (
        <img src={feature.image.src} alt={feature.image.alt} className="w-full h-auto" />
      )}
      {showImage && feature.renderMedia && (
        // The frame is taller than the visuals themselves (about 25% more), which sit centred in it with room
        // around them. It scales with the card's width.
        <div className="relative flex aspect-[515/228] overflow-hidden">{feature.renderMedia(hovered)}</div>
      )}

      {/* Title strip: the card's header. It sits directly on top of the description, so the name, its Upgrade label and
          the CTA all read as belonging to the content below, with the banner above as the preview. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-y border-purple-200 bg-[#f3e8fb] px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={feature.icon} alt="" className="size-10" />
          <h3 className="text-xl font-bold text-gray-900">{feature.name}</h3>
          <UpgradePill />
        </div>
        {/* The one real control. Its ::after stretches over the whole card (which is `relative`), so a click anywhere
            on the card presses it: one focusable element, no nested interactives. The card's hover also styles it. */}
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
          className="flex-row-reverse after:absolute after:inset-0 after:z-10 group-hover:bg-[rgb(250,244,253)]"
          onClick={onSeeMore}
        >
          See more
        </Button>
      </div>

      <div className="flex-1 p-4">
        <p className="text-body font-medium text-gray-900">{feature.tagline}</p>
        <ul className="mt-3 space-y-1.5">
          {feature.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-body text-gray-700">
              <span className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgb(154,38,214)]" aria-hidden="true">
                <Check className="size-3 text-white" strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function HeroTeaserDialog({
  mode,
  open,
  onOpenChange,
}: {
  mode: HeroTeaserMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const single = mode === 'schedule-hero';
  // null shows the overview (the feature cards); a feature shows its explainer video, reached from its See more button.
  const [videoOf, setVideoOf] = useState<HeroFeature | null>(null);
  useEffect(() => {
    if (!open) setVideoOf(null);
  }, [open]);
  const video = videoOf !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Wider than a normal dialog: the Schedule Hero banner is a wide screenshot and its text needs room. */}
      <DialogContent
        overlayClassName="z-[100]"
        // Keep the dialog's automatic focus on the dialog itself, not its first control, so the hover-only
        // "View teaser" button isn't revealed (and ringed) the moment the dialog opens. Tab still reaches it.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
        // The dialog narrows smoothly (max-width is animated) as it switches between the two-column overview and
        // the video view, while the content inside cross-fades in.
        className={`z-[101] transition-[max-width] duration-300 ease-out ${
          single ? 'sm:max-w-3xl' : video ? 'sm:max-w-4xl' : 'sm:max-w-6xl'
        } max-h-[calc(100vh-1rem)] overflow-y-auto gap-4 p-6`}
      >
        {video ? (
          // Keyed so each view mounts fresh and plays its fade-in.
          <div key="video" className="grid gap-4 animate-in fade-in-0 zoom-in-[0.98] duration-300">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl leading-tight">
                <img src={videoOf?.icon} alt="" className="size-8" />
                {videoOf?.name}
              </DialogTitle>
              <DialogDescription className="text-body text-gray-600">Watch a short walkthrough of how it works.</DialogDescription>
            </DialogHeader>

            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <ExplainerVideo src={videoOf!.video} label={`${videoOf!.name} walkthrough`} />
            </div>

            <DialogFooter className="sm:justify-between sm:items-center">
              <Button variant="tertiary" icon={<ArrowLeft className="size-4" />} onClick={() => setVideoOf(null)}>
                Back
              </Button>
              {/* The next step after watching. Not wired up yet: it just closes the dialog for now. */}
              <Button variant="primary" onClick={() => onOpenChange(false)}>Contact us</Button>
            </DialogFooter>
          </div>
        ) : (
          <div key="overview" className="grid gap-4 animate-in fade-in-0 duration-300">
            <DialogHeader>
              <DialogTitle className="text-xl leading-tight">
                {single ? 'Meet Schedule Hero' : 'Explore Hero features'}
              </DialogTitle>
              <DialogDescription className="text-body text-gray-600">
                {single
                  ? 'Schedule Hero is not part of your current plan. This is a preview of what it would add.'
                  : 'Hero features are not part of your current plan. Here is what they would add.'}
              </DialogDescription>
            </DialogHeader>

            {single ? (
              <FeatureCard feature={SCHEDULE_HERO} onSeeMore={() => setVideoOf(SCHEDULE_HERO)} />
            ) : (
              // Two columns side by side (stacked on narrow screens); the cards stretch to the same height.
              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard feature={SCHEDULE_HERO} onSeeMore={() => setVideoOf(SCHEDULE_HERO)} />
                <FeatureCard feature={ASSESSMENT_HERO} onSeeMore={() => setVideoOf(ASSESSMENT_HERO)} />
              </div>
            )}

            <DialogFooter className="sm:justify-between sm:items-center">
              <Button variant="tertiary" onClick={() => onOpenChange(false)}>Not now</Button>
              <Button variant="primary" onClick={() => onOpenChange(false)}>Talk to us about upgrading</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
