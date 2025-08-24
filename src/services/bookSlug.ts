// src/lib/audio.ts
export function slugForBook(book: string) {
  // normalize to match your repo folder names
  return book.replace(/\s+/g, "_");
}

export function audioUrl(book: string, chapter: number) {
  const folder = slugForBook(book);
  // Example path: BSB/Genesis/Genesis_01.mp3
  const file = `${slugForBook(book)}_${String(chapter).padStart(2, "0")}.mp3`;
  return `https://raw.githubusercontent.com/ryancornett/Bible_Audio/main/BSB/${folder}/${file}`;
}
