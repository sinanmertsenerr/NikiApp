// Mobile frame — NATIVE (no-op passthrough).
// On native the app already fills the device screen, so this just renders its
// children. The web counterpart (MobileFrame.web.tsx) wraps the app in a centered
// phone-width column so the website looks like a mobile app on desktop.
import React from 'react';

export function MobileFrame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default MobileFrame;
