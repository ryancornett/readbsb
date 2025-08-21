import { BibleClient, PassageReference } from '@gracious.tech/fetch-client';

let client: BibleClient | null = null;
let collectionPromise: Promise<any> | null = null;

/** Lazily initialize the client & collection (defaults to v1.fetch.bible) */
async function getCollection() {
  if (!client) client = new BibleClient(); // defaults to official collection
  if (!collectionPromise) collectionPromise = client.fetch_collection();
  return collectionPromise;
}

/** Resolve the BSB translation id (cache once) */
let bsbIdPromise: Promise<string> | null = null;
async function getBsbId() {
  if (!bsbIdPromise) {
    bsbIdPromise = (async () => {
      const col = await getCollection();
      const translations = col.get_translations() as Array<{ id: string; name: string; abbr?: string }>;
      // Try exact “BSB” id first, then name contains “Berean Standard Bible”
      const exact = translations.find(t => t.id.toUpperCase() === 'BSB');
      if (exact) return exact.id;
      const byName = translations.find(t => /berean\s+standard\s+bible/i.test(t.name));
      if (byName) return byName.id;
      // Fallback: prefer any “Berean” match
      const berean = translations.find(t => /berean/i.test(t.name) || /BSB/i.test(t.abbr ?? ''));
      if (berean) return berean.id;
      throw new Error('BSB not found in collection.');
    })();
  }
  return bsbIdPromise;
}

/** Ensure translation extras (book names, counts) are loaded once */
let extrasLoaded = false;
async function ensureExtrasLoaded() {
  if (extrasLoaded) return;
  const col = await getCollection();
  const bsbId = await getBsbId();
  await col.fetch_translation_extras(bsbId); // required to get localized book names
  extrasLoaded = true;
}

/** Get list of books with chapter counts */
export async function listBooks() {
  await ensureExtrasLoaded();
  const col = await getCollection();
  const bsbId = await getBsbId();
  const books = col.get_books(bsbId) as Array<{ id: string; name: string; chapters: number; abbr?: string }>;
  return books;
}

/** Fetch a chapter’s HTML for a given book id and chapter number */
export async function fetchChapterHtml(bookId: string, chapter: number) {
  await ensureExtrasLoaded();
  const col = await getCollection();
  const bsbId = await getBsbId();
  const book = await col.fetch_book(bsbId, bookId);
  return book.get_chapter(chapter) as string; // returns HTML string
}

/** Optional: parse string refs (“John 3”) to a structured reference */
export function parseRef(input: string) {
  return PassageReference.from_string(input); // exposed by the client
}
