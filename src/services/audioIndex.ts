import { audioPath, audioUrls } from "./urls";

export type BookId = string;

export function buildAudioUrl(bookId: string, chapter: number): string | null {
  const list = audioUrls[bookId.toUpperCase()];
  if (!list) return null;
  const idx = chapter - 1;
  const rel = list[idx];
  if (!rel) return null;
  return audioPath + rel;
}
