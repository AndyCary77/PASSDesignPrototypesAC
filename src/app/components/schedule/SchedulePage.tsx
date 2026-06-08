import { useState } from 'react';
import { VisitSlideout } from './VisitSlideout';

export function SchedulePage() {
  const [slideoutOpen, setSlideoutOpen] = useState(true);

  return (
    <>
      <div className="h-96 flex items-center justify-center text-gray-400 text-sm">
        Schedule view
      </div>

      {slideoutOpen && <VisitSlideout onClose={() => setSlideoutOpen(false)} />}
    </>
  );
}
