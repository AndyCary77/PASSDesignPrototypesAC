// React wrapper for <plan-teaser>. Import once anywhere: import './plan-teaser.js';
import { useEffect, useRef } from 'react';
import './plan-teaser.js';

export default function PlanTeaser({ className, style, replayOnHover = true, autoplay = true, onEnd }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !onEnd) return;
    el.addEventListener('teaser-end', onEnd);
    return () => el.removeEventListener('teaser-end', onEnd);
  }, [onEnd]);
  return (
    <plan-teaser
      ref={ref}
      class={className}
      style={style}
      autoplay={String(autoplay)}
      replay-on-hover={String(replayOnHover)}
    />
  );
}
