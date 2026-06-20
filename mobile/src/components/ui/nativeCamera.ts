// Native: re-export expo-camera's camera API unchanged.
// The web counterpart (nativeCamera.web.ts) stubs these out so the expo-camera
// web module graph (which constructs a CSP-blocked blob Worker at module scope)
// is never evaluated in the web bundle. See nativeCamera.web.ts for details.
export { CameraView, useCameraPermissions } from 'expo-camera';
