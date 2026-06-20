// Web QR scanner — WEB.
// expo-camera's onBarcodeScanned never fires on web, so the admin QR-scan flow
// uses @zxing/browser to decode QR codes from a getUserMedia <video> stream and
// feeds the decoded text to the same handler the native CameraView uses.
// Requires a secure context (https or localhost) for camera access.
//
// iOS standalone PWA hardening (WebKit #252465 / #215884 / #179363):
//   * We OWN getUserMedia (single acquisition) and hand the already-playing
//     element to zxing for DECODE ONLY — a second getUserMedia would re-mute the
//     first track and black the preview (#179363).
//   * We set `muted` as the IDL PROPERTY (React's JSX `muted` and zxing only set
//     the attribute, which WebKit does not reflect → autoplay can be blocked).
//   * A freshly acquired track can arrive muted after an SPA route change and
//     never deliver frames; we wait briefly for `unmute`, then re-acquire once.
//   * If autoplay is rejected or no frames paint, we surface a one-tap overlay
//     that restarts capture inside the user gesture (the reliable iOS fallback).
//   * On returning to the foreground we restart if the track is muted/ended.
// Browsers and Android PWA autoplay a muted video-only stream, so they never see
// the tap overlay — the path is unchanged for them.
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

// If play() resolves but no frames paint within this window (a slipped-through
// muted track), we re-offer the tap overlay. After MAX_RECOVERY_ATTEMPTS such
// failures we surface a concrete error instead of looping on a black screen.
const NO_FRAMES_TIMEOUT = 2000;
const MAX_RECOVERY_ATTEMPTS = 3;

// TEMP: on-screen diagnostics for the iOS-PWA black-camera investigation. The
// installed PWA has no reachable console, so we surface live video/track state on
// screen. The "v3" marker also confirms the new bundle actually loaded (vs a stale
// service-worker cache). Remove once the camera is confirmed working.
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

// True only when the element is actually rendering frames (matches zxing's
// internal isVideoPlaying). A muted/black track stays paused or at currentTime 0.
function isPainting(v: HTMLVideoElement | null): boolean {
  return !!v && !v.paused && v.currentTime > 0 && v.readyState >= 2 && v.videoWidth > 0;
}

export function WebQRScanner({ onScan, onError, style }: WebQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
  // Consecutive no-frames recoveries within one screen visit (reset on mount).
  const attemptsRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [dbg, setDbg] = useState('starting…');

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
  }, [clearWatchdog]);

  // Resolves true once the track is delivering frames (unmuted), false on timeout.
  const waitForUnmute = (track: MediaStreamTrack, ms: number) =>
    new Promise<boolean>((resolve) => {
      if (!track.muted) {
        resolve(true);
        return;
      }
      let done = false;
      const finish = (val: boolean) => {
        if (done) return;
        done = true;
        track.removeEventListener('unmute', onUnmute);
        clearTimeout(timer);
        resolve(val);
      };
      const onUnmute = () => finish(true);
      track.addEventListener('unmute', onUnmute);
      const timer = setTimeout(() => finish(!track.muted), ms);
    });

  const acquire = useCallback(async (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
  }, []);

  // Arm after every (re)start — including the gesture path — so a muted track
  // that slips through play() never leaves a dead black screen: if no frames
  // paint, re-offer the tap, and after MAX_RECOVERY_ATTEMPTS show a real error.
  const armRecovery = useCallback(
    (myGen: number) => {
      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        if (genRef.current !== myGen) return;
        if (isPainting(videoRef.current)) {
          attemptsRef.current = 0;
          setNeedsTap(false);
          return;
        }
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_RECOVERY_ATTEMPTS) {
          setNeedsTap(false);
          setError(i18n.t('errors.cameraGeneric'));
        } else {
          setNeedsTap(true);
        }
      }, NO_FRAMES_TIMEOUT);
    },
    [clearWatchdog],
  );

  const start = useCallback(
    async (viaGesture: boolean) => {
      const myGen = ++genRef.current;
      const isCurrent = () => genRef.current === myGen;
      const dump = (s: MediaStream) => {
        try {
          s.getTracks().forEach((t) => t.stop());
        } catch {
          /* ignore */
        }
      };

      clearWatchdog();
      setError(null);
      setNeedsTap(false);

      // 1) Acquire the stream ourselves (single getUserMedia, reused by zxing).
      let stream: MediaStream;
      try {
        stream = await acquire();
      } catch (e) {
        if (isCurrent()) {
          setError(describeError(e));
          onErrorRef.current?.(e);
        }
        return;
      }
      if (!isCurrent()) {
        dump(stream);
        return;
      }
      streamRef.current = stream;

      // 2) Muted-track recovery (WebKit #252465 / #215884): a track acquired right
      //    after an SPA route change can arrive muted and never paint. Wait for
      //    `unmute`; if it stays muted, re-acquire once (the retry usually unmutes).
      let track = stream.getVideoTracks()[0];
      if (track && track.muted) {
        const ok = await waitForUnmute(track, 1500);
        if (!isCurrent()) {
          dump(stream);
          return;
        }
        if (!ok) {
          dump(stream);
          try {
            stream = await acquire();
          } catch (e) {
            if (isCurrent()) {
              setError(describeError(e));
              onErrorRef.current?.(e);
            }
            return;
          }
          if (!isCurrent()) {
            dump(stream);
            return;
          }
          streamRef.current = stream;
          track = stream.getVideoTracks()[0];
        }
      }

      // 3) Attach. Set muted as the PROPERTY (not just the attribute) so WebKit
      //    allows gesture-less play of the video-only stream.
      const v = videoRef.current;
      if (!v) {
        dump(stream);
        return;
      }
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('autoplay', '');
      v.srcObject = stream;

      // 4) Play. Muted video-only autoplays in browsers + Android PWA; iOS
      //    standalone may reject → show the one-tap restart overlay.
      try {
        await v.play();
      } catch {
        if (isCurrent()) setNeedsTap(true);
        return;
      }
      if (!isCurrent()) return;
      setNeedsTap(false);

      // 5) DECODE ONLY via the already-playing element — no second getUserMedia.
      try {
        const reader =
          readerRef.current ?? (readerRef.current = new BrowserMultiFormatReader());
        const controls = await reader.decodeFromVideoElement(v, (result) => {
          if (genRef.current === myGen && result) onScanRef.current(result.getText());
        });
        // A teardown/restart may have happened during the await — abort cleanly so
        // we don't leave an orphaned zxing scan loop running.
        if (!isCurrent()) {
          try {
            controls.stop();
          } catch {
            /* ignore */
          }
          return;
        }
        controlsRef.current = controls;
      } catch (e) {
        if (isCurrent()) {
          setError(describeError(e));
          onErrorRef.current?.(e);
        }
        return;
      }

      // 6) Watchdog (always, incl. the gesture path): play() can resolve while a
      //    muted track still paints nothing (WebKit #252465). Re-check and recover
      //    so the worst case is a tap affordance / error, never a dead black screen.
      armRecovery(myGen);
    },
    [acquire, clearWatchdog, armRecovery],
  );

  // Start on mount; full teardown on unmount.
  useEffect(() => {
    attemptsRef.current = 0;
    start(false);
    return () => {
      genRef.current++;
      stopCapture();
    };
  }, [start, stopCapture]);

  // Foreground resume: iOS can mute/end the track while backgrounded. Restart if
  // the stream is broken or the element isn't painting anymore.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.visibilityState !== 'visible' || error) return;
      // Only restart when the track is genuinely broken. A backgrounded desktop
      // tab can report a paused-but-live element, so do NOT restart on !isPainting
      // alone — that would cause an unnecessary teardown + re-acquire flicker.
      const track = streamRef.current?.getVideoTracks()[0];
      const broken = !track || track.readyState === 'ended' || track.muted;
      if (broken) {
        stopCapture();
        start(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [start, stopCapture, error]);

  // TEMP diagnostics: sample live video/track state for the on-screen readout.
  useEffect(() => {
    if (!DEBUG_CAMERA) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      const tr = streamRef.current?.getVideoTracks()[0];
      setDbg(
        `v3 paused=${v?.paused} rs=${v?.readyState} t=${v ? v.currentTime.toFixed(1) : '-'} ` +
          `${v?.videoWidth ?? '?'}x${v?.videoHeight ?? '?'} | trk muted=${tr?.muted} ` +
          `st=${tr?.readyState} en=${tr?.enabled} | tap=${needsTap} err=${error ? 1 : 0} ` +
          `stream=${streamRef.current ? 1 : 0}`,
      );
    }, 400);
    return () => clearInterval(id);
  }, [needsTap, error]);

  const handleTap = useCallback(() => {
    // Inside the user gesture — the most permissive state to (re)acquire + play.
    stopCapture();
    start(true);
  }, [start, stopCapture]);

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
            stopCapture();
            setError(null);
            start(true);
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
      {needsTap && (
        <button
          onClick={handleTap}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            border: 'none',
            background: 'rgba(0,0,0,0.55)',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '40px', lineHeight: 1 }}>📷</span>
          <span>{i18n.t('errors.cameraTapToStart')}</span>
        </button>
      )}
    </div>
  );
}

export default WebQRScanner;
