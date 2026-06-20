// Web QR scanner — WEB.
//
// The QR LIBRARY (@zxing/browser) is NOT the problem here: every web QR library
// reads frames from a getUserMedia <video>, and the installed iOS standalone-PWA
// WebKit bug (#252465 / #212040) hands back a permanently-muted camera track that
// delivers no frames — regardless of decoder. So this component does two things:
//
//   1. LIVE preview — a clean SINGLE getUserMedia acquisition (no teardown /
//      double-acquire, which only makes the mute worse), attached with `muted` as
//      the IDL property, with a persistent `unmute` listener. This works in normal
//      browsers, Android PWA, and Safari tabs.
//   2. PHOTO fallback — if no frames paint shortly (the iOS standalone case), we
//      surface a "take a photo" button backed by <input capture="environment">.
//      That uses the OS camera (not getUserMedia), so it works reliably in an
//      installed iOS PWA. The still is decoded with zxing's decodeFromImageUrl and
//      feeds the exact same onScan -> redeem flow.
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

// If the live preview paints no frames within this window we surface the photo
// fallback (the iOS standalone muted-track case).
const NO_FRAMES_TIMEOUT = 5000;

// TEMP: on-screen diagnostics for the iOS-PWA camera investigation. The installed
// PWA has no reachable console. The "v4" marker also confirms the new bundle
// loaded (vs a stale service-worker cache). Remove once confirmed working.
const DEBUG_CAMERA = true;

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

// True only when the element is actually rendering frames. A muted/black track
// stays paused or at currentTime 0.
function isPainting(v: HTMLVideoElement | null): boolean {
  return !!v && !v.paused && v.currentTime > 0 && v.readyState >= 2 && v.videoWidth > 0;
}

function stopTracks(stream: MediaStream | null) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    /* ignore */
  }
}

export function WebQRScanner({ onScan, onError, style }: WebQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped on every (re)start; in-flight async work checks it to self-abort.
  const genRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  // Live preview is delivering frames (vs muted/black).
  const [livePainting, setLivePainting] = useState(false);
  // Live preview failed to paint → offer the photo fallback prominently.
  const [suggestPhoto, setSuggestPhoto] = useState(false);
  // Decoding a captured photo.
  const [busy, setBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [dbg, setDbg] = useState('idle');
  // Gesture-first: the live camera is only acquired after the user taps "Start",
  // inside the user gesture (the cleanest shot at an unmuted track on iOS standalone).
  const [started, setStarted] = useState(false);

  const reader = useCallback(
    () => readerRef.current ?? (readerRef.current = new BrowserMultiFormatReader()),
    [],
  );

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const stopCapture = useCallback(() => {
    clearWatchdog();
    try {
      controlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    controlsRef.current = null;
    stopTracks(streamRef.current);
    streamRef.current = null;
    const v = videoRef.current;
    if (v) {
      try {
        v.srcObject = null;
      } catch {
        /* ignore */
      }
    }
  }, [clearWatchdog]);

  // Clean single-acquisition live preview. NO teardown-then-reacquire loop — that
  // is what aggravates the WebKit mute. If frames never arrive we simply fall back
  // to photo capture (the watchdog flips suggestPhoto).
  const startLive = useCallback(async () => {
    const myGen = ++genRef.current;
    const isCurrent = () => genRef.current === myGen;

    clearWatchdog();
    setError(null);
    setSuggestPhoto(false);
    setLivePainting(false);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
    } catch (e) {
      if (isCurrent()) {
        setError(describeError(e));
        setSuggestPhoto(true);
        onErrorRef.current?.(e);
      }
      return;
    }
    if (!isCurrent()) {
      stopTracks(stream);
      return;
    }
    streamRef.current = stream;

    const v = videoRef.current;
    if (!v) {
      stopTracks(stream);
      return;
    }
    // muted MUST be the IDL property (not just the attribute) for gesture-less
    // autoplay of a video-only stream on WebKit.
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('autoplay', '');
    v.srcObject = stream;

    // Persistent unmute listener: if the track ever starts delivering frames, the
    // preview becomes live and we drop the photo suggestion.
    const track = stream.getVideoTracks()[0];
    if (track) {
      const onUnmute = () => {
        if (genRef.current === myGen) {
          setLivePainting(true);
          setSuggestPhoto(false);
        }
      };
      track.addEventListener('unmute', onUnmute);
    }

    // Arm the no-frames watchdog SYNCHRONOUSLY, BEFORE the awaits below. This is the
    // critical fix: on a muted iOS track v.play() (and zxing's internal play wait)
    // can stay PENDING FOREVER — the "playback started" signal never fires because
    // no frames arrive. Awaiting them stalls this function, so the fallback would
    // never surface. We schedule the watchdog first, then kick off play + decode
    // fire-and-forget so a hung play() can't block the photo fallback.
    watchdogRef.current = setTimeout(() => {
      if (genRef.current !== myGen) return;
      if (isPainting(videoRef.current)) {
        setLivePainting(true);
        setSuggestPhoto(false);
      } else {
        setSuggestPhoto(true);
      }
    }, NO_FRAMES_TIMEOUT);

    // Fire-and-forget: the play() promise may never resolve for a muted track.
    v.play().catch(() => {
      /* autoplay blocked / never starts; the photo fallback still works */
    });

    // Fire-and-forget decode: zxing reads frames from the already-attached element.
    // Its internal play wait can also hang on a muted track — fine, the watchdog
    // already guarantees the fallback appears.
    reader()
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
      .catch(() => {
        /* decode failed to start; the watchdog surfaces the photo fallback */
      });
  }, [clearWatchdog, reader]);

  // Photo fallback: decode a still captured by the OS camera (<input capture>).
  const onPhotoSelected = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    setBusy(true);
    setPhotoMsg(null);
    const url = URL.createObjectURL(file);
    try {
      const result = await reader().decodeFromImageUrl(url);
      if (result) onScanRef.current(result.getText());
    } catch {
      setPhotoMsg(i18n.t('errors.qrNotFound'));
    } finally {
      URL.revokeObjectURL(url);
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [reader]);

  const openPhotoCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleStart = useCallback(() => {
    setStarted(true);
    startLive();
  }, [startLive]);

  // NO auto-start: on iOS standalone the cold-start getUserMedia returns a muted
  // track. Acquiring from an explicit user gesture (the Start button) in a fully
  // active document is the cleanest shot at an unmuted track; if it still comes
  // muted, the watchdog surfaces the photo fallback. Teardown on unmount.
  useEffect(() => {
    return () => {
      genRef.current++;
      stopCapture();
    };
  }, [stopCapture]);

  // Foreground resume: restart live only when the track is genuinely broken.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => {
      if (!started || document.visibilityState !== 'visible' || error) return;
      const track = streamRef.current?.getVideoTracks()[0];
      const broken = !track || track.readyState === 'ended';
      if (broken) {
        stopCapture();
        startLive();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [startLive, stopCapture, error, started]);

  // TEMP diagnostics readout.
  useEffect(() => {
    if (!DEBUG_CAMERA) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      const tr = streamRef.current?.getVideoTracks()[0];
      setDbg(
        `v6 started=${started ? 1 : 0} paused=${v?.paused} rs=${v?.readyState} t=${v ? v.currentTime.toFixed(1) : '-'} ` +
          `${v?.videoWidth ?? '?'}x${v?.videoHeight ?? '?'} | trk muted=${tr?.muted} ` +
          `st=${tr?.readyState} | paint=${livePainting ? 1 : 0} photo=${suggestPhoto ? 1 : 0} ` +
          `err=${error ? 1 : 0}`,
      );
    }, 400);
    return () => clearInterval(id);
  }, [livePainting, suggestPhoto, error, started]);

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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => onPhotoSelected(e.currentTarget.files?.[0])}
        />
        <button onClick={openPhotoCapture} style={primaryBtnStyle}>
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => onPhotoSelected(e.currentTarget.files?.[0])}
      />

      {DEBUG_CAMERA && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '6px 8px',
            background: 'rgba(0,128,0,0.85)',
            color: '#FFFFFF',
            fontSize: '11px',
            lineHeight: 1.3,
            fontFamily: 'monospace',
            zIndex: 10,
            pointerEvents: 'none',
            wordBreak: 'break-all',
          }}
        >
          {dbg}
        </div>
      )}

      {/* Gesture-first start screen: acquire the camera only from this user tap. */}
      {!started && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
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
            zIndex: 9,
          }}
        >
          <span style={{ fontSize: '48px', lineHeight: 1 }}>📷</span>
          <button onClick={handleStart} style={primaryBtnStyle}>
            {i18n.t('errors.startCamera')}
          </button>
          <button onClick={openPhotoCapture} style={secondaryBtnStyle}>
            {busy ? '…' : i18n.t('errors.photoScan')}
          </button>
          {photoMsg ? <span style={{ fontSize: '13px', opacity: 0.9 }}>{photoMsg}</span> : null}
        </div>
      )}

      {/* Photo fallback: prominent when live failed to paint (iOS standalone). */}
      {started && suggestPhoto && !livePainting && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            padding: '24px',
            boxSizing: 'border-box',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.82)',
            color: '#FFFFFF',
            zIndex: 9,
          }}
        >
          <span style={{ fontSize: '44px', lineHeight: 1 }}>📷</span>
          <span style={{ fontSize: '15px', lineHeight: 1.5 }}>{i18n.t('errors.photoHint')}</span>
          <button onClick={openPhotoCapture} style={primaryBtnStyle}>
            {busy ? '…' : i18n.t('errors.photoScan')}
          </button>
          {photoMsg ? <span style={{ fontSize: '13px', opacity: 0.9 }}>{photoMsg}</span> : null}
        </div>
      )}
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '12px 28px',
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

export default WebQRScanner;
