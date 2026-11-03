import { Check } from 'lucide-react';
import { Button } from '../buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import heroIconUrl from '../icons/assessment-hero.svg';
import scheduleHeroTeaserUrl from './sh-teaser.jpg';

// Placeholder upgrade teasers for the "Hero" features. All copy here is placeholder wording for the
// prototype, not agreed marketing text, and nothing is wired up: the buttons just close the dialog.

type HeroFeature = {
  name: string;
  tagline: string;
  points: string[];
  /** Optional banner shown across the top of the feature's card. */
  image?: { src: string; alt: string };
};

const SCHEDULE_HERO: HeroFeature = {
  image: {
    src: scheduleHeroTeaserUrl,
    alt: 'Schedule Hero suggesting a plan to cover visits after a carer reports an absence',
  },
  name: 'Schedule Hero',
  tagline: 'Fill your roster faster, with fewer conflicts.',
  points: [
    'Suggests who should cover each unallocated visit',
    'Takes care requirements, restrictions and travel time into account',
    'Flags problems before you publish the schedule',
  ],
};

const ASSESSMENT_HERO: HeroFeature = {
  name: 'Assessment Hero',
  tagline: 'Turn assessment recordings into draft care documents.',
  points: [
    'Records the assessment conversation, with consent',
    'Drafts care plans and About Me sections from what was said',
    'Every draft is reviewed before it is published',
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
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {showImage && feature.image && (
        <img src={feature.image.src} alt={feature.image.alt} className="mb-4 w-full h-auto rounded-lg border border-gray-100" />
      )}
      <div className="flex items-center gap-3">
        <img src={heroIconUrl} alt="" className="size-8" />
        <h3 className="text-base font-semibold text-gray-900">{feature.name}</h3>
        <UpgradePill />
      </div>
      <p className="mt-2 text-body text-gray-700">{feature.tagline}</p>
      <ul className="mt-3 space-y-1.5">
        {feature.points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-body text-gray-700">
            <Check className="mt-0.5 size-4 flex-shrink-0 text-[rgb(154,38,214)]" aria-hidden="true" />
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
      <DialogContent overlayClassName="z-[100]" className={`z-[101] ${single ? 'sm:max-w-3xl' : 'sm:max-w-2xl'} max-h-[calc(100vh-2rem)] overflow-y-auto gap-5 p-8`}>
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
          <div className="space-y-3">
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
