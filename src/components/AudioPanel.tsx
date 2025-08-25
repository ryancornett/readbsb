import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildAudioUrl } from "../services/audioIndex";
import AudioPlayer from "./AudioPlayer";
import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

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

  // Keep a ref to the underlying <audio> inside AudioPlayer
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Remember if user was playing before the chapter changed
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep isPlaying in sync with native events (from the inner <audio>)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [src]); // rebind on chapter change

  // When src changes, if we were playing, try to autoplay the new chapter
  useEffect(() => {
    const el = audioRef.current;
    if (!src || !el) return;

    if (isPlaying) {
      const tryPlay = () => {
        const p = el.play();
        if (p && typeof p.then === "function") {
          p.catch(() => {
            const onCanPlay = () => {
              el.play().catch(() => {/* give up silently */});
              el.removeEventListener("canplay", onCanPlay);
            };
            el.addEventListener("canplay", onCanPlay, { once: true });
          });
        }
      };
      // Wait a microtask to ensure the new src is set
      setTimeout(tryPlay, 0);
    }
  }, [src, isPlaying]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-100 dark:bg-zinc-800 border-t border-zinc-300 dark:border-zinc-700 p-4 shadow-lg z-50">
      <div className="flex items-center justify-between sm:w-1/2 m-auto">
        <div>
          <p className="font-semibold">{bookLabel || (bookId?.toUpperCase() || "—")} {chapter}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close audio panel"
          title="Close"
          className="rounded p-2 hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:hover:bg-white/10 cursor-pointer transition-all duration-250 ease-out motion-reduce:transition-none"
        >
          <SlIcon name="x-lg" />
        </button>
      </div>

      <div className="mt-3">
        {src ? (
          <div className="w-full m-auto">
            <AudioPlayer
              src={src}
              title={`${bookLabel || bookId?.toUpperCase() || ""} ${chapter}`}
              autoPlay={false /* resume handled by isPlaying effect above */}
              onAudioRef={(el) => { audioRef.current = el; }}
            />
          </div>
        ) : (
          <div className="rounded border border-zinc-300 dark:border-zinc-700 p-3 text-sm text-zinc-600 dark:text-zinc-300">
            Select a mapped book/chapter to enable audio.
          </div>
        )}
      </div>
    </div>
  );
}
