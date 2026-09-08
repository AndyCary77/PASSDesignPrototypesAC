import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { NavModeProvider } from './components/layout/NavModeContext';
import { FeatureFlagsProvider } from './data/FeatureFlagsContext';
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
      <NavModeProvider>
        <RouterProvider router={router} />
      </NavModeProvider>
    </FeatureFlagsProvider>
  );
}