// Catch-all for unknown URLs (web typeable address bar / hard refresh on a bad
// path). Redirect back to the entry gate (app/index.tsx) which re-applies the
// auth/brand redirect chain. On native this is effectively unreachable.
import { Redirect } from 'expo-router';

export default function NotFound() {
  return <Redirect href="/" />;
}
