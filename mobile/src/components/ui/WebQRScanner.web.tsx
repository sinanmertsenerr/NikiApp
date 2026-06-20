// Web QR scanner — WEB.
//
// Two modes, picked by display-mode:
//   * INSTALLED PWA (standalone) → PHOTO capture only. The live getUserMedia
//     preview is permanently black in an iOS standalone PWA (WebKit muted-track
//     bug #252465 — confirmed un-fixable on-device), so we skip it entirely and
//     use <input type="file" capture="environment">. That opens the OS camera;
//     the still is handed straight to the page and is NOT saved to the gallery.
//     zxing decodes the photo and feeds the same onScan -> redeem flow.
//   * BROWSER / Safari tab (not standalone) → LIVE camera scan via getUserMedia +
//     zxing, which works fine there.
//
// The QR library is irrelevant to the standalone bug — every web QR lib reads from
// the same muted getUserMedia stream — so switching libraries would not help.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import i18n from '@/i18n';

export interface WebQRScannerProps {
  onScan: (text: string) => void;
  onError?: (err: unknown) => void;
  style?: Record<string, unknown>;
}

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: 'environment' },
  audio: false,
};

// Installed PWA launched from the home screen (standalone display mode).
function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const mql =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return Boolean(mql || iosStandalone);
  } catch {
    return false;
  }
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
  const [standalone] = useState(isStandalonePWA);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Bumped on every (re)start; in-flight async work checks it to self-abort.
  const genRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);

  const getReader = useCallback(
    () => readerRef.current ?? (readerRef.current = new BrowserMultiFormatReader()),
    [],
  );

  // ---- Photo capture (PWA primary path; also web error fallback). Uses the OS
  //      camera via <input capture>; the still is NOT written to the gallery.
  const onPhotoSelected = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      setBusy(true);
      setPhotoMsg(null);
      const url = URL.createObjectURL(file);
      try {
        const result = await getReader().decodeFromImageUrl(url);
        if (result) onScanRef.current(result.getText());
        else setPhotoMsg(i18n.t('errors.qrNotFound'));
      } catch {
        setPhotoMsg(i18n.t('errors.qrNotFound'));
      } finally {
        URL.revokeObjectURL(url);
        setBusy(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [getReader],
  );

  const openPhotoCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ---- Live scanning (browser / Safari tab only).
  const stopCapture = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    controlsRef.current = null;
    const s = streamRef.current;
    if (s) {
      try {
        s.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
    }
    streamRef.current = null;
    const v = videoRef.current;
    if (v) {
      try {
        v.srcObject = null;
      } catch {
        /* ignore */
      }
    }
  }, []);

  const startLive = useCallback(async () => {
    const myGen = ++genRef.current;
    const isCurrent = () => genRef.current === myGen;
    setError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
    } catch (e) {
      if (isCurrent()) {
        setError(describeError(e));
        onErrorRef.current?.(e);
      }
      return;
    }
    if (!isCurrent()) {
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      return;
    }
    streamRef.current = stream;

    const v = videoRef.current;
    if (!v) {
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      return;
    }
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('autoplay', '');
    v.srcObject = stream;
    // Fire-and-forget: the play() promise can stay pending on some tracks.
    v.play().catch(() => {
      /* ignore */
    });

    getReader()
      .decodeFromVideoElement(v, (result) => {
        if (genRef.current === myGen && result) onScanRef.current(result.getText());
      })
      .then((controls) => {
        if (genRef.current !== myGen) {
          try {
            controls.stop();
          } catch {
            /* ignore */
          }
          return;
        }
        controlsRef.current = controls;
      })
      .catch((e) => {
        if (isCurrent()) {
          setError(describeError(e));
          onErrorRef.current?.(e);
        }
      });
  }, [getReader]);

  // Web → auto-start live. PWA → never touch getUserMedia (photo only).
  useEffect(() => {
    if (standalone) return;
    startLive();
    return () => {
      genRef.current++;
      stopCapture();
    };
  }, [standalone, startLive, stopCapture]);

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      style={{ display: 'none' }}
      onChange={(e) => onPhotoSelected(e.currentTarget.files?.[0])}
    />
  );

  // ===== INSTALLED PWA: photo capture only =====
  if (standalone) {
    return (
      <div
        onClick={busy ? undefined : openPhotoCapture}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          boxSizing: 'border-box',
          textAlign: 'center',
          background: '#000000',
          color: '#FFFFFF',
          cursor: 'pointer',
          ...(style || {}),
        }}
      >
        {hiddenInput}
        <span style={{ fontSize: '56px', lineHeight: 1 }}>📷</span>
        <span style={{ fontSize: '16px', lineHeight: 1.5, maxWidth: '320px' }}>
          {i18n.t('errors.photoHint')}
        </span>
        <button
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            openPhotoCapture();
          }}
          style={primaryBtnStyle}
        >
          {busy ? '…' : i18n.t('errors.photoScan')}
        </button>
        {photoMsg ? <span style={{ fontSize: '13px', opacity: 0.9 }}>{photoMsg}</span> : null}
      </div>
    );
  }

  // ===== BROWSER / Safari tab: live camera, photo as error fallback =====
  if (error) {
    return (
      <div style={{ ...errorContainerStyle, ...(style || {}) }}>
        {hiddenInput}
        <span>{error}</span>
        <button disabled={busy} onClick={openPhotoCapture} style={primaryBtnStyle}>
          {busy ? '…' : i18n.t('errors.photoScan')}
        </button>
        <button
          onClick={() => {
            stopCapture();
            setError(null);
            startLive();
          }}
          style={secondaryBtnStyle}
        >
          {i18n.t('errors.reload')}
        </button>
        {photoMsg ? <span style={{ fontSize: '13px' }}>{photoMsg}</span> : null}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...(style || {}) }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000000',
        }}
      />
      {hiddenInput}
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '14px 32px',
  borderRadius: '12px',
  border: 'none',
  background: '#FFFFFF',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.5)',
  background: 'transparent',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
};

const errorContainerStyle: React.CSSProperties = {
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
  background: '#000000',
  fontSize: '15px',
  lineHeight: 1.5,
  gap: '16px',
};

export default WebQRScanner;
