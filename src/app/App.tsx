import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { NavModeProvider } from './components/layout/NavModeContext';
import { FeatureFlagsProvider } from './data/FeatureFlagsContext';
import { RosterSettingsProvider } from './data/RosterSettingsContext';
import { FontWeightProvider } from './data/FontWeightContext';
import { FontWeightToggle } from './components/layout/FontWeightToggle';
// PasswordGate (./auth) is built and ready but deliberately not wired in
// right now — see memory: project_password_gate. Re-add by wrapping the
// return below in <PasswordGate>...</PasswordGate> and restoring this import.

export default function App() {
  useEffect(() => {
    document.documentElement.style.setProperty('overflow-anchor', 'none');
    document.body.style.setProperty('overflow-anchor', 'none');
  }, []);

  return (
    <FeatureFlagsProvider>
      <RosterSettingsProvider>
      <NavModeProvider>
        <FontWeightProvider>
          <RouterProvider router={router} />
          {/* Fixed/floating, so one mount here covers every route in one
              go rather than needing to sit inside each shell/page. See
              feedback_accessibility memory (2026-09-23) for why this
              exists and how it works. */}
          <FontWeightToggle />
        </FontWeightProvider>
      </NavModeProvider>
      </RosterSettingsProvider>
    </FeatureFlagsProvider>
  );
}