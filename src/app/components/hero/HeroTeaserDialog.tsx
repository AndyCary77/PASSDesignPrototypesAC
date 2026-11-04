import { useState, type ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import assessmentHeroIconUrl from '../icons/assessment-hero.svg';
import scheduleHeroIconUrl from '../icons/schedule-hero.svg';
import { AssessmentHeroFlow } from './AssessmentHeroFlow';
import { PlanTeaserVisual } from './PlanTeaserVisual';

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
  /** Optional animated banner, used instead of an image. */
  renderMedia?: (hovered: boolean) => ReactNode;
};

const SCHEDULE_HERO: HeroFeature = {
  icon: scheduleHeroIconUrl,
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
  return (
    <span className="inline-flex items-center rounded-full bg-[#f3e8fb] border border-purple-300 px-2.5 py-0.5 text-sm font-medium text-[rgb(154,38,214)]">
      Upgrade
    </span>
  );
}

function FeatureCard({ feature, showImage = true }: { feature: HeroFeature; showImage?: boolean }) {
  // A card with an animated banner is "live": hovering anywhere on the card plays the animation and
  // highlights the card's border.
  const [hovered, setHovered] = useState(false);
  const live = !!feature.renderMedia;
  return (
    <div
      className={`h-full rounded-xl border bg-white p-3 transition-[border-color,box-shadow] duration-200 ${
        live && hovered
          ? 'border-[rgb(154,38,214)] shadow-md'
          : 'border-gray-200'
      }`}
      onMouseEnter={live ? () => setHovered(true) : undefined}
      onMouseLeave={live ? () => setHovered(false) : undefined}
    >
      {showImage && feature.image && (
        <img src={feature.image.src} alt={feature.image.alt} className="mb-3 w-full h-auto rounded-lg border border-gray-100" />
      )}
      {showImage && feature.renderMedia && (
        <div className="mb-3 overflow-hidden rounded-lg">
          {/* The frame is taller than the visuals themselves (about 25% more), which sit centred in it with room
              around them. It scales with the card's width. */}
          <div className="relative flex aspect-[515/228] overflow-hidden">{feature.renderMedia(hovered)}</div>
          {/* Always-visible strip with its own background, holding the CTA. Not wired up yet: what it opens is
              still to be decided. */}
          <div className="flex items-center justify-end border-t border-purple-200 bg-[#f3e8fb] px-3 py-2">
            <Button variant="secondary" size="sm" icon={<ArrowRight className="size-4" />} className="flex-row-reverse">
              See more
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <img src={feature.icon} alt="" className="size-8" />
        <h3 className="text-base font-semibold text-gray-900">{feature.name}</h3>
        <UpgradePill />
      </div>
      <p className="mt-2 text-body text-gray-700">{feature.tagline}</p>
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
        }} className={`z-[101] ${single ? 'sm:max-w-3xl' : 'sm:max-w-6xl'} max-h-[calc(100vh-1rem)] overflow-y-auto gap-4 p-6`}>
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
          <FeatureCard feature={SCHEDULE_HERO} />
        ) : (
          // Two columns side by side (stacked on narrow screens); the cards stretch to the same height.
          <div className="grid gap-4 md:grid-cols-2">
            <FeatureCard feature={SCHEDULE_HERO} />
            <FeatureCard feature={ASSESSMENT_HERO} />
          </div>
        )}

        <DialogFooter className="sm:justify-between sm:items-center">
          <Button variant="tertiary" onClick={() => onOpenChange(false)}>Not now</Button>
          <Button variant="primary" onClick={() => onOpenChange(false)}>Talk to us about upgrading</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
