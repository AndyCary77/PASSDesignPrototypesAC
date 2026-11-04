import { useEffect, useRef } from 'react';
import './plan-teaser.js';

// The "Suggested plan" teaser, a self-contained web component (plan-teaser.js, a copy of public/plan-teaser/).
// It plays once when it first appears. Rather than using its own hover-to-replay (which only reacts over the
// animation itself), the card around it passes `active` while hovered, so hovering anywhere on the card
// replays it from the start, the same way the Assessment Hero card works. A hover during a play-through
// doesn't restart it.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'plan-teaser': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        autoplay?: string;
        'replay-on-hover'?: string;
        'no-font-load'?: string;
      };
    }
  }
}

type PlanTeaserElement = HTMLElement & { play: () => void };

export function PlanTeaserVisual({ active = false }: { active?: boolean }) {
  const ref = useRef<PlanTeaserElement>(null);
  const playing = useRef(true); // it autoplays once when first seen
  const wasActive = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnd = () => { playing.current = false; };
    el.addEventListener('teaser-end', onEnd);
    return () => el.removeEventListener('teaser-end', onEnd);
  }, []);

  useEffect(() => {
    // Replay on the moment the pointer enters the card, if it isn't already mid-play.
    if (active && !wasActive.current && !playing.current) {
      playing.current = true;
      ref.current?.play();
    }
    wasActive.current = active;
  }, [active]);

  return (
    // The teaser keeps its own fixed proportions, so it sits centred in a taller frame, on its own background colour.
    // The side padding gives the parts of the scene that run past its edge (the Personal care card and the outer
    // panel on the right) room to show in full instead of being cut off.
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#F7F5FB', padding: '0 30px' }}>
      <plan-teaser
        ref={ref as React.Ref<HTMLElement>}
        autoplay="true"
        replay-on-hover="false"
        no-font-load="" // the app already loads Barlow
        aria-hidden="true"
        style={{ display: 'block', width: '100%' }}
      />
    </div>
  );
}
