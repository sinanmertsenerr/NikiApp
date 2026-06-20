// Web stub for expo-camera's native-only camera API.
//
// scan-qr.tsx imports { CameraView, useCameraPermissions } from this module.
// On web, expo-camera's CameraView transitively evaluates
// node_modules/expo-camera/build/web/useWebQRScanner.js, which at MODULE SCOPE
// runs `new Worker(URL.createObjectURL(blob))`. The production CSP has no
// worker-src, so that throws a synchronous SecurityError during route-module
// evaluation and crashes into the root ErrorBoundary.
//
// On web the camera UI is never used: the screen renders <WebQRScanner/> via the
// Platform.OS === 'web' branch, and `permission` is only read behind
// Platform.OS !== 'web'. These inert stubs keep expo-camera out of the web bundle.
import type { ComponentType } from 'react';

export const CameraView: ComponentType<any> = () => null;

export function useCameraPermissions() {
  return [null, async () => null] as const;
}
