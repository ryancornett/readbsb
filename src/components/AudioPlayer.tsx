import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Minimal audio player wrapper with:
 * - Plain-text speed toggle that cycles: 1.00x → 1.25x → 1.50x → 1.75x → 2.00x → 0.50x → 0.75x → 1.00x
 * - Persists preferred speed in localStorage across chapter/file changes
 * - Time display shows ELAPSED(at current speed) / TOTAL(at current speed)
 *   so elapsed never exceeds total, and both reflect wall-clock time at the chosen rate.
 * - UI ticker updates strictly every 1000ms (no faster), regardless of playbackRate.
 * - Tailwind-friendly markup (no external UI deps)
 */

type AudioPlayerProps = {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  /** If provided, called when the <audio> element mounts so parent can add listeners, etc. */
  onAudioRef?: (el: HTMLAudioElement | null) => void;
};

const SPEEDS: number[] = [1.0, 1.25, 1.5, 1.75, 2.0, 0.5, 0.75];
const LS_KEY = "bsb_playback_rate";

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "--:--";
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}

function nextSpeed(current: number): number {
  const idx = SPEEDS.indexOf(Number(current.toFixed(2)));
  if (idx === -1) return SPEEDS[0];
  return SPEEDS[(idx + 1) % SPEEDS.length];
}

export default function AudioPlayer({ src, title, className = "", autoPlay = false, onAudioRef }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    const fromLS = Number(localStorage.getItem(LS_KEY));
    return SPEEDS.includes(fromLS) ? fromLS : 1.0;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(NaN);

  // Strict 1s ticker for UI updates. We DO NOT subscribe to `timeupdate` (which can fire many times/sec).
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const readClock = () => setCurrentTime(Math.min(el.currentTime || 0, isFinite(el.duration) ? el.duration : Number.MAX_SAFE_INTEGER));
    const onMeta = () => setDuration(el.duration);
    const onRate = () => setPlaybackRate(Number(el.playbackRate.toFixed(2)));

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ratechange", onRate);

    // Initialize immediately
    onMeta();
    readClock();

    const id = window.setInterval(readClock, 1000); // exactly every second

    return () => {
      window.clearInterval(id);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ratechange", onRate);
    };
  }, [src]);

  // Apply preferred playback rate (persist across src changes)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const applyRate = () => {
      try {
        el.playbackRate = playbackRate;
      } catch {
        /* some browsers may block before metadata; we'll try again */
      }
    };

    // Try immediately and again when ready
    applyRate();
    const onCanPlay = () => applyRate();
    el.addEventListener("canplay", onCanPlay);
    return () => el.removeEventListener("canplay", onCanPlay);
  }, [playbackRate, src]);

  // Expose ref upward if requested
  useEffect(() => {
    onAudioRef?.(audioRef.current);
    return () => onAudioRef?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCycleSpeed = () => {
    const next = nextSpeed(playbackRate);
    setPlaybackRate(next);
    localStorage.setItem(LS_KEY, String(next));
    const el = audioRef.current;
    if (el) el.playbackRate = next;
  };

  const display = useMemo(() => {
    // Convert both elapsed and total to *at-speed* (wall-clock) seconds
    const rate = playbackRate || 1;
    const elapsedAtSpeed = (isFinite(currentTime) ? currentTime : 0) / rate;
    const totalAtSpeed = isFinite(duration) ? duration / rate : NaN;
    // Clamp for safety so elapsed never exceeds total visually
    const safeElapsed = isFinite(totalAtSpeed) ? Math.min(elapsedAtSpeed, totalAtSpeed) : elapsedAtSpeed;

    return {
      elapsed: formatTime(safeElapsed),
      total: formatTime(totalAtSpeed),
    };
  }, [currentTime, duration, playbackRate]);

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        controls
        controlsList="nodownload noplaybackrate noremoteplayback"
        className="w-full sm:w-1/2 sm:m-auto hide-native-time-and-menu"
        aria-label={title ?? "Audio player"}
        autoPlay={autoPlay}
      />

      {/* Controls row: speed + time readout */}
      <div className="w-full sm:w-1/2 sm:m-auto flex items-center justify-between text-sm select-none">
        <button
          type="button"
          onClick={handleCycleSpeed}
          className="font-medium underline decoration-dotted underline-offset-4 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded px-1"
          title="Change playback speed"
          aria-label="Change playback speed"
        >
          {playbackRate.toFixed(2)}x
        </button>

        <div className="tabular-nums text-muted-foreground" aria-live="polite">
          <span>{display.elapsed} / {display.total}</span>
        </div>
      </div>
    </div>
  );
}
