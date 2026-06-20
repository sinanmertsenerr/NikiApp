// Web QR scanner — WEB.
// expo-camera's onBarcodeScanned never fires on web, so the admin QR-scan flow
// uses @zxing/browser to decode QR codes from a getUserMedia <video> stream and
// feeds the decoded text to the same handler the native CameraView uses.
// Requires a secure context (https or localhost) for camera access; on
// permission-denied / insecure-context it shows a visible message instead of a
// silent black screen.
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import i18n from '@/i18n';

export interface WebQRScannerProps {
  onScan: (text: string) => void;
  onError?: (err: unknown) => void;
  style?: Record<string, unknown>;
}

function describeError(err: unknown): string {
  const name = (err as { name?: string })?.name;
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return i18n.t('errors.cameraInsecure');
  }
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return i18n.t('errors.cameraPermission');
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return i18n.t('errors.cameraNotFound');
  }
  return i18n.t('errors.cameraGeneric');
}

export function WebQRScanner({ onScan, onError, style }: WebQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: IScannerControls | undefined;
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (cancelled || !result) return;
        onScanRef.current(result.getText());
      })
      .then((c) => {
        controls = c;
        if (cancelled) c.stop();
      })
      .catch((e) => {
        setError(describeError(e));
        onErrorRef.current?.(e);
      });

    return () => {
      cancelled = true;
      try {
        controls?.stop();
      } catch {
        /* ignore */
      }
    };
  }, [retryKey]);

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          color: '#FFFFFF',
          backgroundColor: '#000000',
          fontSize: '15px',
          lineHeight: 1.5,
          gap: '16px',
          ...(style || {}),
        }}
      >
        <span>{error}</span>
        <button
          onClick={() => {
            setError(null);
            setRetryKey((k) => k + 1);
          }}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: 'none',
            background: '#FFFFFF',
            color: '#000000',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {i18n.t('errors.reload')}
        </button>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...(style || {}) }}
    />
  );
}

export default WebQRScanner;
