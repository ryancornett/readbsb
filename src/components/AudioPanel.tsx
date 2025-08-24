import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildAudioUrl } from "../services/audioIndex";

interface AudioPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  bookLabel?: string;
}

export default function AudioPanel({ open, onClose, bookId, chapter, bookLabel }: AudioPanelProps) {
    if (!open) return null;
  const src = useMemo(() => buildAudioUrl(bookId, chapter), [bookId, chapter]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // NEW: remember if user was playing before the chapter changed
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep isPlaying in sync with native controls
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  // When src changes, if we were playing, try to autoplay the new chapter
  useEffect(() => {
    if (!src || !audioRef.current) return;

    if (isPlaying) {
      const tryPlay = () => {
        const p = audioRef.current!.play();
        if (p && typeof p.then === "function") {
          p.catch(() => {
            // If autoplay is blocked (rare here since user already interacted),
            // retry once when media can play.
            const onCanPlay = () => {
              audioRef.current?.play().catch(() => {/* give up silently */});
              audioRef.current?.removeEventListener("canplay", onCanPlay);
            };
            audioRef.current?.addEventListener("canplay", onCanPlay, { once: true });
          });
        }
      };

      // Kick after the new <audio> mounts
      // (key={src} remounts it, so wait a tick)
      setTimeout(tryPlay, 0);
    }
  }, [src, isPlaying]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-100 dark:bg-zinc-800 border-t border-zinc-300 dark:border-zinc-700 p-4 shadow-lg z-50">
      <div className="flex items-center justify-between lg:w-[67vw] m-auto">
        <div>
          <p className="font-semibold">{bookLabel || (bookId?.toUpperCase() || "—")} {chapter}</p>
        </div>
        <button
  onClick={onClose}
  aria-label="Close audio panel"
  title="Close"
  className="rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:hover:bg-white/10 cursor-pointer transition-all duration-250 ease-out motion-reduce:transition-none"
>
  <sl-icon name="x-lg"></sl-icon>
</button>
      </div>
<div className="mt-3">
        {src ? (
          // key forces <audio> to fully reload when chapter changes
          <audio
            key={src}
            ref={audioRef}
            controls
            preload="none"
            className="w-full lg:w-[67vw] m-auto"
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
        >
            <source src={src} type="audio/mpeg" />
            Your browser does not support the audio element.
        </audio>
        ) : (
          <div className="rounded border border-zinc-300 dark:border-zinc-700 p-3 text-sm text-zinc-600 dark:text-zinc-300">
            Select a mapped book/chapter to enable audio.
          </div>
        )}
      </div>
    </div>
  );
}
