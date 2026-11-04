import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import heroIconUrl from '../icons/assessment-hero.svg';
import './assessment-hero-flow.css';

// Decorative "conversation in, care plan out" animation for the Assessment Hero teaser.
// Spoken quotes drift towards the mic from the left; the matching care-plan statements drift away
// from it on the right. Each quote and its card share one x position and one animation, and the two
// layers are clipped at the centre line, so a quote appears to turn into its card as it passes the mic.
//
// Rebuilt from the marketing site's markup (only the DOM was available, not its CSS), so the motion
// is this prototype's own: one lane per item, continuous left-to-right scroll, loops seamlessly.

const FLOW = [
  { say: 'The step into the shower worries me.', title: 'Washing', card: 'I’d like support stepping into the shower.' },
  { say: 'Tuesday and Friday mornings, please.', title: 'Visits', card: 'I shower on Tuesday and Friday mornings.' },
  { say: 'Buttons are tricky when it’s cold.', title: 'Dressing', card: 'I’d like help with buttons on cold mornings.' },
  { say: 'I’d like help with a hot lunch.', title: 'Meals', card: 'I’d like support making a hot lunch.' },
  { say: 'I use my frame around the house.', title: 'Mobility', card: 'I walk with my frame around the house.' },
  { say: 'She forgets her morning tablets.', title: 'Medication', card: 'I need a prompt for my morning tablets.' },
];

const SLOT = 240; // px between item starts; one loop = FLOW.length * SLOT
const ITEM_W = 208;
// Items are laid out from one loop before the origin up to one loop after it, so the conveyor never shows a gap.
const INDEXES = Array.from({ length: FLOW.length * 2 }, (_, i) => i - FLOW.length);

// Waveform bar heights (%), taken from the marketing animation; the strip is doubled so it can scroll seamlessly.
const WAVE = [
  19, 39, 53, 48, 78, 97, 92, 68, 37, 19, 19, 46, 62, 57, 72, 92, 91, 68, 19, 20, 25, 53, 70, 66, 65, 87, 87, 19,
  36, 15, 30, 59, 78, 75, 58, 79,
];

const loopPx = FLOW.length * SLOT;

// Playback: runs for a couple of seconds when the teaser opens, eases to a stop, then plays again
// (easing up to speed) while `active` is true (the parent card is hovered) and eases back to a stop after.
const INTRO_MS = 2500;
const EASE_UP_MS = 220; // time constant when speeding up
const EASE_DOWN_MS = 650; // time constant when slowing down

export function AssessmentHeroFlow({ active = false }: { active?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const targetRate = useRef(1);
  const rate = useRef(1);
  const frame = useRef<number | null>(null);
  const lastTime = useRef(0);
  const introDone = useRef(false);
  const activeRef = useRef(active);

  // The motion itself is CSS keyframes; this only changes how fast those animations are running, so a stop
  // is a smooth slow-down and a restart picks up exactly where it paused.
  const applyRate = (r: number) => {
    rootRef.current?.getAnimations({ subtree: true }).forEach((a) => a.updatePlaybackRate(r));
  };

  const tick = (now: number) => {
    const dt = Math.min(64, now - lastTime.current);
    lastTime.current = now;
    const tau = targetRate.current > rate.current ? EASE_UP_MS : EASE_DOWN_MS;
    rate.current += (targetRate.current - rate.current) * (1 - Math.exp(-dt / tau));
    if (Math.abs(targetRate.current - rate.current) < 0.01) {
      rate.current = targetRate.current;
      applyRate(rate.current);
      frame.current = null;
      return;
    }
    applyRate(rate.current);
    frame.current = requestAnimationFrame(tick);
  };

  const setTarget = (value: number) => {
    targetRate.current = value;
    if (frame.current == null) {
      lastTime.current = performance.now();
      frame.current = requestAnimationFrame(tick);
    }
  };

  // Hover changes only take effect once the opening run has finished, so hovering early never cuts it short.
  useEffect(() => {
    activeRef.current = active;
    if (!introDone.current) return;
    setTarget(active ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      introDone.current = true;
      setTarget(activeRef.current ? 1 : 0);
    }, INTRO_MS);
    return () => {
      window.clearTimeout(timer);
      if (frame.current != null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      className="ahf"
      aria-hidden="true"
      style={{ ['--ahf-loop' as string]: `${loopPx}px` }}
    >
      {/* Quotes: visible left of the centre line */}
      <div className="ahf-layer ahf-layer--in">
        <div className="ahf-track">
          {INDEXES.map((i) => {
            const item = FLOW[((i % FLOW.length) + FLOW.length) % FLOW.length];
            return (
              <span key={i} className="ahf-say" style={{ left: i * SLOT, width: ITEM_W }}>
                “{item.say}”
              </span>
            );
          })}
        </div>
      </div>

      {/* Care-plan cards: visible right of the centre line */}
      <div className="ahf-layer ahf-layer--out">
        <div className="ahf-track">
          {INDEXES.map((i) => {
            const item = FLOW[((i % FLOW.length) + FLOW.length) % FLOW.length];
            return (
              <span key={i} className="ahf-card" style={{ left: i * SLOT, width: ITEM_W }}>
                <span className="ahf-card-head">
                  <Check className="ahf-tick" strokeWidth={3} />
                  <b>{item.title}</b>
                </span>
                <span className="ahf-card-text">{item.card}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Mic: scrolling waveform behind the mascot */}
      <div className="ahf-mic">
        <span className="ahf-wave">
          <span className="ahf-wave-strip">
            {[...WAVE, ...WAVE].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </span>
        </span>
        <span className="ahf-mascot">
          <img src={heroIconUrl} alt="" />
        </span>
      </div>
    </div>
  );
}
