import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { Button } from './components/buttons/Button';

// A soft client-side gate, not real security — this prototype has no
// backend to authenticate against (see CLAUDE.md: "no backend, no auth").
// Its only job is to stop a shared link being casually opened by someone
// who wasn't given the password; PASSWORD is plain text in the bundle,
// readable by anyone who looks.
//
// Kept in sync by hand with the mobile prototypes' own copy —
// src/app/components/mobile/assets/auth.jsx — since the mobile apps are
// separate standalone pages that don't import from this desktop tree (see
// CLAUDE.md's mobile/vs desktop split). Change the password in both places.
const PASSWORD = 'Qwaszx123456';
const STORAGE_KEY = 'pass-proto-unlocked';

function isUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function unlock(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {}
}

/**
 * Wraps the whole app — nothing behind it renders until the right password
 * has been entered once in this browser. Gated at this level (above the
 * router) rather than per-route, so the router never mounts while locked:
 * whatever URL was actually requested — including a deep link straight
 * into one customer's document — is still what's sitting in the address
 * bar the moment it unlocks, and that's what renders. No redirect to a
 * fixed "home" needed, so a shared link still lands where it was supposed
 * to once the password's entered.
 */
export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      unlock();
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-[10px] border border-gray-200 shadow-sm p-6">
        <div className="w-10 h-10 rounded-full bg-[rgb(154,38,214)] flex items-center justify-center mb-4">
          <Lock className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">PASS UX Prototypes</h1>
        <p className="text-sm text-gray-500 mt-1 mb-4">Enter the password to view these prototypes.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false); }}
          placeholder="Password"
          className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors ${
            error
              ? 'border-red-400 focus:ring-1 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-300 focus:ring-1 focus:ring-[rgb(154,38,214)] focus:border-[rgb(154,38,214)]'
          }`}
        />
        {error && <p className="text-sm text-red-600 mt-1.5">That password isn't right — try again.</p>}
        <Button type="submit" className="w-full mt-4">Continue</Button>
      </form>
    </div>
  );
}
