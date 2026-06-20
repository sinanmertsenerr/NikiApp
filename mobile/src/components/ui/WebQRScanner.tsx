// Web QR scanner — NATIVE stub.
// Never rendered on native (the admin scan-qr screen keeps using expo-camera's
// CameraView under a Platform.OS !== 'web' branch). The web counterpart
// (WebQRScanner.web.tsx) decodes QR codes from a getUserMedia video stream.
import React from 'react';

export interface WebQRScannerProps {
  onScan: (text: string) => void;
  onError?: (err: unknown) => void;
  style?: Record<string, unknown>;
}

export function WebQRScanner(_props: WebQRScannerProps) {
  return null;
}

export default WebQRScanner;
