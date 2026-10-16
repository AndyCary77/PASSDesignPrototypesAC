import { useState } from 'react';
import { EmployeesListDummy } from './EmployeesListDummy';

// Same key as the Customers list's demo switch, so the area-colour choice
// carries across both lists. Stored as 'on' | 'off'; reads and writes are
// guarded, since storage can be unavailable (private windows, blocked data).
const AREA_COLOURS_KEY = 'customersListAreaColours';

function readStored(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeStored(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export function EmployeesListPage() {
  const [areaColours, setAreaColours] = useState(() => readStored(AREA_COLOURS_KEY, 'on') === 'on');
  const toggleAreaColours = () => {
    setAreaColours(prev => {
      writeStored(AREA_COLOURS_KEY, prev ? 'off' : 'on');
      return !prev;
    });
  };

  return (
    <>
      <EmployeesListDummy colouredAreaTags={areaColours} />
      {/* Demo-only, faint until hovered/focused: turns the area tags' colours on and off. */}
      <div className="fixed right-6 bottom-6 z-50 opacity-40 hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={toggleAreaColours}
          aria-pressed={areaColours}
          className="px-3.5 py-2 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-800 cursor-pointer"
        >
          {areaColours ? 'Demo: area colours on' : 'Demo: area colours off'}
        </button>
      </div>
    </>
  );
}
