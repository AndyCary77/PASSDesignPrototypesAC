import { useEffect, useState } from 'react';

export function useScrolled() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const handler = () => {
      if (window.scrollY > 80) setHidden(true);
      else if (window.scrollY < 40) setHidden(false);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return hidden;
}
